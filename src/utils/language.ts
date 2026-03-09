export const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  cpp: "cpp", cc: "cpp", cxx: "cpp",
  c: "c", h: "c",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  swift: "swift",
  html: "html", htm: "html",
  css: "css",
  scss: "scss", sass: "scss",
  less: "less",
  json: "json",
  xml: "xml",
  yaml: "yaml", yml: "yaml",
  toml: "ini",
  md: "markdown",
  sh: "shell", bash: "shell", zsh: "shell",
  sql: "sql",
  dockerfile: "dockerfile",
  r: "r",
  dart: "dart",
  vue: "html",
  svelte: "html",
  graphql: "graphql", gql: "graphql",
  proto: "proto",
  lua: "lua",
  pl: "perl",
  ex: "elixir", exs: "elixir",
  hs: "haskell",
  scala: "scala",
  clj: "clojure",
  txt: "plaintext",
  env: "ini",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
};

export function detectLanguage(filePath: string): string {
  const filename = filePath.split("/").pop()?.toLowerCase() || "";
  if (filename === "dockerfile") return "dockerfile";
  if (filename === "makefile") return "makefile";
  if (filename === ".env" || filename.startsWith(".env.")) return "ini";
  const ext = filename.split(".").pop() || "";
  return LANGUAGE_MAP[ext] || "plaintext";
}

export function getFileIcon(filePath: string): { color: string; emoji: string } {
  const lang = detectLanguage(filePath);
  const icons: Record<string, { color: string; emoji: string }> = {
    typescript: { color: "text-blue-400", emoji: "TS" },
    javascript: { color: "text-yellow-400", emoji: "JS" },
    python: { color: "text-green-400", emoji: "🐍" },
    rust: { color: "text-orange-400", emoji: "RS" },
    go: { color: "text-cyan-400", emoji: "Go" },
    html: { color: "text-orange-500", emoji: "🌐" },
    css: { color: "text-blue-300", emoji: "🎨" },
    scss: { color: "text-pink-400", emoji: "🎨" },
    json: { color: "text-yellow-300", emoji: "{}" },
    markdown: { color: "text-gray-300", emoji: "📝" },
    shell: { color: "text-green-300", emoji: "$>" },
    yaml: { color: "text-purple-400", emoji: "⚙️" },
    dockerfile: { color: "text-blue-400", emoji: "🐳" },
    sql: { color: "text-blue-500", emoji: "🗄️" },
  };
  return icons[lang] || { color: "text-gray-400", emoji: "📄" };
}
