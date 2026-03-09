import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode, Plus, Save, Play, Menu, X, ChevronRight, Terminal, FolderOpen,
  GitBranch, Bot, Files, Settings, Search, Send, CheckCircle2, Bell, User,
  ChevronDown, UploadCloud, DownloadCloud, RefreshCw, Globe, Layout, Info,
  Blocks, PlayCircle, Edit3, Trash2, Minus, FolderPlus, Lock, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import AiChat from './components/AiChat';
import { Modal, useModal, showPrompt, showConfirm } from './components/Modal';
import { ToastContainer, useToast, toast } from './components/Toast';
import { detectLanguage } from './utils/language';
import { TRANSLATIONS, THEMES } from './types';
import type { FileItem, OpenTab, ActivityTab, PanelTab, Lang } from './types';

// ─── Auth screen ─────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) onAuth(data.user);
      else setError(data.error || 'Authentication failed');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <FileCode size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mobile Web IDE</h1>
          <p className="text-gray-500 text-sm mt-1">Professional code editor in your browser</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 shadow-2xl">
          <div className="flex mb-6 bg-[#0f172a] rounded-xl p-1">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="Username" autoComplete="username"
              className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
            />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
            />
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1">
                {error}
              </motion.p>
            )}
            <button type="submit" disabled={loading}
              className="mt-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
              {mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Auth gate for panels ─────────────────────────────────────────────────────

function AuthGate({ user, title, desc, children }: { user: any; title: string; desc: string; children: React.ReactNode }) {
  if (user) return <>{children}</>;
  return (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#1e293b] border border-[#334155] flex items-center justify-center mb-4">
        <Lock size={28} className="text-blue-400" />
      </div>
      <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-gray-500 max-w-[180px]">{desc}</p>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ t, lang, setLang, theme, setTheme, fontSize, setFontSize, wordWrap, setWordWrap, tabSize, setTabSize, sidebarPos, setSidebarPos, zenMode, setZenMode, autoSave, setAutoSave, minimap, setMinimap, aiProvider, setAiProvider, aiModel, setAiModel, aiKey, setAiKey, aiSystemPrompt, setAiSystemPrompt, customEndpoint, setCustomEndpoint, useCustomAi, setUseCustomAi }: any) {
  const toggle = (val: boolean, set: (v: boolean) => void) => (
    <button onClick={() => set(!val)} className={`w-10 h-5 rounded-full relative transition-colors ${val ? 'bg-blue-600' : 'bg-gray-600'}`}>
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${val ? 'left-6' : 'left-1'}`} />
    </button>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#334155]/50 last:border-0">
      <span className="text-[13px] text-gray-300">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Appearance</h4>
        <div className="bg-[#0f172a] rounded-xl border border-[#334155] px-3 divide-y divide-[#334155]/50">
          <Row label="Language">
            <div className="flex gap-1">
              {(['en', 'ar'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${lang === l ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {l === 'en' ? 'EN' : 'عر'}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Sidebar Position">
            <div className="flex gap-1">
              {['left', 'right'].map(p => (
                <button key={p} onClick={() => setSidebarPos(p)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${sidebarPos === p ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {p === 'left' ? t.left : t.right}
                </button>
              ))}
            </div>
          </Row>
          <Row label={t.zenMode}>{toggle(zenMode, setZenMode)}</Row>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Theme</h4>
        <div className="flex flex-col gap-1">
          {THEMES.map(th => (
            <button key={th.id} onClick={() => setTheme(th)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${theme.id === th.id ? 'bg-blue-900/30 text-white border-blue-500/50' : 'bg-[#0f172a] text-gray-400 border-[#334155] hover:border-gray-500'}`}>
              {th.name}
              {theme.id === th.id && <CheckCircle2 size={14} className="text-blue-400" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Editor</h4>
        <div className="bg-[#0f172a] rounded-xl border border-[#334155] px-3 divide-y divide-[#334155]/50">
          <Row label={t.fontSize}>
            <input type="number" min={10} max={30} value={fontSize} onChange={e => setFontSize(+e.target.value)}
              className="w-16 bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 text-center"
            />
          </Row>
          <Row label={t.tabSize}>
            <select value={tabSize} onChange={e => setTabSize(+e.target.value)}
              className="bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-sm text-white focus:outline-none">
              {[2, 4, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Row>
          <Row label={t.wordWrap}>{toggle(wordWrap === 'on', v => setWordWrap(v ? 'on' : 'off'))}</Row>
          <Row label={t.autoSave || 'Auto Save'}>{toggle(autoSave, setAutoSave)}</Row>
          <Row label={t.minimap || 'Minimap'}>{toggle(minimap, setMinimap)}</Row>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">AI Configuration</h4>
        <div className="bg-[#0f172a] rounded-xl border border-[#334155] px-3 divide-y divide-[#334155]/50">
          <Row label="Custom AI API">{toggle(useCustomAi, setUseCustomAi)}</Row>
          {!useCustomAi && (
            <>
              <Row label={t.aiProvider}>
                <select value={aiProvider} onChange={e => setAiProvider(e.target.value)}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </Row>
              <Row label={t.aiModel}>
                <input value={aiModel} onChange={e => setAiModel(e.target.value)}
                  className="w-36 bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </Row>
              <Row label={t.apiKey}>
                <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)}
                  placeholder="sk-..." className="w-36 bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </Row>
            </>
          )}
          {useCustomAi && (
            <>
              <div className="py-2">
                <label className="text-[11px] text-gray-500 block mb-1">Endpoint</label>
                <input value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)} placeholder="https://..." className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="py-2">
                <label className="text-[11px] text-gray-500 block mb-1">API Key (optional)</label>
                <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
            </>
          )}
          <div className="py-2">
            <label className="text-[11px] text-gray-500 block mb-1">{t.systemPrompt}</label>
            <textarea value={aiSystemPrompt} onChange={e => setAiSystemPrompt(e.target.value)} rows={3}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Files & Editor
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const editorRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [activeTab, setActiveTab] = useState<ActivityTab>('explorer');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPanelMax, setIsPanelMax] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('terminal');
  const [isLoading, setIsLoading] = useState(false);

  // Settings (persisted)
  const ls = (k: string, def: any) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } };
  const [uiLang, setUiLang] = useState<Lang>(() => ls('uiLang', 'en'));
  const [theme, setTheme] = useState(() => ls('theme', THEMES[0]));
  const [fontSize, setFontSize] = useState(() => ls('fontSize', 14));
  const [wordWrap, setWordWrap] = useState<'on'|'off'>(() => ls('wordWrap', 'on'));
  const [tabSize, setTabSize] = useState(() => ls('tabSize', 2));
  const [sidebarPos, setSidebarPos] = useState<'left'|'right'>(() => ls('sidebarPos', 'left'));
  const [zenMode, setZenMode] = useState(false);
  const [autoSave, setAutoSave] = useState(() => ls('autoSave', true));
  const [minimap, setMinimap] = useState(() => ls('minimap', false));
  const [aiProvider, setAiProvider] = useState(() => ls('aiProvider', 'gemini'));
  const [aiModel, setAiModel] = useState(() => ls('aiModel', 'gemini-1.5-flash'));
  const [aiKey, setAiKey] = useState(() => ls('aiKey', ''));
  const [aiSystemPrompt, setAiSystemPrompt] = useState(() => ls('aiSystemPrompt', 'You are a helpful coding assistant.'));
  const [customEndpoint, setCustomEndpoint] = useState(() => ls('customEndpoint', ''));
  const [useCustomAi, setUseCustomAi] = useState(() => ls('useCustomAi', false));

  // Git
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [branches, setBranches] = useState<any>(null);
  const [remotes, setRemotes] = useState<any[]>([]);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  // Terminal
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Output
  const [output, setOutput] = useState('');

  const t = TRANSLATIONS[uiLang] as Record<string, string>;
  const isRtl = uiLang === 'ar';

  const { toasts, dismiss } = useToast();
  const { modal, setModal } = useModal();

  // Persist settings
  useEffect(() => {
    const entries: [string, any][] = [
      ['uiLang', uiLang], ['theme', theme], ['fontSize', fontSize], ['wordWrap', wordWrap],
      ['tabSize', tabSize], ['sidebarPos', sidebarPos], ['autoSave', autoSave], ['minimap', minimap],
      ['aiProvider', aiProvider], ['aiModel', aiModel], ['aiKey', aiKey],
      ['aiSystemPrompt', aiSystemPrompt], ['customEndpoint', customEndpoint], ['useCustomAi', useCustomAi],
    ];
    entries.forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, [uiLang, theme, fontSize, wordWrap, tabSize, sidebarPos, autoSave, minimap, aiProvider, aiModel, aiKey, aiSystemPrompt, customEndpoint, useCustomAi]);

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchFiles();
    fetchGit();
  }, [user]);

  // Resize handler
  useEffect(() => {
    const handle = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (!m) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // GitHub OAuth message
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.data?.type === 'GITHUB_AUTH_SUCCESS') { setIsGitHubConnected(true); toast('success', 'Connected to GitHub!'); }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  // Scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory, output]);

  const fetchFiles = useCallback(async () => {
    try {
      const r = await fetch('/api/files');
      if (r.ok) { const d = await r.json(); setFiles(d.files || []); }
    } catch {}
  }, []);

  const fetchGit = useCallback(async () => {
    try {
      const [s, b, rm] = await Promise.all([
        fetch('/api/git/status').then(r => r.json()),
        fetch('/api/git/branches').then(r => r.json()),
        fetch('/api/git/remotes').then(r => r.json()),
      ]);
      setGitStatus(s);
      setBranches(b);
      setRemotes(rm.remotes || []);
    } catch {}
  }, []);

  const refreshAll = useCallback(() => { fetchFiles(); fetchGit(); }, [fetchFiles, fetchGit]);

  const openFile = useCallback(async (filePath: string, line?: number) => {
    if (!openTabs.find(t => t.path === filePath)) {
      setOpenTabs(prev => [...prev, { path: filePath, name: filePath.split('/').pop() || filePath }]);
    }
    try {
      const r = await fetch('/api/files/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
      const d = await r.json();
      setActiveFile(filePath);
      setContent(d.content);
      if (line && editorRef.current) {
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }, 100);
      }
      if (isMobile) setIsSidebarOpen(false);
    } catch { toast('error', 'Failed to open file'); }
  }, [openTabs, isMobile]);

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.path !== path);
    setOpenTabs(newTabs);
    if (activeFile === path) {
      if (newTabs.length > 0) openFile(newTabs[newTabs.length - 1].path);
      else { setActiveFile(null); setContent(''); }
    }
  };

  const saveFile = useCallback(async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      const r = await fetch('/api/files/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: activeFile, content }) });
      if (r.ok) {
        setOpenTabs(prev => prev.map(t => t.path === activeFile ? { ...t, isDirty: false } : t));
        toast('success', t.filesSaved || 'Saved');
      }
    } catch { toast('error', 'Save failed'); }
    finally { setIsLoading(false); }
  }, [activeFile, content, t]);

  // Keyboard shortcut save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveFile]);

  // Auto-save
  const handleContentChange = (val: string | undefined) => {
    const v = val || '';
    setContent(v);
    setOpenTabs(prev => prev.map(t => t.path === activeFile ? { ...t, isDirty: true } : t));
    if (autoSave && activeFile) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        await fetch('/api/files/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: activeFile, content: v }) });
        setOpenTabs(prev => prev.map(t => t.path === activeFile ? { ...t, isDirty: false } : t));
      }, 1500);
    }
  };

  const runCode = async () => {
    setIsPanelOpen(true);
    setActivePanelTab('output');
    setOutput('⏳ Running...');
    try {
      const lang = detectLanguage(activeFile || '');
      const r = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: content, language: lang }) });
      const d = await r.json();
      setOutput((d.output || '') + (d.error ? `\n⚠️ ${d.error}` : '') || '(no output)');
    } catch { setOutput('❌ Error running code'); }
  };

  const execTerminal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!terminalInput) return;
    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalHistory(p => [...p, `\x1b[32m$\x1b[0m ${cmd}`]);
    try {
      const r = await fetch('/api/terminal/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: cmd }) });
      const d = await r.json();
      if (d.output) setTerminalHistory(p => [...p, d.output]);
      if (d.error) setTerminalHistory(p => [...p, `\x1b[31m${d.error}\x1b[0m`]);
    } catch { setTerminalHistory(p => [...p, '❌ Failed to execute']); }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const r = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery }) });
      const d = await r.json();
      setSearchResults(d.results || []);
    } catch { toast('error', 'Search failed'); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setFiles([]); setOpenTabs([]); setActiveFile(null); setContent('');
    toast('info', 'Logged out');
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw size={28} className="text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); }} />;

  const activityButtons: { id: ActivityTab; icon: React.ReactNode; label: string }[] = [
    { id: 'explorer', icon: <Files size={22} />, label: t.explorer },
    { id: 'search', icon: <Search size={22} />, label: t.search },
    { id: 'git', icon: <GitBranch size={22} />, label: t.git },
    { id: 'run', icon: <PlayCircle size={22} />, label: t.run },
    { id: 'extensions', icon: <Blocks size={22} />, label: t.extensions },
    { id: 'ai', icon: <Bot size={22} />, label: t.ai },
  ];

  const setTab = (id: ActivityTab) => {
    setActiveTab(id);
    setIsSidebarOpen(true);
  };

  return (
    <div className={`flex flex-col h-screen bg-[#0f172a] text-gray-300 font-sans overflow-hidden ${theme.class}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Modal modal={modal} setModal={setModal} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className={`flex flex-1 overflow-hidden ${sidebarPos === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Activity Bar (desktop) */}
        {!zenMode && !isMobile && (
          <div className={`w-12 bg-[#161f2e] flex flex-col items-center py-2 gap-1 border-[#334155] shrink-0 ${sidebarPos === 'left' ? 'border-r' : 'border-l'}`}>
            {activityButtons.map(btn => (
              <button key={btn.id} onClick={() => setTab(btn.id)} title={btn.label}
                className={`p-2.5 rounded-lg transition-all ${activeTab === btn.id && isSidebarOpen ? 'text-white bg-white/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}>
                {btn.icon}
              </button>
            ))}
            <div className="mt-auto flex flex-col gap-1 pb-2">
              <button onClick={() => setTab('profile')} title={t.userProfile}
                className={`p-2.5 rounded-lg transition-all ${activeTab === 'profile' && isSidebarOpen ? 'text-white bg-white/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}>
                <User size={22} />
              </button>
              <button onClick={() => setTab('settings')} title={t.settings}
                className={`p-2.5 rounded-lg transition-all ${activeTab === 'settings' && isSidebarOpen ? 'text-white bg-white/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}>
                <Settings size={22} />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Overlay (mobile) */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen && !zenMode ? (isMobile ? '100%' : '260px') : '0px' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`bg-[#131c2e] flex flex-col z-50 overflow-hidden border-[#334155] shadow-2xl md:shadow-none ${
            isMobile ? `fixed h-full ${sidebarPos === 'left' ? 'left-0' : 'right-0'}` : 'relative'
          } ${sidebarPos === 'left' ? 'border-r' : 'border-l'}`}
          style={{ minWidth: 0 }}
        >
          {/* Sidebar header */}
          <div className="h-9 px-3 flex items-center justify-between shrink-0 bg-white/[0.02] border-b border-[#334155]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 truncate">
              {activeTab === 'explorer' && t.explorer}
              {activeTab === 'search' && t.search}
              {activeTab === 'git' && t.git}
              {activeTab === 'run' && t.run}
              {activeTab === 'extensions' && t.extensions}
              {activeTab === 'ai' && t.ai}
              {activeTab === 'settings' && t.settings}
              {activeTab === 'profile' && t.userProfile}
            </span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'explorer' && (
              <FileExplorer files={files} activeFile={activeFile} isMobile={isMobile} t={t}
                onOpenFile={openFile} onRefresh={refreshAll}
              />
            )}

            {activeTab === 'search' && (
              <div className="flex flex-col h-full p-3 gap-3">
                <div className="flex gap-2">
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={t.searchPlaceholder || 'Search...'}
                    className="flex-1 bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-bold">
                    <Search size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {searchResults.map((r, i) => (
                    <div key={i} onClick={() => openFile(r.path, r.line)}
                      className="p-2.5 hover:bg-white/5 rounded-xl cursor-pointer border border-transparent hover:border-[#334155] transition-all" dir="ltr">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-blue-400 truncate">{r.path}</span>
                        <span className="text-[10px] text-gray-600">:{r.line}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate font-mono">"{r.content}"</p>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && (
                    <div className="text-center py-10 text-gray-600 text-xs">No results found</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <AuthGate user={user} title={t.git} desc={t.gitAuthDesc}>
                <GitPanel gitStatus={gitStatus} branches={branches} remotes={remotes}
                  isGitHubConnected={isGitHubConnected} isLoading={isLoading} t={t} isRtl={isRtl}
                  onRefresh={refreshAll}
                />
              </AuthGate>
            )}

            {activeTab === 'run' && (
              <div className="flex flex-col h-full p-4 gap-4">
                <button onClick={runCode} disabled={!activeFile}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold transition-all">
                  <Play size={16} /> {t.runBtn}
                </button>
                <p className="text-[11px] text-gray-600 text-center">
                  {activeFile ? `Running: ${activeFile.split('/').pop()}` : 'Open a file to run'}
                </p>
              </div>
            )}

            {activeTab === 'extensions' && (
              <div className="flex flex-col h-full p-4">
                <p className="text-xs text-gray-500 text-center mt-8">Extensions marketplace coming soon</p>
              </div>
            )}

            {activeTab === 'ai' && (
              <AuthGate user={user} title={t.ai} desc={t.aiAuthDesc}>
                <AiChat activeFileContent={content} t={t} settings={{ provider: aiProvider, model: aiModel, apiKey: aiKey, systemPrompt: aiSystemPrompt, customEndpoint, useCustom: useCustomAi }} />
              </AuthGate>
            )}

            {activeTab === 'settings' && (
              <SettingsPanel t={t} lang={uiLang} setLang={setUiLang} theme={theme} setTheme={setTheme}
                fontSize={fontSize} setFontSize={setFontSize} wordWrap={wordWrap} setWordWrap={setWordWrap}
                tabSize={tabSize} setTabSize={setTabSize} sidebarPos={sidebarPos} setSidebarPos={setSidebarPos}
                zenMode={zenMode} setZenMode={setZenMode} autoSave={autoSave} setAutoSave={setAutoSave}
                minimap={minimap} setMinimap={setMinimap}
                aiProvider={aiProvider} setAiProvider={setAiProvider} aiModel={aiModel} setAiModel={setAiModel}
                aiKey={aiKey} setAiKey={setAiKey} aiSystemPrompt={aiSystemPrompt} setAiSystemPrompt={setAiSystemPrompt}
                customEndpoint={customEndpoint} setCustomEndpoint={setCustomEndpoint}
                useCustomAi={useCustomAi} setUseCustomAi={setUseCustomAi}
              />
            )}

            {activeTab === 'profile' && (
              <div className="flex flex-col h-full p-5">
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User size={32} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-white">{user?.username}</h2>
                    <p className="text-xs text-gray-500">Developer</p>
                  </div>
                </div>
                <div className="bg-[#0f172a] rounded-xl border border-[#334155] px-4 py-3 mb-4">
                  <div className="flex justify-between py-1.5 text-sm border-b border-[#334155]/50">
                    <span className="text-gray-500">Username</span>
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-gray-500">User ID</span>
                    <span className="text-white">#{user?.id}</span>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold text-sm transition-all">
                  <X size={14} /> {t.logout}
                </button>
              </div>
            )}
          </div>
        </motion.aside>

        {/* MAIN EDITOR AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {/* Tab bar */}
          <div className="h-9 bg-[#0d1526] flex items-center border-b border-[#334155] overflow-x-auto no-scrollbar shrink-0">
            {!isMobile && (
              <button onClick={() => setIsSidebarOpen(s => !s)} className="px-2 h-full text-gray-600 hover:text-gray-300 shrink-0">
                <Menu size={16} />
              </button>
            )}
            {openTabs.map(tab => (
              <div key={tab.path} onClick={() => openFile(tab.path)}
                className={`flex items-center gap-1.5 px-3 h-full cursor-pointer border-[#334155] text-xs transition-colors group shrink-0 border-r ${
                  activeFile === tab.path ? 'bg-[#0f172a] text-white border-t-2 border-t-blue-500' : 'bg-[#0d1526] text-gray-500 hover:bg-[#0f172a]/60'
                }`} dir="ltr">
                <FileCode size={12} className={tab.path.endsWith('.py') ? 'text-yellow-400' : 'text-blue-400'} />
                <span className="truncate max-w-[100px]">{tab.name}</span>
                {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                <button onClick={e => closeTab(e, tab.path)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-1 px-3 shrink-0">
              <button onClick={saveFile} disabled={!activeFile || isLoading} title={`${t.save} (Ctrl+S)`}
                className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded transition-all">
                <Save size={15} />
              </button>
              <button onClick={runCode} disabled={!activeFile} title={t.runBtn}
                className="p-1.5 text-gray-500 hover:text-green-400 disabled:opacity-30 hover:bg-white/5 rounded transition-all">
                <Play size={15} />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="h-5 px-4 bg-[#0d1526]/80 flex items-center gap-1 text-[10px] text-gray-600 shrink-0 border-b border-[#334155]/50" dir="ltr">
            {activeFile ? (
              <>
                <span>workspace</span>
                {activeFile.split('/').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <ChevronRight size={10} />
                    <span className={i === arr.length - 1 ? 'text-gray-400' : ''}>{part}</span>
                  </React.Fragment>
                ))}
              </>
            ) : <span>Welcome</span>}
          </div>

          {/* Editor / Welcome */}
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language={detectLanguage(activeFile)}
                theme={theme.id === 'github-light' ? 'light' : 'vs-dark'}
                value={content}
                onChange={handleContentChange}
                onMount={ed => { editorRef.current = ed; }}
                options={{
                  fontSize, minimap: { enabled: minimap && !isMobile },
                  scrollBeyondLastLine: false, automaticLayout: true,
                  padding: { top: 12 }, wordWrap, tabSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  cursorBlinking: 'smooth', smoothScrolling: true,
                  renderLineHighlight: 'all', lineNumbersMinChars: 3,
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center bg-[#0a1120]">
                <div className="w-20 h-20 rounded-3xl bg-[#131c2e] flex items-center justify-center border border-[#334155] shadow-2xl">
                  <Layout size={40} className="text-[#334155]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t.welcome}</h2>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">{t.welcomeDesc}</p>
                </div>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 max-w-sm w-full`}>
                  <div className="p-4 bg-[#131c2e] rounded-2xl border border-[#334155] text-left">
                    <h3 className="text-[10px] font-bold uppercase text-blue-400 mb-2">{t.start}</h3>
                    <button onClick={() => setTab('explorer')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1 w-full"><FolderOpen size={13} /> Open Explorer</button>
                    <button onClick={() => setTab('git')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1 w-full mt-1"><GitBranch size={13} /> Clone Repo</button>
                  </div>
                  <div className="p-4 bg-[#131c2e] rounded-2xl border border-[#334155] text-left">
                    <h3 className="text-[10px] font-bold uppercase text-blue-400 mb-2">{t.recent}</h3>
                    {openTabs.length > 0 ? openTabs.map(tab => (
                      <button key={tab.path} onClick={() => openFile(tab.path)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1 w-full truncate">
                        <FileCode size={13} className="shrink-0" /> {tab.name}
                      </button>
                    )) : <p className="text-[11px] text-gray-600 italic">No recent files</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <motion.div
            animate={{ height: isPanelOpen ? (isPanelMax ? '100%' : isMobile ? '45%' : '220px') : '0px' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className={`bg-[#0a1120] border-t border-[#334155] flex flex-col overflow-hidden shrink-0 ${isPanelMax ? 'absolute inset-0 z-30' : ''}`}
          >
            {/* Panel tab bar */}
            <div className="h-9 px-3 bg-[#0d1526] flex items-center justify-between shrink-0 border-b border-[#334155]">
              <div className="flex items-center h-full gap-1">
                {(['terminal', 'output', 'problems', 'debug'] as PanelTab[]).map(pt => (
                  <button key={pt} onClick={() => setActivePanelTab(pt)}
                    className={`px-3 h-full text-[11px] font-medium uppercase tracking-wider transition-colors border-b-2 ${activePanelTab === pt ? 'text-white border-white' : 'text-gray-600 hover:text-gray-300 border-transparent'}`}>
                    {t[pt] || pt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsPanelMax(m => !m)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white">
                  <ChevronDown size={13} className={isPanelMax ? '' : 'rotate-180'} />
                </button>
                <button onClick={() => setIsPanelOpen(false)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white">
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden" dir="ltr">
              {activePanelTab === 'terminal' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
                    {terminalHistory.map((line, i) => (
                      <div key={i} className="mb-0.5 whitespace-pre-wrap break-all text-gray-300 leading-relaxed">{line}</div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                  <form onSubmit={execTerminal} className="flex items-center gap-2 px-3 py-2 border-t border-[#334155] shrink-0">
                    <span className="text-green-400 font-bold text-xs">$</span>
                    <input value={terminalInput} onChange={e => setTerminalInput(e.target.value)} placeholder="Enter command..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono text-white"
                    />
                    <button type="submit" className="text-gray-600 hover:text-white"><Send size={13} /></button>
                  </form>
                </div>
              )}
              {activePanelTab === 'output' && (
                <div className="p-3 font-mono text-xs text-gray-300 whitespace-pre-wrap overflow-y-auto h-full custom-scrollbar">
                  {output || <span className="text-gray-600 italic">{t.noOutput || 'No output'}</span>}
                </div>
              )}
              {activePanelTab === 'problems' && (
                <div className="p-3 flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={14} className="text-green-500" />
                  {t.noProblems || 'No problems detected.'}
                </div>
              )}
              {activePanelTab === 'debug' && (
                <div className="p-3 text-xs text-gray-600 italic">Debug console not active.</div>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && !zenMode && (
        <div className="h-14 bg-[#0d1526] border-t border-[#334155] flex items-center justify-around shrink-0 z-50 px-1">
          {activityButtons.slice(0, 5).map(btn => (
            <button key={btn.id} onClick={() => setTab(btn.id)}
              className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${activeTab === btn.id && isSidebarOpen ? 'text-blue-400' : 'text-gray-600'}`}>
              {React.cloneElement(btn.icon as React.ReactElement, { size: 20 })}
              <span className="text-[8px] font-bold uppercase">{btn.label.slice(0, 4)}</span>
            </button>
          ))}
          <button onClick={() => setIsPanelOpen(p => !p)}
            className={`p-2 flex flex-col items-center gap-0.5 transition-colors ${isPanelOpen ? 'text-blue-400' : 'text-gray-600'}`}>
            <Terminal size={20} />
            <span className="text-[8px] font-bold uppercase">Term</span>
          </button>
        </div>
      )}

      {/* Status Bar */}
      <footer className="h-6 bg-blue-700 flex items-center justify-between px-3 text-[11px] text-white shrink-0 z-50">
        <div className="flex items-center gap-3 h-full">
          <div className="flex items-center gap-1.5 hover:bg-black/20 px-2 h-full cursor-pointer rounded-sm">
            <GitBranch size={11} />
            <span className={isMobile ? 'hidden' : ''}>{branches?.current || 'main'}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-200">
            <CheckCircle2 size={11} /> <span className={isMobile ? 'hidden' : ''}>{t.ready}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 h-full">
          {activeFile && (
            <span className="text-blue-200 uppercase text-[10px]">{detectLanguage(activeFile)}</span>
          )}
          <button onClick={() => setIsPanelOpen(p => !p)} className="hover:bg-black/20 px-2 h-full flex items-center gap-1 rounded-sm">
            <Terminal size={11} />
          </button>
          <button onClick={() => setIsSidebarOpen(s => !s)} className={`hover:bg-black/20 px-2 h-full items-center gap-1 rounded-sm ${isMobile ? 'hidden' : 'flex'}`}>
            <Layout size={11} />
          </button>
          <div className="flex items-center gap-1 hover:bg-black/20 px-2 h-full cursor-pointer rounded-sm">
            <Bell size={11} />
          </div>
        </div>
      </footer>
    </div>
  );
}
