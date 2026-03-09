export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileItem[];
  isOpen?: boolean;
}

export interface OpenTab {
  path: string;
  name: string;
  isDirty?: boolean;
}

export type ActivityTab = "explorer" | "search" | "git" | "run" | "extensions" | "ai" | "settings" | "profile";
export type PanelTab = "terminal" | "output" | "problems" | "debug";
export type Lang = "en" | "ar";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface ModalConfig {
  type: "alert" | "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
}

export const TRANSLATIONS = {
  en: {
    explorer: "Explorer", search: "Search", git: "Source Control", run: "Run & Debug",
    extensions: "Extensions", ai: "AI Assistant", settings: "Settings", workspace: "Workspace",
    newFile: "New File", newFolder: "New Folder", commit: "Commit", message: "Commit message...",
    changes: "Changes", stagedChanges: "Staged Changes", askAi: "Ask AI...", save: "Save",
    runBtn: "Run", terminal: "Terminal", output: "Output", problems: "Problems",
    debug: "Debug Console", noFile: "No file open", welcome: "Visual Studio Web",
    welcomeDesc: "A professional-grade development environment in your browser.",
    start: "Start", recent: "Recent", language: "Language", theme: "Theme",
    appearance: "Appearance", ready: "Ready", problemsStat: "0 Problems",
    fontSize: "Font Size", wordWrap: "Word Wrap", tabSize: "Tab Size",
    aiProvider: "AI Provider", aiModel: "AI Model", systemPrompt: "System Prompt",
    apiKey: "API Key", on: "On", off: "Off", general: "General", aiConfig: "AI Configuration",
    saveSettings: "Save Settings", rename: "Rename", delete: "Delete", diff: "Diff",
    noDiff: "No changes", push: "Push", pull: "Pull", fetch: "Fetch", remotes: "Remotes",
    connectGitHub: "Connect GitHub", cloneRepo: "Clone Repo", branches: "Branches",
    switchBranch: "Switch Branch", createBranch: "Create Branch", close: "Close", back: "Back",
    layout: "Layout", sidebarPosition: "Sidebar Position", left: "Left", right: "Right",
    zenMode: "Zen Mode", maximize: "Maximize", restore: "Restore", login: "Login",
    register: "Register", username: "Username", password: "Password", logout: "Logout",
    authRequired: "Authentication Required", noAccount: "Don't have an account?",
    haveAccount: "Already have an account?", invalidAuth: "Invalid username or password",
    userProfile: "Profile", customAiSettings: "Custom AI Settings",
    useCustomAi: "Use Custom AI API", aiEndpoint: "API Endpoint", aiKey: "API Key (optional)",
    gitAuthDesc: "Login to manage repositories and Git features.",
    aiAuthDesc: "Login to use the AI assistant.",
    autoSave: "Auto Save", autoSaveDesc: "Automatically save files after changes",
    minimap: "Minimap", minimapDesc: "Show minimap in editor",
    searchPlaceholder: "Search in files...", confirmDelete: "Delete",
    cancelBtn: "Cancel", confirmBtn: "Confirm", enterName: "Enter name",
    enterCommitMsg: "Enter commit message", remoteName: "Remote name (e.g. origin)",
    remoteUrl: "Remote URL", stageAll: "Stage All", filesSaved: "File saved",
    cloneSuccess: "Clone successful", pushSuccess: "Push successful", pullSuccess: "Pull successful",
    fetchSuccess: "Fetch successful", commitSuccess: "Committed successfully",
    copyCode: "Copy code", copied: "Copied!",
  },
  ar: {
    explorer: "المستكشف", search: "البحث", git: "إدارة الكود", run: "التشغيل والتصحيح",
    extensions: "الإضافات", ai: "مساعد الذكاء الاصطناعي", settings: "الإعدادات",
    workspace: "مساحة العمل", newFile: "ملف جديد", newFolder: "مجلد جديد",
    commit: "حفظ التغييرات", message: "رسالة الحفظ...", changes: "التغييرات",
    stagedChanges: "التغييرات المرحلية", askAi: "اسأل الذكاء الاصطناعي...",
    save: "حفظ", runBtn: "تشغيل", terminal: "الطرفية", output: "المخرجات",
    problems: "المشاكل", debug: "وحدة التصحيح", noFile: "لا يوجد ملف مفتوح",
    welcome: "فيجوال ستوديو ويب", welcomeDesc: "بيئة تطوير احترافية في متصفحك.",
    start: "البدء", recent: "الأخيرة", language: "اللغة", theme: "المظهر",
    appearance: "المظهر", ready: "جاهز", problemsStat: "0 مشاكل",
    fontSize: "حجم الخط", wordWrap: "التفاف النص", tabSize: "حجم التبويب",
    aiProvider: "مزود الذكاء الاصطناعي", aiModel: "النموذج", systemPrompt: "نظام التعليمات",
    apiKey: "مفتاح الـ API", on: "تفعيل", off: "تعطيل", general: "عام",
    aiConfig: "إعدادات الذكاء الاصطناعي", saveSettings: "حفظ الإعدادات",
    rename: "إعادة تسمية", delete: "حذف", diff: "الفروقات", noDiff: "لا تغييرات",
    push: "رفع", pull: "سحب", fetch: "جلب", remotes: "المستودعات البعيدة",
    connectGitHub: "الاتصال بـ GitHub", cloneRepo: "استنساخ مستودع",
    branches: "الفروع", switchBranch: "تبديل الفرع", createBranch: "فرع جديد",
    close: "إغلاق", back: "رجوع", layout: "تنسيق الواجهة",
    sidebarPosition: "موقع الشريط الجانبي", left: "يسار", right: "يمين",
    zenMode: "وضع التركيز", maximize: "تكبير", restore: "استعادة", login: "تسجيل الدخول",
    register: "إنشاء حساب", username: "اسم المستخدم", password: "كلمة المرور",
    logout: "تسجيل الخروج", authRequired: "مطلوب تسجيل الدخول",
    noAccount: "ليس لديك حساب؟", haveAccount: "لديك حساب؟",
    invalidAuth: "اسم المستخدم أو كلمة المرور غير صحيحة", userProfile: "الملف الشخصي",
    customAiSettings: "إعدادات الذكاء المخصصة", useCustomAi: "استخدام API مخصص",
    aiEndpoint: "نقطة النهاية", aiKey: "مفتاح API (اختياري)",
    gitAuthDesc: "سجّل دخولك لإدارة مستودعات Git.", aiAuthDesc: "سجّل دخولك لاستخدام الذكاء الاصطناعي.",
    autoSave: "حفظ تلقائي", autoSaveDesc: "حفظ الملفات تلقائياً بعد التعديل",
    minimap: "الخريطة المصغّرة", minimapDesc: "عرض خريطة مصغّرة في المحرر",
    searchPlaceholder: "البحث في الملفات...", confirmDelete: "حذف",
    cancelBtn: "إلغاء", confirmBtn: "تأكيد", enterName: "أدخل الاسم",
    enterCommitMsg: "أدخل رسالة الحفظ", remoteName: "اسم الريموت (مثال: origin)",
    remoteUrl: "رابط الريموت", stageAll: "إضافة الكل", filesSaved: "تم الحفظ",
    cloneSuccess: "تم الاستنساخ", pushSuccess: "تم الرفع", pullSuccess: "تم السحب",
    fetchSuccess: "تم الجلب", commitSuccess: "تم الحفظ بنجاح", copyCode: "نسخ",
    copied: "تم النسخ!",
  },
} as const;

export const THEMES = [
  { id: "dark", name: "VS Code Dark", class: "" },
  { id: "github-light", name: "GitHub Light", class: "theme-github-light" },
  { id: "monokai", name: "Monokai", class: "theme-monokai" },
  { id: "dracula", name: "Dracula", class: "theme-dracula" },
  { id: "solarized-dark", name: "Solarized Dark", class: "theme-solarized-dark" },
  { id: "one-dark", name: "One Dark Pro", class: "theme-one-dark" },
];
