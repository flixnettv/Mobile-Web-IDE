import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import cors from "cors";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { simpleGit } from "simple-git";
import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, "workspace");
fs.ensureDirSync(WORKSPACE_DIR);
const git = simpleGit(WORKSPACE_DIR);

// Safe path resolution - prevents path traversal
function safeResolve(relativePath: string): string | null {
  const resolved = path.resolve(WORKSPACE_DIR, relativePath);
  if (!resolved.startsWith(WORKSPACE_DIR + path.sep) && resolved !== WORKSPACE_DIR) return null;
  return resolved;
}

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Authentication required" });
  next();
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const db = new Database("users.db");
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      await git.init();
      await fs.writeFile(path.join(WORKSPACE_DIR, "README.md"), "# Workspace\nWelcome to your new workspace.");
      await git.add(".");
      await git.commit("Initial commit");
    }
  } catch (err) { console.error("Git init failed", err); }

  app.use(express.json({ limit: "10mb" }));
  app.use(session({
    secret: process.env.SESSION_SECRET || (() => { const r = Math.random().toString(36).slice(2)+Date.now().toString(36); console.warn("⚠️  SESSION_SECRET not set"); return r; })(),
    resave: false, saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax", maxAge: 1000*60*60*24*7 }
  }));

  // AUTH
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    try {
      const hashed = await bcrypt.hash(password, 12);
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username.trim(), hashed);
      (req.session as any).userId = info.lastInsertRowid;
      (req.session as any).username = username.trim();
      res.json({ success: true, user: { id: info.lastInsertRowid, username: username.trim() } });
    } catch (e: any) {
      if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(400).json({ error: "Username already exists" });
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid username or password" });
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch { res.status(500).json({ error: "Login failed" }); }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!(req.session as any).userId) return res.status(401).json({ error: "Not authenticated" });
    res.json({ user: { id: (req.session as any).userId, username: (req.session as any).username } });
  });

  // FILES (all protected)
  const getFilesRecursively = async (dir: string): Promise<any[]> => {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const result: any[] = [];
    for (const item of items) {
      if (item.name === ".git") continue;
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(WORKSPACE_DIR, fullPath);
      if (item.isDirectory()) {
        result.push({ name: item.name, path: relativePath, type: "directory", children: await getFilesRecursively(fullPath) });
      } else {
        result.push({ name: item.name, path: relativePath, type: "file" });
      }
    }
    return result;
  };

  app.get("/api/files", requireAuth, async (_req, res) => {
    try { res.json({ files: await getFilesRecursively(WORKSPACE_DIR) }); }
    catch { res.status(500).json({ error: "Failed to list files" }); }
  });

  app.post("/api/files/create", requireAuth, async (req, res) => {
    const { name, type = "file" } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const target = safeResolve(name);
    if (!target) return res.status(403).json({ error: "Invalid path" });
    try {
      type === "directory" ? await fs.ensureDir(target) : await fs.ensureFile(target);
      res.json({ success: true });
    } catch { res.status(500).json({ error: `Failed to create ${type}` }); }
  });

  app.post("/api/files/read", requireAuth, async (req, res) => {
    const full = safeResolve(req.body.path);
    if (!full) return res.status(403).json({ error: "Invalid path" });
    try { res.json({ content: await fs.readFile(full, "utf-8") }); }
    catch { res.status(500).json({ error: "Failed to read file" }); }
  });

  app.post("/api/files/write", requireAuth, async (req, res) => {
    const full = safeResolve(req.body.path);
    if (!full) return res.status(403).json({ error: "Invalid path" });
    try { await fs.writeFile(full, req.body.content ?? ""); res.json({ success: true }); }
    catch { res.status(500).json({ error: "Failed to write file" }); }
  });

  app.post("/api/files/delete", requireAuth, async (req, res) => {
    const full = safeResolve(req.body.path);
    if (!full) return res.status(403).json({ error: "Invalid path" });
    try { await fs.remove(full); res.json({ success: true }); }
    catch { res.status(500).json({ error: "Failed to delete" }); }
  });

  app.post("/api/files/rename", requireAuth, async (req, res) => {
    const oldFull = safeResolve(req.body.oldPath);
    const newFull = safeResolve(req.body.newPath);
    if (!oldFull || !newFull) return res.status(403).json({ error: "Invalid path" });
    try { await fs.move(oldFull, newFull); res.json({ success: true }); }
    catch { res.status(500).json({ error: "Failed to rename" }); }
  });

  // CODE RUNNER (protected, timeout)
  app.post("/api/run", requireAuth, async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.json({ output: "", error: null });
    const ext = language === "python" ? "py" : "js";
    const tempFile = path.join(WORKSPACE_DIR, `_run_${Date.now()}.${ext}`);
    try {
      await fs.writeFile(tempFile, code);
      const cmd = language === "python" ? `python3 "${tempFile}"` : `node "${tempFile}"`;
      exec(cmd, { timeout: 10000 }, async (error, stdout, stderr) => {
        await fs.remove(tempFile).catch(() => {});
        res.json({ output: stdout, error: stderr || (error ? error.message : null) });
      });
    } catch { await fs.remove(tempFile).catch(() => {}); res.status(500).json({ error: "Execution failed" }); }
  });

  // SEARCH (protected)
  app.post("/api/search", requireAuth, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.json({ results: [] });
    const results: any[] = [];
    const searchRec = async (dir: string) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const rel = path.relative(WORKSPACE_DIR, fullPath);
        if (item.isDirectory()) {
          if (["node_modules", ".git", "dist"].includes(item.name)) continue;
          await searchRec(fullPath);
        } else {
          try {
            const lines = (await fs.readFile(fullPath, "utf-8")).split("\n");
            lines.forEach((line, i) => {
              if (line.toLowerCase().includes(query.toLowerCase()))
                results.push({ path: rel, line: i + 1, content: line.trim() });
            });
          } catch {}
        }
      }
    };
    try { await searchRec(WORKSPACE_DIR); res.json({ results: results.slice(0, 300) }); }
    catch { res.status(500).json({ error: "Search failed" }); }
  });

  // TERMINAL (protected + blocked dangerous commands)
  const BLOCKED = /\b(rm\s+-rf\s+\/|mkfs|dd\s+if=\/dev\/zero|shutdown|reboot|halt|poweroff)\b/i;
  app.post("/api/terminal/exec", requireAuth, async (req, res) => {
    const { command } = req.body;
    if (!command) return res.json({ output: "" });
    if (BLOCKED.test(command)) return res.status(403).json({ error: "Command blocked for safety." });
    exec(command, { cwd: WORKSPACE_DIR, timeout: 15000 }, (error, stdout, stderr) => {
      res.json({ output: stdout, error: stderr || (error ? error.message : null) });
    });
  });

  // GIT (protected)
  app.get("/api/git/status", requireAuth, async (_req, res) => { try { res.json(await git.status()); } catch { res.status(500).json({ error: "Git status failed" }); }});
  app.post("/api/git/stage", requireAuth, async (req, res) => { try { await git.add(req.body.path||"."); res.json({ success: true }); } catch { res.status(500).json({ error: "Stage failed" }); }});
  app.post("/api/git/unstage", requireAuth, async (req, res) => { try { await git.reset(["HEAD", req.body.path]); res.json({ success: true }); } catch { res.status(500).json({ error: "Unstage failed" }); }});
  app.post("/api/git/commit", requireAuth, async (req, res) => { if (!req.body.message) return res.status(400).json({ error: "Message required" }); try { res.json(await git.commit(req.body.message)); } catch { res.status(500).json({ error: "Commit failed" }); }});
  app.post("/api/git/diff", requireAuth, async (req, res) => { try { res.json({ diff: await git.diff([req.body.path]) }); } catch { res.status(500).json({ error: "Diff failed" }); }});
  app.get("/api/git/branches", requireAuth, async (_req, res) => { try { res.json(await git.branch()); } catch { res.status(500).json({ error: "Failed" }); }});
  app.post("/api/git/branch/create", requireAuth, async (req, res) => { try { await git.checkoutLocalBranch(req.body.name); res.json({ success: true }); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/branch/switch", requireAuth, async (req, res) => { try { await git.checkout(req.body.branch); res.json({ success: true }); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.get("/api/git/remotes", requireAuth, async (_req, res) => { try { res.json({ remotes: await git.getRemotes(true) }); } catch { res.status(500).json({ error: "Failed" }); }});
  app.post("/api/git/remote/add", requireAuth, async (req, res) => { try { await git.addRemote(req.body.name, req.body.url); res.json({ success: true }); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/remote/remove", requireAuth, async (req, res) => { try { await git.removeRemote(req.body.name); res.json({ success: true }); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/push", requireAuth, async (req, res) => { try { res.json(await git.push(req.body.remote||"origin", req.body.branch||"main")); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/pull", requireAuth, async (req, res) => { try { res.json(await git.pull(req.body.remote||"origin", req.body.branch||"main")); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/fetch", requireAuth, async (_req, res) => { try { res.json(await git.fetch()); } catch (e:any) { res.status(500).json({ error: e.message }); }});
  app.post("/api/git/clone", requireAuth, async (req, res) => {
    if (!req.body.url) return res.status(400).json({ error: "URL required" });
    try {
      const files = (await fs.readdir(WORKSPACE_DIR)).filter(f => f !== ".git");
      if (files.length > 0) return res.status(400).json({ error: "Workspace not empty" });
      await git.clone(req.body.url, WORKSPACE_DIR);
      res.json({ success: true });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  // AI (protected, server-side keys only)
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    const { prompt, context, provider, model, apiKey, systemPrompt, customEndpoint } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });
    try {
      if (provider === "custom" && customEndpoint) {
        const r = await fetch(customEndpoint, { method:"POST", headers:{"Content-Type":"application/json",...(apiKey?{Authorization:`Bearer ${apiKey}`}:{})}, body: JSON.stringify({ prompt, context }) });
        const d: any = await r.json();
        return res.json({ response: d.response || d.choices?.[0]?.message?.content || d.text || "No response" });
      }
      if (provider === "openai") {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) return res.status(400).json({ error: "OpenAI API Key not configured" });
        const r = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`}, body: JSON.stringify({ model: model||"gpt-4o-mini", messages:[{role:"system",content:systemPrompt||"You are a helpful coding assistant."},{role:"user",content:`Context:\n${context||""}\n\nQuestion: ${prompt}`}] }) });
        const d: any = await r.json();
        return res.json({ response: d.choices?.[0]?.message?.content || "No response" });
      }
      // Gemini default
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return res.status(400).json({ error: "Gemini API Key not configured. Add GEMINI_API_KEY to .env or provide it in Settings." });
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await ai.models.generateContent({
        model: model || "gemini-1.5-flash",
        contents: [{ parts: [{ text: `Context:\n${context||""}\n\nQuestion: ${prompt}` }] }],
        config: { systemInstruction: systemPrompt || "You are a helpful coding assistant in a Web IDE. Be concise." }
      });
      res.json({ response: result.text });
    } catch (e:any) { res.status(500).json({ error: e.message || "AI request failed" }); }
  });

  app.get("/api/auth/github/url", requireAuth, (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.status(400).json({ error: "GitHub Client ID not configured" });
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
    res.json({ url: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user` });
  });

  app.get("/api/auth/github/callback", (req, res) => {
    const code = String(req.query.code || "").replace(/'/g, "\\'");
    res.send(`<html><body><script>window.opener?.postMessage({type:'GITHUB_AUTH_SUCCESS',code:'${code}'},'*');window.close();</script><p>Done. Close this window.</p></body></html>`);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`\n🚀 Mobile Web IDE → http://0.0.0.0:${PORT}\n`));
}

startServer().catch((e) => { console.error("Fatal:", e); process.exit(1); });
