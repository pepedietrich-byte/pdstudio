---
date: 2026-06-13
status: active
rag_priority: 7
twin_context: reference
---

# AGENTS OVERVIEW

> Schnellreferenz aller 6 PDSTUDIO-Agenten für TWIN.  
> Was tut welcher Agent, wann starten, welcher Status.

---

## A1 — Lead Qualifier

| Feld | Wert |
|------|------|
| Farbe | Cyan (#00d4ff) |
| Zweck | Technischen Audit der Restaurant-Website |
| Input | Google Maps URL oder Website URL |
| Output | Score 0-100, Confidence %, Pain Points, Nächster Schritt |
| Status | ready (wenn VITE_N8N_AGENT1_WEBHOOK gesetzt) |
| Wann starten | Neuen Lead qualifizieren oder Score aktualisieren |

---

## A2 — Claude Code Builder

| Feld | Wert |
|------|------|
| Farbe | Lila (#9b6ef3) |
| Zweck | Premium Restaurant-Website bauen und deployen |
| Input | Lead-Daten, Bilder, Konzept, Reservierungsmodus |
| Output | Vercel Preview URL, Build Status |
| Status | manual_claude_code_required (Prompt-Generator vorhanden) |
| Wann starten | Nach A1 wenn Score ≥ 60 |
| Designstandard | Project Napoli Premium + taste-skill + emilkowalski |

**Modi:**
- Manual: Prompt kopieren → Claude Code lokal
- Remote: Prompt → Claude.ai Desktop
- A7 Fallback: n8n Webhook (schwächerer Output)

---

## A3 — Polish Agent

| Feld | Wert |
|------|------|
| Farbe | Pink (#e8197f) |
| Zweck | Bilder generieren, CSS polishen, Animationen verbessern |
| Input | Demo URL (A2 muss fertig sein), Lead-Daten |
| Output | Neue Bild-URLs, gepollishte Demo |
| Status | needs_connection (Poe Image Proxy fehlt) |
| Wann starten | Nach A2 wenn Demo deployed |

---

## A4 — Human Writer

| Feld | Wert |
|------|------|
| Farbe | Orange (#f5a623) |
| Zweck | Personalisierte Verkaufstexte schreiben |
| Input | Lead-Daten, Tonalität (Direkt/Locker/Premium) |
| Output | E-Mail V1/V2, DM, Follow-up, Call Script |
| Status | ready (Poe API aktiv) |
| Wann starten | Jederzeit — kein Abhängigkeit zu anderen Agenten |

**Wichtig:** Texte niemals automatisch versenden — nur via Copy-Button manuell.

---

## A5 — Pricing Agent

| Feld | Wert |
|------|------|
| Farbe | Grün (#2ddb72) |
| Zweck | Preis berechnen und Closing-Chance einschätzen |
| Input | Score, Google Rating, Reviews |
| Output | Min/Empfehlung/Premium Preis, Closing-Chance % |
| Status | ready (client-side Berechnung) |
| Wann starten | Vor Kundengespräch oder Angebot |

---

## A6 — Fact Checker

| Feld | Wert |
|------|------|
| Farbe | Orange-Rot (#ff6b35) |
| Zweck | Fakten prüfen, Trust Score berechnen, Versandstatus bestimmen |
| Input | Lead-Daten (URL, Tel, Email, Name, Adresse) |
| Output | Trust Score %, Fehler, Versandstatus (ready/needs_review/blocked) |
| Status | partial (URL-Erreichbarkeit braucht needs_webhook) |
| Wann starten | Immer vor Outreach — letzter Check |

---

## TWIN PEPE — Boss

| Feld | Wert |
|------|------|
| Farbe | Gold (#ffd700) |
| Zweck | Orchestrierung, Empfehlungen, Voice-Interface |
| Agent ID | agent_7101ktxvqktvfm2ta3rdgrpds3bv |
| Status | aktiv |

---

## Empfohlene Agent-Reihenfolge pro Lead

```
A1 Qualify → A2 Build → A3 Polish → A5 Price → A4 Write → A6 Check → Outreach
```

A4 und A5 können jederzeit unabhängig gestartet werden.

---

#agents #pdstudio #a1 #a2 #a3 #a4 #a5 #a6 #twin
