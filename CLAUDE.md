# PDSTUDIO — Claude Code Kontext

> Dieses Repository ist eine Produktionsumgebung. Kein Demo-Code. Kein Platzhalter-Text.
> Lies diese Datei vollständig bevor du irgendetwas änderst.

---

## Projektidentität

**Brand:** PDSTUDIO (früher MONEYLAN — in der UI überall ersetzen)
**Owner:** Pepe Dietrich, Leipzig
**Zweck:** Automatisierte Lead-Generation und Demo-Website-Erstellung für Restaurants in Deutschland
**Ziel:** Schlechte Restaurantwebsites identifizieren → personalisierte Demo bauen → Abo verkaufen

**Vollständige Infos:** → [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)

---

## Repository-Struktur

Dies ist ein **Multi-Projekt-Monorepo** ohne Root-`package.json`. Jede App hat ihr eigenes
`package.json` und wird einzeln gebaut.

| Pfad | Was | Stack | Build |
|------|-----|-------|-------|
| `command-center/` | **Haupt-App** — das Command Center (Pepes Steuer-UI) | Vite + React 19, Tailwind, framer-motion, lucide | `npm run build` / `npm run lint` |
| `command-center/api/` | Vercel Serverless Functions = **CORS-Proxies** zu n8n/Poe/Runner | Node (Vercel) | (mit deployt) |
| `runner/` | **VPS Build-Server** (Agent 2 remote) — nimmt Build-Jobs an, ruft Claude Code headless, deployt auf Vercel | Node + Express | `npm start` (PM2) |
| `sites/` | **Generierte Demo-Sites** pro Restaurant (je eigenes Vite-Projekt, React 18) | Vite + React 18 | je `npm run build` |
| `barthels-hof-premium/`, `project-napoli-premium/` | Standalone Premium-Sites (statisches HTML + Bilder) | static | — |
| `a3-server.js` | Lokaler A3-Polish-Server (Bilder injizieren → build → Vercel) | Node, Port 3033 | `node a3-server.js` |
| `poe_imagen.py` | Poe/Nano-Banana Bild-Generierung (CLI-Helper) | Python | — |
| `moneylan/` | **Legacy** — alte 6-Agenten n8n-Pipeline (Python-Tests, Workflows). Referenz, nicht aktiv weiterentwickeln. | Python + n8n | — |
| `PEPE_LIFE_OS/` | Obsidian-Vault + TWIN-RAG-Basis (persönliche Wissensbasis, kein Code) | Markdown | — |
| `.agents/skills/` | Claude-Code Skill-Definitionen (Design-Taste, Redesign) | Markdown | — |

**Wichtig:** Wenn der User „die App" oder „das Command Center" sagt → `command-center/`.

---

## Aktuelle Architektur (Stand Juni 2026)

**6 Agenten, manuell steuerbar** — Pepe entscheidet pro Lead, welcher Agent läuft.
Die Agenten laufen **autonom auf dem VPS** (kein Claude Desktop / lokales Terminal mehr nötig);
Pepe triggert alles über Command-Center-Buttons → Vercel `/api/` Proxy → n8n Webhook / VPS Runner.

| Agent | Name | Aufgabe | Backend |
|-------|------|---------|---------|
| A1 | Lead Qualifier | Score + Confidence für einen Lead berechnen | n8n `/agent1-start` |
| A2 | Claude Code Builder | React-Website bauen + Vercel deployen | n8n `/agent2-build` → VPS Runner (intern A7-Webhook) |
| A3 | Polish Agent | Bilder generieren (Poe/Nano Banana), Code polishen | n8n `/agent3-polish` + `a3-server.js` |
| A4 | Human Writer | Verkaufs-E-Mails, DMs, Follow-ups auf Deutsch | n8n `/agent4-write` (Poe Text) |
| A5 | Pricing Agent | Preis berechnen (Min/Empfehlung/Premium), Closing-Chance | n8n `/agent5-price` |
| A6 | Fact Checker | Website, Telefon, E-Mail verifizieren, Trust Score | n8n `/agent6-check` |

Zusätzliche Bausteine im UI (keine eigenständigen „Agenten", sondern Pipeline-Hilfen):
- **A8 / PipelineHealthPanel** — zeigt steckengebliebene Builds, deploy-bereite Demos, Diagnostics.
- **TWIN PEPE** — ElevenLabs Voice-Agent + Orb als zentrales Interface-Element (`components/Twin/`).
- **Mobile Quick-Build** — Pepe gibt am Handy eine URL ein → `enrich-lead` → Build (`QuickBuildMobile.jsx`).

**Vollständige Specs:** → [AGENT_ARCHITECTURE.md](AGENT_ARCHITECTURE.md) ·
Live-Status der Webhooks → [PIPELINE_LIVE_STATUS.md](PIPELINE_LIVE_STATUS.md)

---

## Build-Pipeline & Gates (vor jedem A2-Build)

Bevor Agent 2 baut, läuft eine **PreBuild-Gate-Kette** (in `command-center/src/lib/`). Diese
Logik ist zentral — nicht umgehen, nicht aufweichen.

1. `categoryIntelligence.js` — harte Kategorie-Erkennung (Burger ≠ Pizza ≠ Asian). Verhindert
   falsche Hero-Bilder und kategorie-verbotene Styles. Word-Boundary-Matching beachten.
2. `assetScore.js` — bewertet Bild-↔-Kategorie-Fit (Hero muss ≥ 90 erreichen).
3. `preBuildGate.js` — entscheidet **bauen / blockieren / review** anhand von: Pflichtdaten,
   Kategorie-Confidence (≥ 0.25 oder User-Override), Bild-Fit, erlaubtem Style, keine erfundenen Preise.
4. `conceptArchitect.js`, `buildStyles.js`, `animationLibrary.js`, `promptBuilder.js` — bauen
   Konzept, Style-Variante und den Build-Prompt für den Runner.
5. `autoRepair.js` — Auto-Repair v2 für fehlgeschlagene Builds.

Erfinde **keine** Daten (Preise, Öffnungszeiten): Wenn unsicher → markieren statt erfinden.

---

## Pflichtregeln für ALLE Änderungen

### Funktionsschutz
- Bestehende n8n-Webhooks, Google Sheets, Vercel, Poe API, VPS Runner — NICHT anfassen
- CORS-Proxy-Pattern (`command-center/api/*.js`) — NICHT entfernen
- Alle API-Calls aus dem Browser gehen über `/api/` Proxy, nie direkt an n8n/Poe/Runner
- Gate-Kette (oben) nicht umgehen

### Build-Pflicht
- In `command-center/`: `npm run build` + `npm run lint` vor jedem „fertig"-Statement
- Deployment nur nach erfolgreichem Build
- Bei reinen Markdown-/Doku-Änderungen ist kein Build nötig

### Sicherheit
- Credentials niemals hardcoden — alles über `.env` (siehe `runner/.env.example`)
- `RUNNER_SECRET` schützt den VPS Runner (Bearer Auth) — nie committen
- Irreversible Aktionen (Deploy, Sheets schreiben, Kunden anschreiben) → Bestätigung einholen
- `neverError: true` auf allen Poe-API-Nodes in n8n
- Runner-Sandbox (Path-Traversal-Schutz, Single-Slot-Lock) nicht aufweichen → [RUNNER_SECURITY.md](RUNNER_SECURITY.md)

### Vercel Deploy
- Bei statischen Sites: `framework: null`, `buildCommand: null` im Payload
- Vercel Deployment-IDs immer verifizieren vor dem Wechsel (DEPLOYMENT_NOT_FOUND-Bug)
- Vollständige PATCH-Payloads, nie partielle Updates

**Vollständige Build-Regeln:** → [BUILD_RULES.md](BUILD_RULES.md) ·
Runner-spezifisch → [RUNNER_RULES.md](RUNNER_RULES.md) · [A2_RUNNER_INTEGRATION.md](A2_RUNNER_INTEGRATION.md)

---

## Design-Standard (PFLICHT für alle UI-Änderungen)

- Emil Kowalski Level of Polish — kein generisches AI SaaS Template
- Game-inspired Command Center — Agenten sollen „lebendig" wirken (`components/AgentCity/`)
- TWIN Orb als zentrales Interface-Element
- Premium Typografie, Spacing, Micro-Animations (framer-motion)
- PDSTUDIO-Branding sichtbar und konsistent (kein „MONEYLAN" mehr in der UI)

**Vollständige Designregeln:** → [DESIGN_RULES.md](DESIGN_RULES.md)

---

## Code-Konventionen (command-center)

- **React 19** + Vite + Tailwind. Funktionskomponenten, Hooks. Kein TypeScript.
- Struktur: `components/` (UI, inkl. `AgentCity/`, `Twin/`, `Panels/`), `hooks/` (Data-Fetching:
  `useSheetData`, `useExecutions`, `useLeadResults`, `useAgentDiagnostics`), `lib/` (Pipeline-Logik &
  Gates), `services/twin/` (TWIN-Auswertung), `api/` (Vercel-Proxies).
- Daten kommen aus **Google Sheets** (CSV/Sheets API via `useSheetData`) — Tabs: LEADS, CONTENT,
  IMAGES, VALIDATION, CONCEPT, BUILD → [SHEETS_SCHEMA.md](SHEETS_SCHEMA.md).
- Browser ruft nie externe APIs direkt → immer `command-center/api/<proxy>.js`
  (z.B. `sheets.js`, `enrich-lead.js`, `poe-image.js`, `a3-score.js`, `runner-status.js`).
- Env-Variablen im Frontend mit `VITE_` Prefix (z.B. `VITE_SHEET_ID`, `VITE_CSV_LEADS`).
- Default Claude-Modell des Runners: `claude-opus-4-7` (überschreibbar via `CLAUDE_MODEL` env).
- Stil des Bestandscodes übernehmen (Box-Drawing-Kommentar-Header `─── … ───`, deutsche Kommentare).

---

## Aktueller Stand & Prioritäten

→ [CURRENT_STATE.md](CURRENT_STATE.md)

---

## Technische Referenz

| Ressource | URL/Pfad |
|-----------|----------|
| n8n VPS | https://n8n.srv1736252.hstgr.cloud |
| Command Center (live) | https://command-center-lac-one.vercel.app |
| VPS SSH | `ssh root@76.13.11.80` |
| VPS Runner | `http://76.13.11.80:8787` (PM2, Bearer Auth) |
| Runner Repo-Pfad (VPS) | `/var/www/pdstudio` · Logs: `/opt/pdstudio-runner/logs/{run_id}.log` |
| Google Sheets ID | `1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc` |
| Sheets-Tabs | LEADS, CONTENT, IMAGES, VALIDATION, CONCEPT, BUILD |
| Local A3 Server | `node a3-server.js` → http://localhost:3033 |
| Git-Branch (Default) | `main` |

---

## Entscheidungen & History

→ [DECISIONS_LOG.md](DECISIONS_LOG.md)
