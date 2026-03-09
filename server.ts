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
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite Database
  const db = new Database("users.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize git if not already initialized
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      await git.init();
      await fs.writeFile(path.join(WORKSPACE_DIR, "README.md"), "# Workspace\nWelcome to your new workspace.");
      await git.add(".");
      await git.commit("Initial commit");
    }
  } catch (err) {
    console.error("Git init failed", err);
  }

  app.use(cors());
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || "mobile-ide-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // --- AUTH API ---

  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      const info = stmt.run(username, hashedPassword);
      
      (req.session as any).userId = info.lastInsertRowid;
      (req.session as any).username = username;
      
      res.json({ success: true, user: { id: info.lastInsertRowid, username } });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: { id: (req.session as any).userId, username: (req.session as any).username } });
  });

  // Middleware to protect API routes
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Apply protection to sensitive routes
  app.use("/api/git", requireAuth);
  app.use("/api/ai", requireAuth);

  // --- FILE MANAGER API ---

  // Recursive file listing
  const getFilesRecursively = async (dir: string): Promise<any[]> => {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const result = [];
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(WORKSPACE_DIR, fullPath);
      if (item.isDirectory()) {
        result.push({
          name: item.name,
          path: relativePath,
          type: "directory",
          children: await getFilesRecursively(fullPath),
        });
      } else {
        result.push({
          name: item.name,
          path: relativePath,
          type: "file",
        });
      }
    }
    return result;
  };

  app.get("/api/files", async (req, res) => {
    try {
      const files = await getFilesRecursively(WORKSPACE_DIR);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  app.post("/api/files/create", async (req, res) => {
    const { name, type = "file" } = req.body;
    const targetPath = path.join(WORKSPACE_DIR, name);
    try {
      if (type === "directory") {
        await fs.ensureDir(targetPath);
      } else {
        await fs.ensureFile(targetPath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to create " + type });
    }
  });

  app.post("/api/files/read", async (req, res) => {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  app.post("/api/files/write", async (req, res) => {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    try {
      await fs.writeFile(fullPath, content);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to write file" });
    }
  });

  app.post("/api/files/delete", async (req, res) => {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    try {
      await fs.remove(fullPath);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.post("/api/files/rename", async (req, res) => {
    const { oldPath, newPath } = req.body;
    try {
      await fs.move(path.join(WORKSPACE_DIR, oldPath), path.join(WORKSPACE_DIR, newPath));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to rename" });
    }
  });

  // --- RUNTIME API (Python & Node) ---

  app.post("/api/run", async (req, res) => {
    const { code, language } = req.body;
    const ext = language === "python" ? "py" : "js";
    const tempFile = path.join(WORKSPACE_DIR, `temp_${Date.now()}.${ext}`);
    
    try {
      await fs.writeFile(tempFile, code);
      const command = language === "python" ? `python3 ${tempFile}` : `node ${tempFile}`;
      
      exec(command, async (error, stdout, stderr) => {
        await fs.remove(tempFile);
        res.json({ output: stdout, error: stderr || (error ? error.message : null) });
      });
    } catch (error) {
      res.status(500).json({ error: "Execution failed" });
    }
  });

  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.json({ results: [] });

    const results: any[] = [];
    const searchRecursively = async (dir: string) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(WORKSPACE_DIR, fullPath);

        if (item.isDirectory()) {
          if (item.name === "node_modules" || item.name === ".git") continue;
          await searchRecursively(fullPath);
        } else {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const lines = content.split("\n");
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  path: relativePath,
                  line: index + 1,
                  content: line.trim(),
                });
              }
            });
          } catch (e) {
            // Skip binary or unreadable files
          }
        }
      }
    };

    try {
      await searchRecursively(WORKSPACE_DIR);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // --- GIT API ---

  app.get("/api/git/status", async (req, res) => {
    try {
      const status = await git.status();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Git status failed" });
    }
  });

  app.post("/api/git/commit", async (req, res) => {
    const { message } = req.body;
    try {
      const result = await git.commit(message);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Git commit failed" });
    }
  });

  app.post("/api/git/stage", async (req, res) => {
    const { path: filePath } = req.body;
    try {
      await git.add(filePath);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Git stage failed" });
    }
  });

  app.post("/api/git/unstage", async (req, res) => {
    const { path: filePath } = req.body;
    try {
      await git.reset(["HEAD", filePath]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Git unstage failed" });
    }
  });

  app.post("/api/git/diff", async (req, res) => {
    const { path: filePath } = req.body;
    try {
      const diff = await git.diff([filePath]);
      res.json({ diff });
    } catch (error) {
      res.status(500).json({ error: "Git diff failed" });
    }
  });

  app.get("/api/git/remotes", async (req, res) => {
    try {
      const remotes = await git.getRemotes(true);
      res.json({ remotes });
    } catch (error) {
      res.status(500).json({ error: "Failed to get remotes" });
    }
  });

  app.post("/api/git/remote/add", async (req, res) => {
    const { name, url } = req.body;
    try {
      await git.addRemote(name, url);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add remote" });
    }
  });

  app.post("/api/git/remote/remove", async (req, res) => {
    const { name } = req.body;
    try {
      await git.removeRemote(name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove remote" });
    }
  });

  app.post("/api/git/push", async (req, res) => {
    const { remote = "origin", branch = "main" } = req.body;
    try {
      const result = await git.push(remote, branch);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Git push failed" });
    }
  });

  app.post("/api/git/pull", async (req, res) => {
    const { remote = "origin", branch = "main" } = req.body;
    try {
      const result = await git.pull(remote, branch);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Git pull failed" });
    }
  });

  app.post("/api/git/fetch", async (req, res) => {
    try {
      const result = await git.fetch();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Git fetch failed" });
    }
  });

  app.post("/api/git/clone", async (req, res) => {
    const { url } = req.body;
    try {
      // Clone into a temporary directory then move contents to WORKSPACE_DIR
      // Or just clone into WORKSPACE_DIR if it's empty
      const files = await fs.readdir(WORKSPACE_DIR);
      if (files.length > 0 && !files.every(f => f === ".git")) {
        return res.status(400).json({ error: "Workspace is not empty. Cannot clone here." });
      }
      
      await git.clone(url, WORKSPACE_DIR);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Git clone failed" });
    }
  });

  app.get("/api/git/branches", async (req, res) => {
    try {
      const branches = await git.branch();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: "Failed to get branches" });
    }
  });

  app.post("/api/git/branch/switch", async (req, res) => {
    const { branch } = req.body;
    try {
      await git.checkout(branch);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to switch branch" });
    }
  });

  app.post("/api/git/branch/create", async (req, res) => {
    const { name } = req.body;
    try {
      await git.checkoutLocalBranch(name);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create branch" });
    }
  });

  // --- OAUTH / EXTERNAL SERVICES API ---
  // This is a placeholder for actual OAuth flows
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({ error: "GitHub Client ID not configured" });
    }
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    // Here you would exchange code for token
    // For now, we'll just send a success message
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', code: '${code}' }, '*');
            window.close();
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  });

  // --- TERMINAL API ---
  app.post("/api/terminal/exec", async (req, res) => {
    const { command } = req.body;
    if (!command) return res.json({ output: "" });

    exec(command, { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
      res.json({ 
        output: stdout, 
        error: stderr || (error ? error.message : null) 
      });
    });
  });

  // --- AI API ---

  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, context } = req.body;
    try {
      const systemInstruction = `You are a helpful coding assistant integrated into a Web IDE. 
      Context of the current file: \n${context}\n
      Answer the user's question concisely and provide code snippets if needed.`;
      
      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction }
      });
      res.json({ response: result.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI request failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
