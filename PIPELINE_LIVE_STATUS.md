# PDSTUDIO Pipeline — Vollständig autonom

> Stand: Juni 2026 · **Alle 6 Agenten autonom auf VPS · Command Center komplett**

---

## Was funktioniert (alles ohne Claude Desktop)

```
Command Center UI (Pepe wählt Optionen)
        ↓
n8n Webhooks (https://n8n.srv1736252.hstgr.cloud/webhook/...)
        ↓
A1 Lead Scanner   → Webhook /agent1-start    (existing)
A2 VPS Builder    → Webhook /agent2-build    (NEU — autonom)
A3 Polish Agent   → Webhook /agent3-polish   (NEU — autonom)
A4 Human Writer   → Webhook /agent4-write    (NEU — Poe Text-Gen)
A5 Pricing Agent  → Webhook /agent5-price    (NEU — logic + scoring)
A6 Fact Checker   → Webhook /agent6-check    (NEU — HTTP verification)
        ↓
VPS Runner (für A2, A3) → Vercel Live URL
Poe API (für A4)        → E-Mails, SMS, WhatsApp, Call Scripts
Logic (A5, A6)          → Pricing, Trust Score
        ↓
Direct Response zurück ans UI
```

---

## n8n Workflows (alle aktiv)

| ID | Name | Webhook | Tested |
|----|------|---------|--------|
| AGENT2VPSBUILD01 | Agent 2 — VPS Builder    | `/agent2-build`   | ✅ kantine-leipzig.vercel.app |
| AGENT3POLISHRUNN | Agent 3 — Polish Agent   | `/agent3-polish`  | ✅ luise-leipzig polished |
| AGENT4HUMANWRITE | Agent 4 — Human Writer   | `/agent4-write`   | ✅ E-Mail/SMS generiert |
| AGENT5PRICEAGENT | Agent 5 — Pricing Agent  | `/agent5-price`   | ✅ €89/€149, 70% closing |
| AGENT6FACTCHECKER | Agent 6 — Fact Checker  | `/agent6-check`   | ✅ Trust 73/100 |

---

## Live Demo-Sites (alle in dieser Session gebaut)

1. https://spizz-leipzig.vercel.app
2. https://luise-leipzig.vercel.app — Claude Code + Polish (A2+A3)
3. https://barthels-hof.vercel.app
4. https://kantine-leipzig.vercel.app — vollautonom A2 over n8n

---

## Command Center — UI Integration

**Live:** https://command-center-lac-one.vercel.app

| Komponente | Datei | Status |
|-----------|-------|--------|
| VpsBuildPanel (A2) | `VpsBuildPanel.jsx` | ✅ Style/Color/Quality Optionen |
| AgentsPanel (A3-A6) | `AgentsPanel.jsx` | ✅ Expandable Cards pro Agent |
| n8n Client | `lib/n8n.js` | ✅ alle 5 Trigger-Funktionen |

### Was Pepe im UI tun kann

1. **Lead auswählen** → Lead-Detail
2. **A2 Mode "Runner (VPS)"** → Style/Color/Quality klicken → "Build & Deploy auf VPS"
3. **A3 Polish** → Level (light/normal/deep) + Focus → "Site polishen"
4. **A4 Writer** → Channel (email/sms/whatsapp/script) → "Text schreiben"
5. **A5 Pricing** → "Preis berechnen"  → Min/Empfehlung/Premium + Closing % + Pitch
6. **A6 FactCheck** → "Daten verifizieren" → Trust Score + ready/review/block

---

## Robustness Features

| Problem | Fix |
|---------|-----|
| Stale package-lock.json | Auto-wipe wenn vite missing |
| Claude Session Limit | Build geht trotzdem weiter wenn Files geschrieben |
| Uncommitted Local Changes | Auto-stash vor pull, auto-pop nachher |
| Concurrent Builds | Single-Slot Lock im server.js |
| Vercel Project not linked | Auto-Create via API |
| Path Traversal | site_dir Sandbox |
| Permission Prompts | ~/.claude/settings.json allow all |
| SSL/TLS Probleme (A6) | allowUnauthorizedCerts + continueOnFail |
| Claude stdin Wait | `< /dev/null` |

---

## Endpoints Reference

```bash
# A2 — Build vollständige Site
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent2-build \
  -H "Content-Type: application/json" -d @lead.json

# A3 — Polish bestehende Site
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent3-polish \
  -d '{"lead_id":"...", "site_slug":"...", "polish_options":{"level":"normal","focus":"images"}}'

# A4 — Text schreiben
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent4-write \
  -d '{"lead_id":"...","business_name":"...","channel":"email"}'

# A5 — Preis + Closing
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent5-price \
  -d '{"lead_id":"...","google_rating":"4.5","score":80}'

# A6 — Fakten verifizieren
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent6-check \
  -d '{"lead_id":"...","website_url":"...","phone":"...","email":"..."}'
```

---

## VPS Setup

```
SSH:     ssh root@76.13.11.80
Runner:  http://76.13.11.80:8787 (PM2)
Repo:    /var/www/pdstudio
Logs:    /opt/pdstudio-runner/logs/{run_id}.log
Summaries: /opt/pdstudio-runner/runs/{run_id}.json
```

---

## Was nicht mehr nötig ist

- ❌ Claude Desktop für Code-Generierung
- ❌ Lokales Terminal für Builds
- ❌ Manuelles SSH für Deployments
- ❌ Manuelles `vercel link` für neue Sites
- ❌ Manuelles Prompt-Schreiben

**Alles via Command Center Buttons.**
