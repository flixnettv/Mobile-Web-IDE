import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FileCode, 
  Plus, 
  Minus,
  Save, 
  Play, 
  Trash2, 
  Menu, 
  X, 
  ChevronRight,
  Terminal,
  FolderOpen,
  GitBranch,
  Bot,
  Files,
  Settings,
  Search,
  Send,
  FolderPlus,
  Edit3,
  PlayCircle,
  Blocks,
  Layout,
  Info,
  CheckCircle2,
  Bell,
  User,
  MoreHorizontal,
  ChevronDown,
  Key,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

type ActivityTab = 'explorer' | 'search' | 'git' | 'run' | 'extensions' | 'ai' | 'settings' | 'profile';
type PanelTab = 'terminal' | 'output' | 'problems' | 'debug';

const TRANSLATIONS = {
  en: {
    explorer: 'Explorer',
    search: 'Search',
    git: 'Source Control',
    run: 'Run and Debug',
    extensions: 'Extensions',
    ai: 'AI Assistant',
    settings: 'Settings',
    workspace: 'Workspace',
    newFile: 'New File',
    newFolder: 'New Folder',
    commit: 'Commit',
    message: 'Message',
    changes: 'Changes',
    stagedChanges: 'Staged Changes',
    askAi: 'Ask AI...',
    save: 'Save',
    runBtn: 'Run',
    terminal: 'Terminal',
    output: 'Output',
    problems: 'Problems',
    debug: 'Debug Console',
    noFile: 'No file open',
    welcome: 'Visual Studio Web',
    welcomeDesc: 'A professional-grade development environment in your browser.',
    start: 'Start',
    recent: 'Recent',
    language: 'Language',
    theme: 'Theme',
    appearance: 'Appearance',
    ready: 'Ready',
    problemsStat: '0 Problems',
    terminalReady: 'Terminal ready. Type code and click "Run" to see output...',
    noOutput: 'No output to display.',
    noProblems: 'No problems have been detected in the workspace.',
    debugInactive: 'Debug console is not active.',
    fontSize: 'Font Size',
    wordWrap: 'Word Wrap',
    tabSize: 'Tab Size',
    aiProvider: 'AI Provider',
    aiModel: 'AI Model',
    systemPrompt: 'System Prompt',
    apiKey: 'API Key',
    on: 'On',
    off: 'Off',
    general: 'General',
    aiConfig: 'AI Configuration',
    saveSettings: 'Save Settings',
    rename: 'Rename',
    delete: 'Delete',
    diff: 'Changes Diff',
    noDiff: 'No changes to show',
    push: 'Push',
    pull: 'Pull',
    fetch: 'Fetch',
    remotes: 'Remotes',
    connectGitHub: 'Connect to GitHub',
    cloneRepo: 'Clone Repository',
    branches: 'Branches',
    switchBranch: 'Switch Branch',
    createBranch: 'Create Branch',
    runAndDebug: 'Run and Debug',
    variables: 'Variables',
    watch: 'Watch',
    callStack: 'Call Stack',
    breakpoints: 'Breakpoints',
    extensionsMarket: 'Extensions Marketplace',
    installed: 'Installed',
    recommended: 'Recommended',
    searchExtensions: 'Search Extensions...',
    terminalPrompt: 'Terminal',
    close: 'Close',
    back: 'Back',
    layout: 'Layout',
    sidebarPosition: 'Sidebar Position',
    left: 'Left',
    right: 'Right',
    zenMode: 'Zen Mode',
    maximize: 'Maximize',
    restore: 'Restore',
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    logout: 'Logout',
    authRequired: 'Authentication Required',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    invalidAuth: 'Invalid username or password',
    userProfile: 'User Profile',
    customAiSettings: 'Custom AI Settings',
    useCustomAi: 'Use Custom AI API',
    aiEndpoint: 'API Endpoint',
    aiKey: 'API Key (Optional)',
    aiSettingsDesc: 'Configure your own AI assistant using a custom API endpoint.',
    gitAuthDesc: 'Please login to manage your code repositories and Git features.',
    aiAuthDesc: 'Please login to use the AI assistant features.',
  },
  ar: {
    explorer: 'المستكشف',
    search: 'البحث',
    git: 'إدارة الكود',
    run: 'التشغيل والتصحيح',
    extensions: 'الإضافات',
    ai: 'مساعد الذكاء الاصطناعي',
    settings: 'الإعدادات',
    workspace: 'مساحة العمل',
    newFile: 'ملف جديد',
    newFolder: 'مجلد جديد',
    commit: 'حفظ التغييرات (Commit)',
    message: 'رسالة...',
    changes: 'التغييرات',
    stagedChanges: 'التغييرات المدرجة (Staged)',
    askAi: 'اسأل الذكاء الاصطناعي...',
    save: 'حفظ',
    runBtn: 'تشغيل',
    terminal: 'الطرفية',
    output: 'المخرجات',
    problems: 'المشاكل',
    debug: '콘솔 التصحيح',
    noFile: 'لا يوجد ملف مفتوح',
    welcome: 'فيجوال ستوديو ويب',
    welcomeDesc: 'بيئة تطوير احترافية داخل متصفحك.',
    start: 'البدء',
    recent: 'الأخيرة',
    language: 'اللغة',
    theme: 'المظهر (الثيم)',
    appearance: 'المظهر',
    ready: 'جاهز',
    problemsStat: '0 مشاكل',
    terminalReady: 'الطرفية جاهزة. اكتب الكود واضغط "تشغيل" لرؤية النتائج...',
    noOutput: 'لا توجد مخرجات لعرضها.',
    noProblems: 'لم يتم اكتشاف أي مشاكل في مساحة العمل.',
    debugInactive: '콘솔 التصحيح غير نشط حالياً.',
    fontSize: 'حجم الخط',
    wordWrap: 'التفاف النص',
    tabSize: 'حجم المسافة (Tab)',
    aiProvider: 'مزود الذكاء الاصطناعي',
    aiModel: 'نموذج الذكاء الاصطناعي',
    systemPrompt: 'التعليمات البرمجية (System Prompt)',
    apiKey: 'مفتاح الـ API',
    on: 'تفعيل',
    off: 'تعطيل',
    general: 'عام',
    aiConfig: 'إعدادات الذكاء الاصطناعي',
    saveSettings: 'حفظ الإعدادات',
    rename: 'إعادة تسمية',
    delete: 'حذف',
    diff: 'فرق التغييرات',
    noDiff: 'لا توجد تغييرات لعرضها',
    push: 'دفع (Push)',
    pull: 'سحب (Pull)',
    fetch: 'جلب (Fetch)',
    remotes: 'المستودعات البعيدة (Remotes)',
    connectGitHub: 'الاتصال بـ GitHub',
    cloneRepo: 'استنساخ مستودع (Clone)',
    branches: 'الفروع (Branches)',
    switchBranch: 'تبديل الفرع',
    createBranch: 'إنشاء فرع جديد',
    runAndDebug: 'التشغيل والتصحيح',
    variables: 'المتغيرات',
    watch: 'المراقبة',
    callStack: 'سجل الاستدعاءات',
    breakpoints: 'نقاط التوقف',
    extensionsMarket: 'متجر الإضافات',
    installed: 'المثبتة',
    recommended: 'المقترحة',
    searchExtensions: 'البحث عن إضافات...',
    terminalPrompt: 'الطرفية',
    close: 'إغلاق',
    back: 'رجوع',
    layout: 'تنسيق الواجهة',
    sidebarPosition: 'موقع الشريط الجانبي',
    left: 'يسار',
    right: 'يمين',
    zenMode: 'وضع التركيز (Zen)',
    maximize: 'تكبير',
    restore: 'استعادة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    logout: 'تسجيل الخروج',
    authRequired: 'مطلوب تسجيل الدخول',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    invalidAuth: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    userProfile: 'ملف المستخدم',
    customAiSettings: 'إعدادات الذكاء الاصطناعي المخصصة',
    useCustomAi: 'استخدام واجهة برمجة تطبيقات مخصصة',
    aiEndpoint: 'نقطة نهاية API',
    aiKey: 'مفتاح API (اختياري)',
    aiSettingsDesc: 'قم بتكوين مساعد الذكاء الاصطناعي الخاص بك باستخدام نقطة نهاية API مخصصة.',
    gitAuthDesc: 'يرجى تسجيل الدخول لإدارة مستودعات الأكواد وميزات Git.',
    aiAuthDesc: 'يرجى تسجيل الدخول لاستخدام ميزات مساعد الذكاء الاصطناعي.',
  }
};

const THEMES = [
  { id: 'dark', name: 'VS Code Dark', class: '' },
  { id: 'github-light', name: 'GitHub Light', class: 'theme-github-light' },
  { id: 'monokai', name: 'Monokai', class: 'theme-monokai' },
  { id: 'dracula', name: 'Dracula', class: 'theme-dracula' },
  { id: 'solarized-dark', name: 'Solarized Dark', class: 'theme-solarized-dark' }
];

interface OpenTab {
  path: string;
  name: string;
  isDirty?: boolean;
}

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [content, setContent] = useState('');
  const [output, setOutput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || t.invalidAuth);
      }
    } catch (err) {
      setAuthError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveFile(null);
      setOpenTabs([]);
      setFiles([]);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, default sidebar to closed if transitioning from desktop
      if (mobile && window.innerWidth < 768 && !isMobile) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>('explorer');
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('terminal');
  const [language, setLanguage] = useState('javascript');
  
  // Layout State
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(() => (localStorage.getItem('sidebarPosition') as 'left' | 'right') || 'left');
  const [isZenMode, setIsZenMode] = useState(false);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  
  // Settings & Appearance
  const [uiLanguage, setUiLanguage] = useState<'en' | 'ar'>(() => (localStorage.getItem('uiLanguage') as 'en' | 'ar') || 'en');
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('currentTheme');
    return saved ? JSON.parse(saved) : THEMES[0];
  });
  
  // Editor Settings
  const [editorFontSize, setEditorFontSize] = useState(() => Number(localStorage.getItem('editorFontSize')) || 14);
  const [editorWordWrap, setEditorWordWrap] = useState<'on' | 'off'>(() => (localStorage.getItem('editorWordWrap') as 'on' | 'off') || 'on');
  const [editorTabSize, setEditorTabSize] = useState(() => Number(localStorage.getItem('editorTabSize')) || 2);

  // AI Settings
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('aiProvider') || 'gemini');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('aiModel') || 'gemini-3-flash-preview');
  const [aiSystemPrompt, setAiSystemPrompt] = useState(() => localStorage.getItem('aiSystemPrompt') || 'You are a helpful coding assistant.');
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('aiApiKey') || '');

  useEffect(() => {
    localStorage.setItem('uiLanguage', uiLanguage);
    localStorage.setItem('currentTheme', JSON.stringify(currentTheme));
    localStorage.setItem('editorFontSize', editorFontSize.toString());
    localStorage.setItem('editorWordWrap', editorWordWrap);
    localStorage.setItem('editorTabSize', editorTabSize.toString());
    localStorage.setItem('aiProvider', aiProvider);
    localStorage.setItem('aiModel', aiModel);
    localStorage.setItem('aiSystemPrompt', aiSystemPrompt);
    localStorage.setItem('aiApiKey', aiApiKey);
    localStorage.setItem('sidebarPosition', sidebarPosition);
  }, [uiLanguage, currentTheme, editorFontSize, editorWordWrap, editorTabSize, aiProvider, aiModel, aiSystemPrompt, aiApiKey, sidebarPosition]);

  const t = TRANSLATIONS[uiLanguage];
  const isRtl = uiLanguage === 'ar';

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const editorRef = useRef<any>(null);
  
  // Git State
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [gitDiff, setGitDiff] = useState<string | null>(null);
  const [selectedGitFile, setSelectedGitFile] = useState<string | null>(null);
  const [remotes, setRemotes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any>(null);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);

  // Problems State
  const [problems, setProblems] = useState<any[]>([]);

  // Extensions State
  const [extensionSearch, setExtensionSearch] = useState('');
  const [installedExtensions] = useState([
    { id: 'python', name: 'Python', desc: 'IntelliSense, linting, debugging', icon: '🐍', version: 'v2024.2.0' },
    { id: 'prettier', name: 'Prettier', desc: 'Code formatter', icon: '✨', version: 'v3.1.0' },
    { id: 'gitlens', name: 'GitLens', desc: 'Supercharge Git', icon: '🌿', version: 'v14.0.0' }
  ]);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customAiEndpoint, setCustomAiEndpoint] = useState(localStorage.getItem('customAiEndpoint') || '');
  const [customAiKey, setCustomAiKey] = useState(localStorage.getItem('customAiKey') || '');
  const [useCustomAi, setUseCustomAi] = useState(localStorage.getItem('useCustomAi') === 'true');

  useEffect(() => {
    localStorage.setItem('customAiEndpoint', customAiEndpoint);
    localStorage.setItem('customAiKey', customAiKey);
    localStorage.setItem('useCustomAi', useCustomAi.toString());
  }, [customAiEndpoint, customAiKey, useCustomAi]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    if (user) {
      fetchFiles();
      fetchGitStatus();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Failed to fetch files', err);
    }
  };

  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      const data = await res.json();
      setGitStatus(data);
      fetchRemotes();
      fetchBranches();
    } catch (err) {
      console.error('Failed to fetch git status', err);
    }
  };

  const fetchRemotes = async () => {
    try {
      const res = await fetch('/api/git/remotes');
      const data = await res.json();
      setRemotes(data.remotes || []);
    } catch (err) {
      console.error('Failed to fetch remotes', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/git/branches');
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error('Failed to fetch branches', err);
    }
  };

  const switchBranch = async (branch: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/branch/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchGitStatus();
      fetchFiles();
    } catch (error: any) {
      alert('Failed to switch branch: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBranch = async () => {
    const name = prompt(t.createBranch);
    if (!name) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/branch/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchGitStatus();
    } catch (error: any) {
      alert('Failed to create branch: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cloneRepo = async () => {
    const url = prompt('Enter repository URL to clone:');
    if (!url) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Clone successful');
      fetchFiles();
      fetchGitStatus();
    } catch (error: any) {
      alert('Clone failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const push = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remote: 'origin', branch: 'main' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Push successful');
    } catch (error: any) {
      alert('Push failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pull = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remote: 'origin', branch: 'main' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Pull successful');
      fetchFiles();
      fetchGitStatus();
    } catch (error: any) {
      alert('Pull failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/fetch', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Fetch successful');
    } catch (error: any) {
      alert('Fetch failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectGitHub = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, 'github_auth', 'width=600,height=700');
      }
    } catch (error) {
      alert('GitHub connection failed. Please configure GITHUB_CLIENT_ID.');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setIsGitHubConnected(true);
        alert('Connected to GitHub successfully!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const createFile = async (type: 'file' | 'directory' = 'file') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    
    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type })
      });
      if (res.ok) {
        await fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to create item', err);
    }
  };

  const openFile = async (filePath: string, line?: number) => {
    // Check if already open
    const existingTab = openTabs.find(t => t.path === filePath);
    if (!existingTab) {
      const name = filePath.split('/').pop() || filePath;
      setOpenTabs(prev => [...prev, { path: filePath, name }]);
    }

    try {
      const res = await fetch('/api/files/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      setActiveFile(filePath);
      setContent(data.content);
      setLanguage(filePath.endsWith('.py') ? 'python' : 'javascript');
      
      if (line && editorRef.current) {
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }, 100);
      }
      
      if (isMobile) setIsSidebarOpen(false);
    } catch (err) {
      console.error('Failed to read file', err);
    }
  };

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.path !== path);
    setOpenTabs(newTabs);
    if (activeFile === path) {
      if (newTabs.length > 0) {
        openFile(newTabs[newTabs.length - 1].path);
      } else {
        setActiveFile(null);
        setContent('');
      }
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile, content })
      });
    } catch (err) {
      console.error('Failed to save file', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;
    
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      if (res.ok) {
        await fetchFiles();
        setOpenTabs(prev => prev.filter(t => t.path !== filePath));
        if (activeFile === filePath) {
          setActiveFile(null);
          setContent('');
        }
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const renameItem = async (oldPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Enter new name:', oldPath.split('/').pop());
    if (!newName) return;
    
    const newPath = oldPath.split('/').slice(0, -1).concat(newName).join('/');
    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (res.ok) {
        await fetchFiles();
        setOpenTabs(prev => prev.map(t => t.path === oldPath ? { ...t, path: newPath, name: newName } : t));
        if (activeFile === oldPath) setActiveFile(newPath);
      }
    } catch (err) {
      console.error('Failed to rename item', err);
    }
  };

  const fetchGitDiff = async (filePath: string) => {
    setSelectedGitFile(filePath);
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      setGitDiff(data.diff || t.noDiff);
    } catch (err) {
      console.error('Diff failed', err);
    }
  };

  const execTerminal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!terminalInput) return;
    
    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalHistory(prev => [...prev, `> ${cmd}`]);
    
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      if (data.output) setTerminalHistory(prev => [...prev, data.output]);
      if (data.error) setTerminalHistory(prev => [...prev, `Error: ${data.error}`]);
    } catch (err) {
      setTerminalHistory(prev => [...prev, 'Failed to execute command']);
    }
  };

  const runCode = async () => {
    setIsPanelOpen(true);
    setActivePanelTab('terminal');
    setOutput('Running...');
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: content, language })
      });
      const data = await res.json();
      setOutput(data.output || data.error || 'No output');
    } catch (err) {
      setOutput('Error running code');
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage) return;
    try {
      await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage })
      });
      setCommitMessage('');
      fetchGitStatus();
    } catch (err) {
      console.error('Commit failed', err);
    }
  };

  const stageFile = async (path: string) => {
    try {
      await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      fetchGitStatus();
    } catch (err) {
      console.error('Stage failed', err);
    }
  };

  const unstageFile = async (path: string) => {
    try {
      await fetch('/api/git/unstage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      fetchGitStatus();
    } catch (err) {
      console.error('Unstage failed', err);
    }
  };

  const askAi = async () => {
    if (!aiPrompt) return;
    const userMsg = { role: 'user' as const, content: aiPrompt };
    setAiMessages(prev => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiLoading(true);
    
    try {
      if (useCustomAi && customAiEndpoint) {
        const res = await fetch(customAiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': customAiKey ? `Bearer ${customAiKey}` : ''
          },
          body: JSON.stringify({ 
            prompt: aiPrompt, 
            context: content,
            messages: [
              { role: 'system', content: aiSystemPrompt },
              { role: 'user', content: `Context: ${content}\n\nPrompt: ${aiPrompt}` }
            ]
          })
        });
        const data = await res.json();
        const aiContent = data.response || data.choices?.[0]?.message?.content || data.text || 'No response';
        setAiMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      } else if (aiProvider === 'gemini') {
        const apiKey = aiApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API Key is missing');
        
        const genAI = new GoogleGenAI({ apiKey });
        const response = await genAI.models.generateContent({
          model: aiModel,
          contents: [
            { role: 'user', parts: [{ text: `Context: ${content}\n\nPrompt: ${aiPrompt}` }] }
          ],
          config: {
            systemInstruction: aiSystemPrompt
          }
        });
        
        setAiMessages(prev => [...prev, { role: 'assistant', content: response.text || 'No response' }]);
      } else if (aiProvider === 'openai') {
        // Basic fetch for OpenAI if key is provided
        if (!aiApiKey) throw new Error('OpenAI API Key is missing');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiApiKey}`
          },
          body: JSON.stringify({
            model: aiModel,
            messages: [
              { role: 'system', content: aiSystemPrompt },
              { role: 'user', content: `Context: ${content}\n\nPrompt: ${aiPrompt}` }
            ]
          })
        });
        const data = await res.json();
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        // Fallback to existing backend API if no specific provider logic
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt, context: content, provider: aiProvider, model: aiModel, apiKey: aiApiKey })
        });
        const data = await res.json();
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err: any) {
      console.error('AI failed', err);
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Unknown error'}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => (
      <div key={item.path}>
        <div 
          onClick={() => item.type === 'file' ? openFile(item.path) : null}
          className={`group flex items-center justify-between px-4 ${isMobile ? 'py-2.5' : 'py-1'} cursor-pointer transition-all border-l-2 ${
            activeFile === item.path 
              ? 'bg-ide-active text-ide-text-bright border-ide-accent' 
              : 'hover:bg-ide-hover border-transparent text-gray-400 hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {item.type === 'directory' ? <ChevronRight size={14} className="text-gray-500" /> : null}
            {item.type === 'directory' ? <FolderOpen size={16} className="text-blue-400" /> : <FileCode size={16} className={item.name.endsWith('.py') ? 'text-yellow-500' : 'text-blue-400'} />}
            <span className="truncate text-sm">{item.name}</span>
          </div>
          <button 
            onClick={(e) => renameItem(item.path, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
          >
            <Edit3 size={14} className="text-gray-500 hover:text-blue-400" />
          </button>
          <button 
            onClick={(e) => deleteItem(item.path, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
          >
            <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  const AuthRequired = ({ children, title, description }: { children: React.ReactNode, title: string, description: string }) => {
    if (user) return <>{children}</>;

    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ide-active flex items-center justify-center mb-4 shadow-lg border border-ide-border">
          <Lock size={32} className="text-ide-accent" />
        </div>
        <h3 className="text-lg font-bold text-ide-text-bright mb-2">{title}</h3>
        <p className="text-xs text-gray-500 mb-6 max-w-[200px]">{description}</p>
        
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
          <input 
            type="text"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            required
            className="w-full bg-ide-bg border border-ide-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-ide-accent"
            placeholder={t.username}
          />
          <input 
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            className="w-full bg-ide-bg border border-ide-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-ide-accent"
            placeholder={t.password}
          />
          {authError && <div className="text-[10px] text-red-400">{authError}</div>}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-ide-accent hover:bg-ide-accent/80 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin mx-auto" size={16} /> : (authMode === 'login' ? t.login : t.register)}
          </button>
        </form>
        <button 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="mt-4 text-[10px] text-gray-500 hover:text-ide-accent"
        >
          {authMode === 'login' ? t.noAccount : t.haveAccount}
        </button>
      </div>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-ide-bg flex items-center justify-center">
        <RefreshCw className="animate-spin text-ide-accent" size={32} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-ide-bg text-ide-text font-sans overflow-hidden ${currentTheme.class}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`flex flex-1 overflow-hidden ${isRtl ? 'flex-row-reverse' : 'flex-row'} ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* Activity Bar (VS Code Style - Desktop) */}
        {!isZenMode && !isMobile && (
          <div className={`w-12 bg-ide-activitybar flex flex-col items-center py-2 gap-2 border-ide-border shrink-0 ${isRtl ? (sidebarPosition === 'left' ? 'border-l' : 'border-r') : (sidebarPosition === 'left' ? 'border-r' : 'border-l')}`}>
            <button onClick={() => { setActiveTab('explorer'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'explorer' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'explorer' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <Files size={24} />
            </button>
            <button onClick={() => { setActiveTab('search'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'search' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'search' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <Search size={24} />
            </button>
            <button onClick={() => { setActiveTab('git'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'git' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'git' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <GitBranch size={24} />
            </button>
            <button onClick={() => { setActiveTab('run'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'run' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'run' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <PlayCircle size={24} />
            </button>
            <button onClick={() => { setActiveTab('extensions'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'extensions' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'extensions' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <Blocks size={24} />
            </button>
            <button onClick={() => { setActiveTab('ai'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'ai' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'ai' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
              <Bot size={24} />
            </button>
            <div className="mt-auto flex flex-col items-center gap-2 pb-2">
              <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'profile' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'profile' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
                <User size={24} />
              </button>
              <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(true); }} className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-white border-ide-accent' : 'text-gray-500 hover:text-gray-300'} ${activeTab === 'settings' ? (isRtl ? (sidebarPosition === 'left' ? 'border-r-2' : 'border-l-2') : (sidebarPosition === 'left' ? 'border-l-2' : 'border-r-2')) : ''}`}>
                <Settings size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Content */}
        <motion.aside 
          initial={false}
          animate={{ 
            width: (isSidebarOpen && !isZenMode) ? (isMobile ? '100%' : '260px') : '0px',
            x: (isSidebarOpen && !isZenMode) ? 0 : (isMobile ? (isRtl ? 600 : -600) : (isRtl ? 300 : -300))
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`bg-ide-sidebar flex flex-col z-50 fixed md:relative h-full border-ide-border shadow-2xl md:shadow-none ${isRtl ? (sidebarPosition === 'left' ? (isMobile ? 'right-0' : 'right-12') + ' border-l' : 'left-0 border-r') : (sidebarPosition === 'left' ? (isMobile ? 'left-0' : 'left-12') + ' border-r' : 'right-0 border-l')}`}
        >
          <div className="h-9 px-4 flex items-center justify-between shrink-0 bg-ide-header/50">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
              {activeTab === 'explorer' && t.explorer}
              {activeTab === 'search' && t.search}
              {activeTab === 'git' && t.git}
              {activeTab === 'run' && t.run}
              {activeTab === 'extensions' && t.extensions}
              {activeTab === 'ai' && t.ai}
              {activeTab === 'settings' && t.settings}
              {activeTab === 'profile' && t.userProfile}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors" title={t.close}>
                <X size={14} />
              </button>
            </div>
          </div>

          {activeTab === 'explorer' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-1 bg-ide-active/30 cursor-pointer">
                <div className="flex items-center gap-1">
                  <ChevronDown size={14} />
                  <span className="text-[11px] font-bold uppercase">{t.workspace}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => createFile('file')} className="p-1 hover:bg-ide-active rounded text-gray-400 hover:text-white" title={t.newFile}><Plus size={14} /></button>
                  <button onClick={() => createFile('directory')} className="p-1 hover:bg-ide-active rounded text-gray-400 hover:text-white" title={t.newFolder}><FolderPlus size={14} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                {renderFileTree(files)}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="flex flex-col h-full p-4 gap-4">
              <div className="flex flex-col gap-2">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t.search}
                  className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => openFile(res.path, res.line)}
                      className="p-2 hover:bg-ide-hover rounded cursor-pointer border border-transparent hover:border-ide-border group text-left"
                      dir="ltr"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-ide-accent truncate">{res.path}</span>
                        <span className="text-[10px] text-gray-500">Line {res.line}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate italic">"{res.content}"</p>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && !isLoading && (
                    <div className="text-center py-8 text-gray-500 text-xs">No results found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'git' && (
            <AuthRequired title={t.git} description={t.gitAuthDesc}>
              <div className="flex flex-col h-full p-4 gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-ide-border">
                <button 
                  onClick={pull}
                  className="flex-1 flex items-center justify-center gap-1 bg-ide-active hover:bg-ide-hover py-1 rounded text-[10px] font-bold transition-colors"
                  title={t.pull}
                >
                  <DownloadCloud size={14} />
                  {t.pull}
                </button>
                <button 
                  onClick={push}
                  className="flex-1 flex items-center justify-center gap-1 bg-ide-active hover:bg-ide-hover py-1 rounded text-[10px] font-bold transition-colors"
                  title={t.push}
                >
                  <UploadCloud size={14} />
                  {t.push}
                </button>
                <button 
                  onClick={fetchGit}
                  className="flex items-center justify-center p-1 bg-ide-active hover:bg-ide-hover rounded transition-colors"
                  title={t.fetch}
                >
                  <RefreshCw size={14} />
                </button>
                <button 
                  onClick={cloneRepo}
                  className="flex items-center justify-center p-1 bg-ide-active hover:bg-ide-hover rounded transition-colors"
                  title={t.cloneRepo}
                >
                  <FolderPlus size={14} />
                </button>
              </div>

              {gitDiff ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setGitDiff(null)} 
                      className="flex items-center gap-1 text-[10px] text-ide-accent hover:underline uppercase font-bold"
                    >
                      <ChevronRight size={14} className={isRtl ? "" : "rotate-180"} />
                      {t.back}
                    </button>
                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{selectedGitFile}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/30 p-3 rounded border border-ide-border">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {gitDiff}
                    </pre>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder={t.message}
                      className="bg-ide-bg border border-ide-border rounded p-2 text-sm focus:outline-none focus:border-ide-accent resize-none h-20"
                    />
                    <button 
                      onClick={handleCommit}
                      className="bg-ide-accent hover:bg-blue-600 text-white py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      {t.commit}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Staged Changes Section */}
                    {gitStatus?.files.some((f: any) => f.index !== ' ' && f.index !== '?') && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between py-1 border-b border-ide-border mb-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{t.stagedChanges}</span>
                          <span className="bg-ide-active px-1.5 rounded text-[10px]">
                            {gitStatus?.files.filter((f: any) => f.index !== ' ' && f.index !== '?').length}
                          </span>
                        </div>
                        {gitStatus?.files.filter((f: any) => f.index !== ' ' && f.index !== '?').map((f: any) => (
                          <div 
                            key={`staged-${f.path}`} 
                            onClick={() => fetchGitDiff(f.path)}
                            className={`flex items-center justify-between py-1 text-sm group cursor-pointer hover:bg-ide-hover px-2 rounded ${selectedGitFile === f.path ? 'bg-ide-active' : ''}`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden text-gray-400">
                              <span className={`w-2 h-2 rounded-full ${f.index === 'M' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                              <span className="truncate">{f.path}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                              <button 
                                onClick={(e) => { e.stopPropagation(); unstageFile(f.path); }}
                                className="p-1 hover:bg-white/10 rounded transition-all"
                                title="Unstage"
                              >
                                <Minus size={14} className="text-gray-500 hover:text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unstaged Changes Section */}
                    <div className="flex items-center justify-between py-1 border-b border-ide-border mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{t.changes}</span>
                      <span className="bg-ide-active px-1.5 rounded text-[10px]">
                        {gitStatus?.files.filter((f: any) => f.working_dir !== ' ' || f.index === '?').length || 0}
                      </span>
                    </div>
                    {gitStatus?.files.filter((f: any) => f.working_dir !== ' ' || f.index === '?').map((f: any) => (
                      <div 
                        key={`unstaged-${f.path}`} 
                        onClick={() => fetchGitDiff(f.path)}
                        className={`flex items-center justify-between py-1 text-sm group cursor-pointer hover:bg-ide-hover px-2 rounded ${selectedGitFile === f.path ? 'bg-ide-active' : ''}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden text-gray-400">
                          <span className={`w-2 h-2 rounded-full ${f.working_dir === 'M' ? 'bg-yellow-500' : f.index === '?' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="truncate">{f.path}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button 
                            onClick={(e) => { e.stopPropagation(); stageFile(f.path); }}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                            title="Stage"
                          >
                            <Plus size={14} className="text-gray-500 hover:text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-ide-border">
                    <div className="flex items-center justify-between py-1 mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{t.branches}</span>
                      <button 
                        onClick={createBranch}
                        className="p-1 hover:bg-ide-active rounded text-gray-400 hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {branches?.all?.map((b: string) => (
                        <div 
                          key={b} 
                          onClick={() => switchBranch(b)}
                          className={`flex items-center justify-between py-1 px-2 hover:bg-ide-hover rounded cursor-pointer group ${branches.current === b ? 'bg-ide-active' : ''}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <GitBranch size={12} className={branches.current === b ? 'text-ide-accent' : 'text-gray-500'} />
                            <span className={`text-[11px] truncate ${branches.current === b ? 'font-bold text-white' : 'text-gray-400'}`}>{b}</span>
                          </div>
                          {branches.current === b && <CheckCircle2 size={12} className="text-ide-accent" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-ide-border">
                    <div className="flex items-center justify-between py-1 mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{t.remotes}</span>
                      <button 
                        onClick={() => {
                          const name = prompt('Remote name (e.g. origin):');
                          const url = prompt('Remote URL:');
                          if (name && url) {
                            fetch('/api/git/remote/add', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name, url })
                            }).then(() => fetchRemotes());
                          }
                        }}
                        className="p-1 hover:bg-ide-active rounded text-gray-400 hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {remotes.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-ide-hover rounded group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Globe size={12} className="text-gray-500" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[11px] font-bold text-gray-300">{r.name}</span>
                              <span className="text-[9px] text-gray-500 truncate">{r.refs.fetch}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (confirm(`Remove remote ${r.name}?`)) {
                                fetch('/api/git/remote/remove', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: r.name })
                                }).then(() => fetchRemotes());
                              }
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <button 
                      onClick={connectGitHub}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${isGitHubConnected ? 'bg-green-600/20 text-green-500 border border-green-600/50' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                      <GitBranch size={14} />
                      {isGitHubConnected ? 'Connected to GitHub' : t.connectGitHub}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => alert('GitLab integration coming soon!')}
                        className="flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-bold bg-orange-600/10 text-orange-500 border border-orange-600/30 hover:bg-orange-600/20 transition-all"
                      >
                        GitLab
                      </button>
                      <button 
                        onClick={() => alert('Bitbucket integration coming soon!')}
                        className="flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-600/30 hover:bg-blue-600/20 transition-all"
                      >
                        Bitbucket
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AuthRequired>
          )}

          {activeTab === 'run' && (
            <div className="flex flex-col h-full p-4 gap-6">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={runCode}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-bold transition-colors"
                >
                  <Play size={16} />
                  {t.runBtn}
                </button>
              </div>
              
              <div className="flex flex-col gap-4 border-t border-ide-border pt-4">
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold uppercase text-gray-400">{t.variables}</span>
                  </div>
                  <Plus size={14} className="text-gray-500 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold uppercase text-gray-400">{t.watch}</span>
                  </div>
                  <Plus size={14} className="text-gray-500 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold uppercase text-gray-400">{t.callStack}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold uppercase text-gray-400">{t.breakpoints}</span>
                  </div>
                  <Plus size={14} className="text-gray-500 opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="flex flex-col h-full p-4 gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  value={extensionSearch}
                  onChange={(e) => setExtensionSearch(e.target.value)}
                  placeholder={t.searchExtensions}
                  className="w-full bg-ide-bg border border-ide-border rounded pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                />
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-500">{t.installed}</span>
                  {installedExtensions.map(ext => (
                    <div key={ext.id} className="flex gap-3 p-2 hover:bg-ide-hover rounded group cursor-pointer">
                      <div className="w-10 h-10 bg-ide-active rounded flex items-center justify-center text-xl shrink-0">
                        {ext.icon}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{ext.name}</span>
                          <span className="text-[10px] text-gray-500">{ext.version}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{ext.desc}</p>
                        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] text-ide-accent hover:underline">Disable</button>
                          <button className="text-[10px] text-red-400 hover:underline">Uninstall</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-500">{t.recommended}</span>
                  <div className="p-8 text-center text-gray-500 text-xs italic">
                    Loading recommendations...
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <AuthRequired title={t.ai} description={t.aiAuthDesc}>
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-ide-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-500">{t.customAiSettings}</span>
                    <button 
                      onClick={() => setUseCustomAi(!useCustomAi)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${useCustomAi ? 'bg-ide-accent' : 'bg-gray-600'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useCustomAi ? (isRtl ? 'right-4.5' : 'left-4.5') : (isRtl ? 'right-0.5' : 'left-0.5')}`} />
                    </button>
                  </div>
                  {useCustomAi && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      <input 
                        value={customAiEndpoint}
                        onChange={(e) => setCustomAiEndpoint(e.target.value)}
                        placeholder={t.aiEndpoint}
                        className="bg-ide-bg border border-ide-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-ide-accent"
                      />
                      <input 
                        type="password"
                        value={customAiKey}
                        onChange={(e) => setCustomAiKey(e.target.value)}
                        placeholder={t.aiKey}
                        className="bg-ide-bg border border-ide-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-ide-accent"
                      />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {aiMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
                    <Bot size={48} />
                    <p className="text-sm">{t.askAi}</p>
                  </div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[95%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-ide-accent text-white' : 'bg-ide-active text-gray-200'}`}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isAiLoading && <div className="text-gray-500 text-xs animate-pulse flex items-center gap-2"><Bot size={14} />Thinking...</div>}
              </div>
              <div className="p-4 border-t border-ide-border flex flex-col gap-2">
                <div className="relative">
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAi())}
                    placeholder={t.askAi}
                    className="w-full bg-ide-bg border border-ide-border rounded px-3 py-2 text-sm focus:outline-none focus:border-ide-accent resize-none h-20"
                  />
                  <button onClick={askAi} className="absolute bottom-2 right-2 p-1.5 bg-ide-accent rounded text-white hover:bg-blue-600"><Send size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col h-full p-6">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-ide-active flex items-center justify-center border-2 border-ide-accent shadow-xl">
                  <User size={40} className="text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-ide-text-bright">{user?.username}</h2>
                  <p className="text-xs text-gray-500">Developer</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 bg-ide-bg rounded-xl border border-ide-border">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2">Account Info</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Username</span>
                      <span className="text-white">{user?.username}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">User ID</span>
                      <span className="text-white">#{user?.id}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm mt-4"
                >
                  <X size={16} />
                  {t.logout}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 custom-scrollbar">
              {/* Appearance & Layout */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500">{t.layout}</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-gray-400">{t.sidebarPosition}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSidebarPosition('left')}
                          className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${sidebarPosition === 'left' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                        >
                          {t.left}
                        </button>
                        <button 
                          onClick={() => setSidebarPosition('right')}
                          className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${sidebarPosition === 'right' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                        >
                          {t.right}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-ide-active/20 rounded border border-ide-border">
                      <span className="text-xs text-gray-300">{t.zenMode}</span>
                      <button 
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isZenMode ? 'bg-ide-accent' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isZenMode ? (isRtl ? 'right-6' : 'left-6') : (isRtl ? 'right-1' : 'left-1')}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500">{t.language}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUiLanguage('en')}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${uiLanguage === 'en' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setUiLanguage('ar')}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${uiLanguage === 'ar' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500">{t.theme}</label>
                  <div className="flex flex-col gap-2">
                    {THEMES.map(theme => (
                      <button 
                        key={theme.id}
                        onClick={() => setCurrentTheme(theme)}
                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium border transition-all flex items-center justify-between ${currentTheme.id === theme.id ? 'bg-ide-active text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                      >
                        {theme.name}
                        {currentTheme.id === theme.id && <CheckCircle2 size={14} className="text-ide-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor Settings */}
              <div className="flex flex-col gap-4 border-t border-ide-border pt-6">
                <label className="text-[11px] font-bold uppercase text-gray-500">{t.general}</label>
                
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.fontSize}</span>
                  <input 
                    type="number"
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.wordWrap}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditorWordWrap('on')}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${editorWordWrap === 'on' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                    >
                      {t.on}
                    </button>
                    <button 
                      onClick={() => setEditorWordWrap('off')}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${editorWordWrap === 'off' ? 'bg-ide-accent text-white border-ide-accent' : 'bg-ide-bg text-gray-400 border-ide-border hover:border-gray-500'}`}
                    >
                      {t.off}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.tabSize}</span>
                  <select 
                    value={editorTabSize}
                    onChange={(e) => setEditorTabSize(Number(e.target.value))}
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </div>
              </div>

              {/* AI Settings */}
              <div className="flex flex-col gap-4 border-t border-ide-border pt-6">
                <label className="text-[11px] font-bold uppercase text-gray-500">{t.aiConfig}</label>
                
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.aiProvider}</span>
                  <select 
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.aiModel}</span>
                  <input 
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.apiKey}</span>
                  <input 
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">{t.systemPrompt}</span>
                  <textarea 
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    className="bg-ide-bg border border-ide-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ide-accent resize-none h-24"
                  />
                </div>
              </div>

              <div className="mt-auto p-4 bg-ide-active/20 rounded-lg border border-ide-border">
                <div className="flex items-center gap-3 mb-2">
                  <Info size={16} className="text-ide-accent" />
                  <span className="text-xs font-bold">{t.appearance}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Customize your workspace to match your style. Changes are applied instantly across the entire IDE.
                </p>
              </div>
            </div>
          )}
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Tabs Bar */}
          <div className="h-9 bg-ide-header flex items-center border-b border-ide-border overflow-x-auto no-scrollbar shrink-0">
            {openTabs.map(tab => (
              <div 
                key={tab.path}
                onClick={() => openFile(tab.path)}
                className={`flex items-center gap-2 ${isMobile ? 'px-4 h-full min-w-[120px]' : 'px-3 h-full'} cursor-pointer border-ide-border text-xs transition-colors group shrink-0 ${
                  activeFile === tab.path 
                    ? 'bg-ide-tab-active text-white border-t-2 border-t-ide-accent' 
                    : 'bg-ide-tab-inactive text-gray-500 hover:bg-ide-hover'
                } ${isRtl ? 'border-l' : 'border-r'}`}
              >
                <FileCode size={14} className={tab.path.endsWith('.py') ? 'text-yellow-500' : 'text-blue-400'} />
                <span className="truncate max-w-[100px]">{tab.name}</span>
                <button 
                  onClick={(e) => closeTab(e, tab.path)}
                  className={`p-1 rounded hover:bg-white/10 transition-opacity ${activeFile === tab.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-2 px-4">
              <button 
                onClick={saveFile}
                disabled={!activeFile || isLoading}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
                title={t.save}
              >
                <Save size={16} />
              </button>
              <button 
                onClick={runCode}
                disabled={!activeFile}
                className="p-1.5 text-gray-400 hover:text-emerald-400 disabled:opacity-30"
                title={t.runBtn}
              >
                <Play size={16} />
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="h-6 px-4 bg-ide-bg flex items-center gap-1 text-[11px] text-gray-500 shrink-0" dir="ltr">
            {activeFile ? (
              <>
                <span>workspace</span>
                <ChevronRight size={12} />
                {activeFile.split('/').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <span className={i === arr.length - 1 ? 'text-gray-300' : ''}>{part}</span>
                    {i < arr.length - 1 && <ChevronRight size={12} />}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <span>{t.noFile}</span>
            )}
          </div>

          {/* Editor Workspace */}
          <div className="flex-1 relative bg-ide-bg overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language={language}
                theme={currentTheme.id === 'github-light' ? 'light' : 'vs-dark'}
                value={content}
                onChange={(val) => setContent(val || '')}
                onMount={(editor) => { editorRef.current = editor; }}
                options={{
                  fontSize: editorFontSize,
                  minimap: { enabled: !isMobile },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16 },
                  wordWrap: editorWordWrap,
                  tabSize: editorTabSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  renderLineHighlight: 'all'
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-6 p-8 text-center bg-ide-bg">
                <div className="w-32 h-32 rounded-3xl bg-ide-sidebar flex items-center justify-center shadow-2xl border border-ide-border">
                  <Layout size={64} className="text-ide-active" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-ide-text-bright mb-2">{t.welcome}</h2>
                  <p className="text-sm max-w-xs mx-auto opacity-60 leading-relaxed">
                    {t.welcomeDesc}
                  </p>
                </div>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 max-w-sm w-full`}>
                  <div className="p-4 bg-ide-sidebar rounded-lg border border-ide-border text-left">
                    <h3 className="text-xs font-bold uppercase text-ide-accent mb-2">{t.start}</h3>
                    <button onClick={() => createFile('file')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-1"><Plus size={14} /> {t.newFile}</button>
                    <button onClick={cloneRepo} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mt-2 py-1"><GitBranch size={14} /> {t.cloneRepo}</button>
                    <button onClick={() => setActiveTab('explorer')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mt-2 py-1"><FolderOpen size={14} /> {t.workspace}</button>
                  </div>
                  <div className="p-4 bg-ide-sidebar rounded-lg border border-ide-border text-left">
                    <h3 className="text-xs font-bold uppercase text-ide-accent mb-2">{t.recent}</h3>
                    <p className="text-[10px] text-gray-500 italic">No recent files</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel (Terminal/Output) */}
          <motion.div 
            animate={{ 
              height: isPanelOpen ? (isPanelMaximized ? '100%' : (isMobile ? '40%' : '240px')) : '0px',
              y: isPanelOpen ? 0 : 50
            }}
            className={`bg-ide-bg border-t border-ide-border flex flex-col overflow-hidden z-30 ${isPanelMaximized ? 'fixed inset-0 h-full w-full' : ''}`}
          >
            <div className="h-9 px-4 bg-ide-header flex items-center justify-between shrink-0 border-b border-ide-border">
              <div className="flex items-center h-full">
                <button 
                  onClick={() => setActivePanelTab('problems')}
                  className={`px-3 h-full text-[11px] font-medium uppercase tracking-wider transition-colors border-b-2 ${activePanelTab === 'problems' ? 'text-white border-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                >
                  {t.problems}
                </button>
                <button 
                  onClick={() => setActivePanelTab('output')}
                  className={`px-3 h-full text-[11px] font-medium uppercase tracking-wider transition-colors border-b-2 ${activePanelTab === 'output' ? 'text-white border-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                >
                  {t.output}
                </button>
                <button 
                  onClick={() => setActivePanelTab('debug')}
                  className={`px-3 h-full text-[11px] font-medium uppercase tracking-wider transition-colors border-b-2 ${activePanelTab === 'debug' ? 'text-white border-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                >
                  {t.debug}
                </button>
                <button 
                  onClick={() => setActivePanelTab('terminal')}
                  className={`px-3 h-full text-[11px] font-medium uppercase tracking-wider transition-colors border-b-2 ${activePanelTab === 'terminal' ? 'text-white border-white' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                >
                  {t.terminal}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPanelMaximized(!isPanelMaximized)} 
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                  title={isPanelMaximized ? t.restore : t.maximize}
                >
                  {isPanelMaximized ? <ChevronDown size={14} /> : <ChevronDown size={14} className="rotate-180" />}
                </button>
                <button onClick={() => setIsPanelOpen(false)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors" title={t.close}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-black/20" dir="ltr">
              {activePanelTab === 'terminal' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm custom-scrollbar">
                    {terminalHistory.map((line, i) => (
                      <div key={i} className="mb-1 whitespace-pre-wrap break-all text-gray-300">
                        {line}
                      </div>
                    ))}
                    <div className="whitespace-pre-wrap break-all text-emerald-400">
                      {output}
                    </div>
                  </div>
                  <form onSubmit={execTerminal} className="flex items-center gap-2 px-4 py-2 border-t border-ide-border bg-ide-bg shrink-0">
                    <span className="text-ide-accent font-bold text-xs shrink-0">$</span>
                    <input 
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder={t.terminalPrompt}
                      className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono text-white"
                    />
                  </form>
                </div>
              )}
              {activePanelTab === 'output' && (
                <div className="p-4 text-gray-400 italic text-xs">{t.noOutput}</div>
              )}
              {activePanelTab === 'problems' && (
                <div className="p-4 flex items-center gap-2 text-gray-500 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>{t.noProblems}</span>
                </div>
              )}
              {activePanelTab === 'debug' && (
                <div className="p-4 text-gray-400 italic text-xs">{t.debugInactive}</div>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      {isMobile && !isZenMode && (
        <div className="h-14 bg-ide-activitybar border-t border-ide-border flex items-center justify-around shrink-0 z-50 px-2">
          <button onClick={() => { setActiveTab('explorer'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'explorer' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <Files size={20} />
            <span className="text-[9px] font-bold uppercase">{t.explorer}</span>
          </button>
          <button onClick={() => { setActiveTab('search'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'search' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <Search size={20} />
            <span className="text-[9px] font-bold uppercase">{t.search}</span>
          </button>
          <button onClick={() => { setActiveTab('git'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'git' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <GitBranch size={20} />
            <span className="text-[9px] font-bold uppercase">{t.git}</span>
          </button>
          <button onClick={() => { setActiveTab('ai'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'ai' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <Bot size={20} />
            <span className="text-[9px] font-bold uppercase">{t.ai}</span>
          </button>
          <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'settings' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <Settings size={20} />
            <span className="text-[9px] font-bold uppercase">{t.settings}</span>
          </button>
          <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(true); }} className={`p-3 flex flex-col items-center gap-1 ${activeTab === 'profile' && isSidebarOpen ? 'text-ide-accent' : 'text-gray-500'}`}>
            <User size={20} />
            <span className="text-[9px] font-bold uppercase">{t.userProfile}</span>
          </button>
        </div>
      )}

      {/* Status Bar */}
      <footer className="h-6 bg-ide-statusbar flex items-center justify-between px-3 text-[11px] text-white shrink-0 z-50">
        <div className={`flex items-center gap-4 h-full ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div 
            onClick={() => {
              if (branches?.all) {
                const branch = prompt(`${t.switchBranch} (Current: ${branches.current}):\n${branches.all.join('\n')}`);
                if (branch && branches.all.includes(branch)) {
                  switchBranch(branch);
                }
              }
            }}
            className="flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer"
          >
            <GitBranch size={12} />
            <span className={isMobile ? 'hidden' : ''}>{branches?.current || 'master'}*</span>
          </div>
          <div className="flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer">
            <Info size={12} />
            <span className={isMobile ? 'hidden' : ''}>{t.problemsStat}</span>
          </div>
          <div className="flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer">
            <CheckCircle2 size={12} />
            <span className={isMobile ? 'hidden' : ''}>{t.ready}</span>
          </div>
        </div>
        <div className={`flex items-center gap-4 h-full ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer ${!isSidebarOpen ? 'text-ide-accent' : ''} ${isMobile ? 'hidden' : ''}`}
            title={t.explorer}
          >
            <Layout size={12} className={sidebarPosition === 'right' ? 'rotate-180' : ''} />
          </button>
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer ${!isPanelOpen ? 'text-ide-accent' : ''}`}
            title={t.terminal}
          >
            <Terminal size={12} />
          </button>
          <div className="hover:bg-white/10 px-2 h-full cursor-pointer">
            Ln 1, Col 1
          </div>
          <div className={`hover:bg-white/10 px-2 h-full cursor-pointer ${isMobile ? 'hidden' : ''}`}>
            Spaces: 2
          </div>
          <div className={`hover:bg-white/10 px-2 h-full cursor-pointer ${isMobile ? 'hidden' : ''}`}>
            UTF-8
          </div>
          <div className="hover:bg-white/10 px-2 h-full cursor-pointer uppercase">
            {language}
          </div>
          <div className="flex items-center gap-1 hover:bg-white/10 px-2 h-full cursor-pointer">
            <Bell size={12} />
          </div>
        </div>
      </footer>
    </div>
  );
}
