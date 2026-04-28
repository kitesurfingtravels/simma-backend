import React, { useState, useEffect } from 'react';
import { Upload, Plus, CheckCircle2, AlertTriangle, Package, LogOut, Wrench, Activity, Clock, X } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// ========== HELPERS ==========
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

const USERS = ['Marco', 'Luigi', 'Anna', 'Carlo', 'Giulia', 'Davide'];
const USER_COLORS = {
  'Marco': '#fbbf24', 'Luigi': '#60a5fa', 'Anna': '#f87171', 'Carlo': '#34d399',
  'Giulia': '#a78bfa', 'Davide': '#fb923c'
};

const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export default function App() {
  const [tab, setTab] = useState('upload');
  const [assets, setAssets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(true);
  const [userInput, setUserInput] = useState('');

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [a, t, m, e, i] = await Promise.all([
          apiFetch('/assets'),
          apiFetch('/tasks'),
          apiFetch('/materials'),
          apiFetch('/executions'),
          apiFetch('/issues')
        ]);
        setAssets(a);
        setTasks(t);
        setMaterials(m);
        setExecutions(e);
        setIssues(i);
      } catch (err) {
        console.error('Load error:', err);
      }
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <div className="min-h-screen bg-stone-950 text-stone-400 flex items-center justify-center">⏳ CARICAMENTO...</div>;

  if (showUserModal) return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="border border-stone-800 bg-stone-900 p-8 max-w-sm">
        <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center font-bold text-xl mb-6">🤖</div>
        <h1 className="text-2xl font-bold mb-2">SIMMA AI</h1>
        <p className="text-stone-400 text-sm mb-6">Chi sei?</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {USERS.map(u => (
            <button key={u} onClick={() => { setUser(u); setShowUserModal(false); }}
              className="border border-stone-700 hover:border-blue-400 bg-stone-950 px-3 py-2 text-sm transition">
              {u}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-700"></div></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-stone-900 text-stone-500">oppure</span></div>
        </div>

        <div className="space-y-2">
          <input value={userInput} onChange={e => setUserInput(e.target.value)}
            placeholder="Nome..." className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-sm outline-none" />
          <button onClick={() => { if (userInput.trim()) { setUser(userInput.trim()); setShowUserModal(false); } }}
            className="w-full bg-blue-500 text-white px-4 py-2 font-bold">ACCEDI</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "'IBM Plex Sans', system-ui" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center font-bold">🤖</div>
            <div>
              <h1 className="font-bold text-lg">SIMMA AI</h1>
              <p className="mono text-xs text-stone-500">{user}</p>
            </div>
          </div>
          <button onClick={() => { setUser(null); setShowUserModal(true); }}
            className="flex items-center gap-2 mono text-xs px-3 py-2 hover:bg-stone-900 border border-stone-800">
            <LogOut size={12} /> Logout
          </button>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-1">
          {[
            { id: 'upload', label: 'Carica Manuale', icon: Upload },
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'tasks', label: 'Task', icon: CheckCircle2 },
            { id: 'issues', label: 'Problemi', icon: AlertTriangle },
          ].map(t => {
            const Ic = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 mono text-xs uppercase border-b-2 transition ${tab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-stone-400'}`}>
                <Ic size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 min-h-[calc(100vh-140px)]">
        {tab === 'upload' && <Upload_Section assets={assets} setAssets={setAssets} setTasks={setTasks} setMaterials={setMaterials} />}
        {tab === 'dashboard' && <Dashboard assets={assets} executions={executions} issues={issues} />}
        {tab === 'tasks' && <Tasks_Section assets={assets} tasks={tasks} executions={executions} setExecutions={setExecutions} user={user} />}
        {tab === 'issues' && <Issues_Section assets={assets} issues={issues} setIssues={setIssues} user={user} />}
      </main>
    </div>
  );
}

function Upload_Section({ assets, setAssets, setTasks, setMaterials }) {
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file || !assetCode || !assetName) { alert('Compila tutti i campi'); return; }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetCode', assetCode);
      formData.append('assetName', assetName);

      const res = await fetch('http://localhost:3000/api/analyze-manual', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setResult(data);
      setAssets([...assets, data.asset]);
      setAssetCode('');
      setAssetName('');
      setFile(null);
      
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-stone-800 bg-stone-900/50 p-6">
        <h2 className="text-2xl font-bold mb-4">📄 Carica Manuale di Manutenzione</h2>
        
        <div className="space-y-4">
          <div>
            <label className="mono text-xs text-stone-400 block mb-2">Codice Macchinario</label>
            <input value={assetCode} onChange={e => setAssetCode(e.target.value)} placeholder="es. CNC-01"
              className="w-full bg-stone-950 border border-stone-800 px-4 py-2 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mono text-xs text-stone-400 block mb-2">Nome Macchinario</label>
            <input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="es. Tornio CNC Mazak"
              className="w-full bg-stone-950 border border-stone-800 px-4 py-2 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mono text-xs text-stone-400 block mb-2">PDF Manuale</label>
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0])}
              className="w-full" />
            {file && <p className="text-xs text-stone-400 mt-2">✓ {file.name}</p>}
          </div>

          <button onClick={handleUpload} disabled={uploading}
            className="w-full bg-blue-500 text-white px-4 py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload size={16} /> {uploading ? 'Analizzando con IA...' : 'Carica e Analizza'}
          </button>
        </div>
      </div>

      {result && (
        <div className="border border-green-900 bg-green-950/30 p-6">
          <h3 className="text-xl font-bold mb-3 text-green-400">✅ Analisi Completata!</h3>
          <p className="text-sm mb-4">Il manuale è stato analizzato con Claude AI.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-900/50 p-4">
              <div className="mono text-xs text-stone-400">TASK ESTRATTE</div>
              <div className="text-2xl font-bold">{result.asset.tasksCreated}</div>
            </div>
            <div className="bg-stone-900/50 p-4">
              <div className="mono text-xs text-stone-400">RICAMBI IDENTIFICATI</div>
              <div className="text-2xl font-bold">{result.asset.materialsCreated}</div>
            </div>
          </div>
        </div>
      )}

      <div className="border border-stone-800 bg-stone-900/50 p-6">
        <h3 className="font-bold mb-4">📋 Macchinari Caricati</h3>
        <div className="space-y-2">
          {assets.length === 0 ? (
            <p className="text-stone-500 text-sm">Nessun macchinario ancora</p>
          ) : (
            assets.map(a => (
              <div key={a._id} className="flex items-center justify-between bg-stone-950 p-3 rounded">
                <div>
                  <div className="mono text-xs text-blue-400">{a.code}</div>
                  <div className="font-medium">{a.name}</div>
                </div>
                <div className="mono text-xs text-stone-400">
                  {a.tasks?.length || 0} task · {a.materials?.length || 0} ricambi
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ assets, executions, issues }) {
  const td = today();
  const todayExecutions = executions.filter(e => e.date === td && e.done).length;
  const openIssues = issues.filter(i => !i.resolved).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="TASK ESEGUITE OGGI" value={todayExecutions} color="blue" />
        <Stat label="PROBLEMI APERTI" value={openIssues} color={openIssues > 0 ? 'red' : 'green'} />
        <Stat label="MACCHINARI" value={assets.length} color="purple" />
      </div>

      <div className="border border-stone-800 bg-stone-900/50 p-6">
        <h2 className="text-xl font-bold mb-4">Stato Macchinari</h2>
        <div className="space-y-2">
          {assets.map(a => (
            <div key={a._id} className="flex items-center justify-between bg-stone-950 p-3">
              <div>
                <div className="mono text-xs text-blue-400">{a.code}</div>
                <div className="font-medium">{a.name}</div>
              </div>
              <div className="mono text-xs text-stone-400">
                {a.tasks?.length || 0} task · {a.materials?.length || 0} ricambi
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tasks_Section({ assets, tasks, executions, setExecutions, user }) {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?._id || '');
  const [period, setPeriod] = useState('daily');

  const asset = assets.find(a => a._id === selectedAssetId);
  const assetTasks = tasks.filter(t => t.assetId === selectedAssetId && t.frequency === period);
  const td = today();

  const isDone = (taskId) => executions.some(e => e.taskId === taskId && e.date === td && e.done);

  const toggleTask = async (taskId) => {
    const done = !isDone(taskId);
    try {
      await apiFetch('/executions', {
        method: 'POST',
        body: JSON.stringify({
          taskId, assetId: selectedAssetId, date: td, userName: user, timestamp: now(), done
        })
      });
      const newExec = { taskId, assetId: selectedAssetId, date: td, userName: user, timestamp: now(), done };
      setExecutions([...executions, newExec]);
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {assets.map(a => (
          <button key={a._id} onClick={() => setSelectedAssetId(a._id)}
            className={`mono text-xs px-3 py-2 border ${selectedAssetId === a._id ? 'border-blue-500 bg-blue-500/10' : 'border-stone-800'}`}>
            {a.code}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`mono text-xs px-4 py-2 ${period === p ? 'bg-blue-500 text-white' : 'bg-stone-900'}`}>
            {p === 'daily' ? 'Giorn.' : p === 'weekly' ? 'Sett.' : p === 'monthly' ? 'Mens.' : p === 'quarterly' ? 'Trim.' : 'Ann.'}
          </button>
        ))}
      </div>

      <div className="border border-stone-800 bg-stone-900/50">
        <div className="border-b border-stone-800 p-4">
          <div className="font-bold">{asset?.name} - {period.toUpperCase()}</div>
          <div className="mono text-xs text-stone-400">Estratto automaticamente da Claude AI</div>
        </div>

        <div className="divide-y divide-stone-800">
          {assetTasks.length === 0 ? (
            <div className="p-4 text-stone-500">Nessuna task per questo periodo</div>
          ) : (
            assetTasks.map(task => {
              const done = isDone(task._id);
              return (
                <div key={task._id} className={`p-4 ${done ? 'bg-green-950/20' : ''}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task._id)}
                      className={`mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500 border-green-500' : 'border-stone-600'}`}>
                      {done && '✓'}
                    </button>
                    <div className="flex-1">
                      <div className={done ? 'line-through text-stone-500' : 'font-medium'}>{task.title}</div>
                      <p className="text-xs text-stone-400 mt-1">{task.description}</p>
                      {task.requiredMaterials?.length > 0 && (
                        <div className="mt-2 p-2 bg-stone-950 rounded text-xs">
                          <div className="text-stone-500">Ricambi necessari:</div>
                          {task.requiredMaterials.map((m, i) => <div key={i} className="text-stone-300">• {m}</div>)}
                        </div>
                      )}
                      {done && <div className="mt-2 mono text-xs text-green-400">✓ Completato</div>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Issues_Section({ assets, issues, setIssues, user }) {
  const [assetId, setAssetId] = useState(assets[0]?._id || '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('media');
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState('');

  const assetIssues = issues.filter(i => i.assetId === assetId);

  const handleCreate = async () => {
    if (!description.trim()) { alert('Descrivi il problema'); return; }
    try {
      await apiFetch('/issues', {
        method: 'POST',
        body: JSON.stringify({
          assetId, date: today(), timestamp: now(), description, severity, userName: user, resolved: false
        })
      });
      setDescription('');
      window.location.reload();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) { alert('Descrivi come è stato risolto'); return; }
    try {
      await apiFetch(`/issues/${resolving}`, {
        method: 'PUT',
        body: JSON.stringify({
          resolved: true, resolution, resolvedBy: user, resolvedAt: now()
        })
      });
      setResolving(null);
      setResolution('');
      window.location.reload();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-stone-800 bg-stone-900/50 p-6">
        <h2 className="text-xl font-bold mb-4">⚠️ Segnala Problema</h2>
        
        <select value={assetId} onChange={e => setAssetId(e.target.value)} className="w-full bg-stone-950 border border-stone-800 px-4 py-2 mb-4 outline-none focus:border-blue-500">
          {assets.map(a => <option key={a._id} value={a._id}>{a.code} - {a.name}</option>)}
        </select>

        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          placeholder="Descrivi il problema..." className="w-full bg-stone-950 border border-stone-800 px-4 py-2 mb-4 outline-none focus:border-blue-500" />

        <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full bg-stone-950 border border-stone-800 px-4 py-2 mb-4 outline-none focus:border-blue-500">
          <option value="bassa">Bassa</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>

        <button onClick={handleCreate} className="w-full bg-blue-500 text-white px-4 py-2 font-bold">Segnala</button>
      </div>

      {resolving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="border border-blue-500 bg-stone-900 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Risolvi Problema</h3>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
              placeholder="Come è stato risolto?" className="w-full bg-stone-950 border border-stone-800 px-4 py-2 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleResolve} className="flex-1 bg-blue-500 text-white px-4 py-2 font-bold">Salva</button>
              <button onClick={() => setResolving(null)} className="flex-1 border border-stone-700 px-4 py-2">Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="border border-stone-800 bg-stone-900/50 p-6">
        <h3 className="font-bold mb-4">Problemi</h3>
        <div className="space-y-2">
          {assetIssues.map(i => (
            <div key={i._id} className={`p-4 border ${i.resolved ? 'border-green-900 bg-green-950/20' : 'border-red-900 bg-red-950/20'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="mono text-xs text-stone-400">{i.date} · {i.userName}</div>
                  <div className="font-medium mt-1">{i.description}</div>
                  {i.resolved && <div className="mt-2 text-xs text-green-400">✓ {i.resolution}</div>}
                </div>
                {!i.resolved && (
                  <button onClick={() => setResolving(i._id)} className="mono text-xs px-3 py-1 bg-blue-500 text-white">Risolvi</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    purple: 'text-purple-400'
  };
  return (
    <div className="border border-stone-800 bg-stone-900/50 p-4">
      <div className="mono text-xs text-stone-500 uppercase">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${colors[color] || 'text-stone-100'}`}>{value}</div>
    </div>
  );
}
