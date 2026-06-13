# PDSTUDIO Pipeline — Live Status

> Stand: Juni 2026 · Vollautomatische A1→Deploy Pipeline auf Hostinger VPS

---

## Was vollständig autonom funktioniert

```
Command Center UI (Pepe wählt Optionen)
        ↓
n8n Webhook: /webhook/agent2-build
        ↓
Code Node: Lead-Daten + Optionen → Claude-Code-Prompt
        ↓
HTTP Request: POST http://76.13.11.80:8787/run-a2 (Bearer Auth)
        ↓
VPS Runner (PM2, port 8787)
        ↓
runner.sh: git pull → claude -p → npm install → npm build →
           git commit → git push → vercel project create → vercel deploy
        ↓
Vercel Live URL → JSON Summary → n8n → Webhook Response
        ↓
Command Center: Demo-URL klickbar in der UI
```

---

## Bereits live deployed via Pipeline

| Site | URL | Wie gebaut |
|------|-----|-----------|
| Spizz Leipzig | https://spizz-leipzig.vercel.app | Manuell + Runner Deploy |
| Café Luise | https://luise-leipzig.vercel.app | Claude Code + Runner (vollautonom) |
| Barthels Hof | https://barthels-hof.vercel.app | Claude Code + Runner Deploy |

---

## Komponenten-Status

| Komponente | Status | Endpoint |
|-----------|--------|----------|
| VPS Runner | ✅ PM2, 24/7 | `http://76.13.11.80:8787` |
| Claude Code CLI | ✅ Permissions OK | `~/.claude/settings.json` allow all |
| n8n Workflow: Agent 2 — VPS Builder | ✅ Active | `https://n8n.srv1736252.hstgr.cloud/webhook/agent2-build` |
| n8n Credential: VPS Runner | ✅ Header Auth | ID: `ef87bf579cba0026` |
| GitHub Push (HTTPS Token) | ✅ Auto-Stash | `https://github.com/pepedietrich-byte/pdstudio` |
| Vercel Auto-Project-Create | ✅ via API | Token in `.env` |
| Command Center: VpsBuildPanel | ✅ Live | https://command-center-lac-one.vercel.app |

---

## Pipeline Konfiguration

### Runner Modes
- `analyze` — Health Check, keine Änderungen
- `build` — git pull → Claude Code → npm build → commit + push → vercel deploy
- `deploy` — Nur npm build + vercel deploy (Claude überspringen)
- `fix` — Claude bekommt Build-Fehler als Kontext

### Robust gegen
- ✅ Stale package-lock.json (auto-wipe wenn vite missing)
- ✅ Claude Session Limit (Build mit existierenden Files trotzdem)
- ✅ Uncommitted Local Changes (auto-stash + restore)
- ✅ Concurrent Builds (Single-Slot Lock)
- ✅ Network Timeouts (15-min Server Timeout)
- ✅ Vercel Project not linked (Auto-Create via API)
- ✅ Path Traversal (site_dir sandbox)
- ✅ Permission Prompts (~/.claude/settings.json)
- ✅ Stdin Wait (`< /dev/null`)

### Build-Optionen im UI

| Style | Farb-Direction | Qualität |
|-------|---------------|----------|
| Restaurant Premium | Auto | Premium |
| Café Warm | Drenched Warm | Standard |
| Bar Dark Luxury | Drenched Cool | |
| Bistro Modern | Gold + Dark | |
| | Cinnabar (Napoli) | |
| | Cream Soft | |

---

## Was Pepe jetzt tun kann (autonom, ohne Claude Desktop)

1. **Command Center öffnen** → https://command-center-lac-one.vercel.app
2. **Lead auswählen** → Lead-Detail-Panel
3. **Agent 2 Mode** → "Runner (VPS)" wählen
4. **Optionen** → Style + Farbe + Qualität klicken
5. **"Build & Deploy auf VPS"** → 1-Klick
6. **Warten 5-10 Min** (Claude generiert Site)
7. **Demo-URL erscheint** im UI mit Live-Link

Alles dazwischen läuft autonom auf dem VPS.
