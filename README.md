# 📱 Mobile Web IDE

A production-ready, mobile-friendly Web IDE — VS Code experience in any browser.

## ✨ Features

- **Monaco Editor** — Full VS Code editor with syntax highlighting for 30+ languages
- **File Explorer** — Collapsible tree with create, rename, delete
- **Code Runner** — Execute JavaScript & Python directly
- **Terminal** — Interactive shell with command history
- **Git Integration** — Stage, commit, push, pull, branches, remotes
- **AI Assistant** — Gemini / OpenAI / Custom endpoint, context-aware
- **Auth System** — SQLite + bcrypt sessions, protects all APIs
- **Themes** — VS Dark, GitHub Light, Monokai, Dracula, Solarized, One Dark
- **Internationalization** — Arabic / English with full RTL support
- **Auto-Save** — Configurable, saves 1.5s after last keystroke
- **Docker & Android** — Deploy anywhere

## 🚀 Quick Start

```bash
git clone https://github.com/flixnettv/Mobile-Web-IDE
cd Mobile-Web-IDE
cp .env.example .env   # fill in SESSION_SECRET at minimum
npm install
npm run dev
```
Open `http://localhost:3000` → Register an account → Start coding!

## 🔒 Security (Production Checklist)

- [ ] Set a strong `SESSION_SECRET` (32+ random bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Serve behind HTTPS (nginx/Caddy/Cloudflare)
- [ ] Add AI API keys to `.env`, never commit them
- [ ] Review blocked-commands list in `server.ts`

## 🐳 Docker

```bash
docker compose up -d
```

## 📱 Android

1. **Emulator:** URL defaults to `http://10.0.2.2:3000`
2. **Real device:** Edit `MainActivity.kt` → set your server IP
3. **Build APK via Colab:**
   ```bash
   bash scripts/setup-colab.sh
   bash scripts/build-apk.sh
   ```

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | ✅ | Random secret for session cookies |
| `NODE_ENV` | ✅ | `development` or `production` |
| `GEMINI_API_KEY` | Optional | Google Gemini key |
| `OPENAI_API_KEY` | Optional | OpenAI key |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth |

## License
Apache-2.0
