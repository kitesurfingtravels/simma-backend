import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// === MONGODB CONNECTION ===
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✓ MongoDB connesso')).catch(err => console.error('❌ MongoDB:', err));

// === SCHEMI MONGODB ===
const TaskSchema = new mongoose.Schema({
  assetId: String,
  assetCode: String,
  assetName: String,
  title: String,
  description: String,
  frequency: String, // daily, weekly, monthly, quarterly, yearly
  requiredMaterials: [String],
  estimatedTime: String,
  priority: String,
  steps: [String],
  createdFrom: String, // nome file PDF
  createdAt: { type: Date, default: Date.now }
});

const MaterialSchema = new mongoose.Schema({
  assetId: String,
  assetCode: String,
  name: String,
  partNumber: String,
  quantity: Number,
  unit: String,
  supplier: String,
  estimatedCost: String,
  createdFrom: String,
  createdAt: { type: Date, default: Date.now }
});

const AssetSchema = new mongoose.Schema({
  code: String,
  name: String,
  manual: String,
  manualFile: String,
  manualText: String, // testo estratto dal PDF
  tasks: [String], // IDs dei task
  materials: [String], // IDs dei ricambi
  createdAt: { type: Date, default: Date.now }
});

const ExecutionSchema = new mongoose.Schema({
  taskId: String,
  assetId: String,
  date: String,
  userName: String,
  timestamp: String,
  done: Boolean,
  notes: String,
  materialsUsed: [{ name: String, quantity: Number }],
  createdAt: { type: Date, default: Date.now }
});

const IssueSchema = new mongoose.Schema({
  assetId: String,
  date: String,
  timestamp: String,
  description: String,
  severity: String,
  userName: String,
  resolved: Boolean,
  cause: String,
  resolution: String,
  resolvedBy: String,
  resolvedAt: String,
  attachments: [{ name: String, type: String, data: String }],
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);
const Material = mongoose.model('Material', MaterialSchema);
const Asset = mongoose.model('Asset', AssetSchema);
const Execution = mongoose.model('Execution', ExecutionSchema);
const Issue = mongoose.model('Issue', IssueSchema);

// === CLAUDE API ===
const client = new Anthropic();

// === MULTER (FILE UPLOAD) ===
const upload = multer({ storage: multer.memoryStorage() });

// === HELPER: EXTRACT TEXT FROM PDF ===
const extractPdfText = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF parsing error:', err);
    return '';
  }
};

// === HELPER: ANALYZE WITH CLAUDE ===
const analyzeManualWithClaude = async (pdfText, assetCode, assetName) => {
  const prompt = `
Analizza questo manuale di manutenzione per il macchinario: ${assetName} (${assetCode})

ESTRAI QUESTI DATI IN FORMATO JSON:

{
  "asset": {
    "code": "${assetCode}",
    "name": "${assetName}"
  },
  "tasks": [
    {
      "title": "Nome task",
      "description": "Descrizione breve",
      "frequency": "daily|weekly|monthly|quarterly|yearly",
      "priority": "bassa|media|alta",
      "estimatedTime": "es. 30 minuti",
      "steps": ["Passo 1", "Passo 2", "Passo 3"],
      "requiredMaterials": ["Nome ricambio 1", "Nome ricambio 2"]
    }
  ],
  "materials": [
    {
      "name": "Nome ricambio",
      "partNumber": "Codice articolo",
      "quantity": 1,
      "unit": "pezzi|litri|kg",
      "supplier": "Fornitore se presente",
      "estimatedCost": "Se indicato nel manuale"
    }
  ]
}

REGOLE:
- Estrai TUTTE le attività di manutenzione descritte
- Se non specificate, assegna frequenze ragionevoli
- Associa i ricambi alle task che li usano
- Sii dettagliato ma conciso
- Se manca info, lascia vuoto o scrivi "da_determinare"

MANUALE:
${pdfText.substring(0, 8000)}
`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  try {
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('JSON parsing error:', err);
  }

  return null;
};

// === ENDPOINT: UPLOAD E ANALIZZA MANUALE ===
app.post('/api/analyze-manual', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File richiesto' });
    }

    const { assetCode, assetName } = req.body;
    const fileName = req.file.originalname;

    // Estrai testo dal PDF
    const pdfText = await extractPdfText(req.file.buffer);
    if (!pdfText) {
      return res.status(400).json({ error: 'Impossibile leggere il PDF' });
    }

    // Analizza con Claude
    const analyzed = await analyzeManualWithClaude(pdfText, assetCode, assetName);
    if (!analyzed) {
      return res.status(400).json({ error: 'Errore nell\'analisi con Claude' });
    }

    // Salva Asset
    let asset = await Asset.findOne({ code: assetCode });
    if (!asset) {
      asset = new Asset({
        code: assetCode,
        name: assetName,
        manualFile: fileName,
        manualText: pdfText.substring(0, 5000),
        tasks: [],
        materials: []
      });
    } else {
      asset.manualFile = fileName;
      asset.manualText = pdfText.substring(0, 5000);
    }

    // Salva Tasks
    const taskIds = [];
    for (const taskData of analyzed.tasks) {
      const task = new Task({
        assetId: asset._id,
        assetCode,
        assetName,
        title: taskData.title,
        description: taskData.description,
        frequency: taskData.frequency || 'monthly',
        priority: taskData.priority || 'media',
        estimatedTime: taskData.estimatedTime || 'da_determinare',
        steps: taskData.steps || [],
        requiredMaterials: taskData.requiredMaterials || [],
        createdFrom: fileName
      });
      await task.save();
      taskIds.push(task._id);
    }

    // Salva Materials
    const materialIds = [];
    for (const matData of analyzed.materials) {
      const material = new Material({
        assetId: asset._id,
        assetCode,
        name: matData.name,
        partNumber: matData.partNumber || '',
        quantity: matData.quantity || 1,
        unit: matData.unit || 'pezzi',
        supplier: matData.supplier || '',
        estimatedCost: matData.estimatedCost || '',
        createdFrom: fileName
      });
      await material.save();
      materialIds.push(material._id);
    }

    // Update Asset
    asset.tasks = taskIds;
    asset.materials = materialIds;
    await asset.save();

    res.json({
      success: true,
      asset: {
        id: asset._id,
        code: asset.code,
        name: asset.name,
        tasksCreated: taskIds.length,
        materialsCreated: materialIds.length
      },
      analyzed
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: GET ASSETS ===
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await Asset.find().lean();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: GET TASKS BY ASSET ===
app.get('/api/assets/:assetId/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ assetId: req.params.assetId }).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: GET MATERIALS BY ASSET ===
app.get('/api/assets/:assetId/materials', async (req, res) => {
  try {
    const materials = await Material.find({ assetId: req.params.assetId }).lean();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: EXECUTE TASK ===
app.post('/api/executions', async (req, res) => {
  try {
    const execution = new Execution(req.body);
    await execution.save();
    res.json({ success: true, id: execution._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: GET EXECUTIONS ===
app.get('/api/executions', async (req, res) => {
  try {
    const executions = await Execution.find().lean();
    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: CREATE ISSUE ===
app.post('/api/issues', async (req, res) => {
  try {
    const issue = new Issue(req.body);
    await issue.save();
    res.json({ success: true, id: issue._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: GET ISSUES ===
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await Issue.find().lean();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINT: UPDATE ISSUE ===
app.put('/api/issues/:id', async (req, res) => {
  try {
    await Issue.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SIMMA AI Server in esecuzione su http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
