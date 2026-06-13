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

## Aktuelle Architektur (Stand Juni 2026)

**6 Agenten, manuell steuerbar** — keine automatische Pipeline mehr.

| Agent | Name | Aufgabe |
|-------|------|---------|
| A1 | Lead Qualifier | Score + Confidence für einen Lead berechnen |
| A2 | Claude Code Builder | React-Website bauen + Vercel deployen |
| A3 | Polish Agent | Bilder generieren (Poe/Nano Banana), Code polishen |
| A4 | Human Writer | Verkaufs-E-Mails, DMs, Follow-ups auf Deutsch |
| A5 | Pricing Agent | Preis berechnen (Min/Empfehlung/Premium), Closing-Chance |
| A6 | Fact Checker | Website, Telefon, E-Mail verifizieren, Trust Score |

Pepe entscheidet pro Lead, welcher Agent läuft.

**Vollständige Specs:** → [AGENT_ARCHITECTURE.md](AGENT_ARCHITECTURE.md)

---

## Pflichtregeln für ALLE Änderungen

### Funktionsschutz
- Bestehende n8n-Webhooks, Google Sheets, Vercel, Poe API — NICHT anfassen
- CORS-Proxy-Pattern (Vercel serverless functions in `/api/`) — NICHT entfernen
- Alle API-Calls aus dem Browser gehen über `/api/` Proxy, nie direkt an n8n

### Build-Pflicht
- `npm run build` + `npm run lint` vor jedem "fertig"-Statement
- Deployment nur nach erfolgreichem Build

### Sicherheit
- Credentials niemals hardcoden
- Irreversible Aktionen (Deploy, Sheets schreiben, Kunden anschreiben) → Bestätigung einholen
- `neverError: true` auf allen Poe-API-Nodes in n8n

### Vercel Deploy
- Bei statischen Sites: `framework: null`, `buildCommand: null` im Payload
- Vercel Deployment-IDs immer verifizieren vor dem Wechsel (DEPLOYMENT_NOT_FOUND-Bug)
- Vollständige PATCH-Payloads, nie partielle Updates

**Vollständige Build-Regeln:** → [BUILD_RULES.md](BUILD_RULES.md)

---

## Design-Standard (PFLICHT für alle UI-Änderungen)

- Emil Kowalski Level of Polish — kein generisches AI SaaS Template
- Game-inspired Command Center — Agenten sollen "lebendig" wirken
- TWIN Orb als zentrales Interface-Element
- Premium Typografie, Spacing, Micro-Animations
- PDSTUDIO-Branding sichtbar und konsistent

**Vollständige Designregeln:** → [DESIGN_RULES.md](DESIGN_RULES.md)

---

## Aktueller Stand & Prioritäten

→ [CURRENT_STATE.md](CURRENT_STATE.md)

---

## Technische Referenz

| Ressource | URL/Pfad |
|-----------|----------|
| n8n VPS | https://n8n.srv1736252.hstgr.cloud |
| Command Center | https://command-center-lac-one.vercel.app |
| Google Sheets ID | `1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc` |
| Sheets-Tabs | LEADS, CONTENT, IMAGES, VALIDATION, CONCEPT, BUILD |
| Local A3 Server | `node a3-server.js` → http://localhost:3033 |

---

## Entscheidungen & History

→ [DECISIONS_LOG.md](DECISIONS_LOG.md)
