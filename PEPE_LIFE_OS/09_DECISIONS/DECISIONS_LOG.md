---
date: 2026-06-13
status: active
rag_priority: 6
twin_context: reference
---

# DECISIONS LOG

> Protokoll aller wichtigen Entscheidungen mit Begründung und Outcome.  
> Format: Datum | Entscheidung | Warum | Outcome/Status

---

## 2026-06-13 — PEPE_LIFE_OS erstellt

**Entscheidung:** Obsidian Vault als Wissensbasis für TWIN aufgebaut  
**Warum:** TWIN braucht strukturierten Kontext um präzise und persönlich zu antworten. RAG ist effektiver als langer System-Prompt.  
**Outcome:** In Arbeit — Dateien werden befüllt

---

## 2026-06 — Umbau auf manuelle 6-Agenten-Architektur

**Entscheidung:** Alte automatische Pipeline (A1→A7 Kette) abgeschafft. Neue manuelle Command-Zentrale mit A1-A6.  
**Warum:** Automatische Pipeline war zu unzuverlässig. Zu viele Agenten = zu viele Fehlerquellen. Manuelle Kontrolle = bessere Qualität.  
**Outcome:** Deployed und funktionsfähig

---

## 2026-06 — A2 als Prompt-Generator, nicht als direkten API-Caller

**Entscheidung:** A2 generiert Claude-Code-Build-Prompt statt direkt via API zu bauen.  
**Warum:** Claude Code (lokal) liefert Premium-Qualität. Poe/Claude API für Website-Bau = schwächerer Output. Meine Skills, mein Repo-Kontext, mein Standard bleiben erhalten.  
**Outcome:** A2 hat 3 Modi: Manual, Remote, A7-Fallback

---

## 2026-06 — A7-Webhook bleibt als Fallback

**Entscheidung:** Alter A7-Webhook wird nicht gelöscht, sondern als API-Fallback in A2 eingebaut.  
**Warum:** Nicht wegschmeißen was funktioniert. Fallback für Situationen wo Claude Code nicht verfügbar.  
**Outcome:** Optionaler Fallback-Button in A2-Section

---

## 2026-06 — MONEYLAN → PDSTUDIO Rebranding

**Entscheidung:** Projektname MONEYLAN → PDSTUDIO  
**Warum:** PDSTUDIO klingt professioneller, ist weniger sprechend über Geldmacherei, besser für Kundenkomm.  
**Outcome:** Rebranding durchgeführt im Command Center

---

## Entscheidungs-Template

```
## YYYY-MM-DD — [Kurzbeschreibung]

**Entscheidung:** [Was wurde entschieden]
**Warum:** [Begründung]
**Alternativen erwogen:** [Was wurde verworfen]
**Outcome:** [Ergebnis oder "in Arbeit"]
```

---

#decisions #log #history #pdstudio
