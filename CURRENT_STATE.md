# PDSTUDIO — Aktueller Stand (Juni 2026)

> Diese Datei wird manuell aktualisiert. Immer als erstes lesen um den aktuellen Fokus zu verstehen.

---

## Architektur-Status

**Aktuelle Architektur:** 6-Agenten-Architektur, manuell steuerbar
**Deployment:** Command Center live auf https://command-center-lac-one.vercel.app
**Pipeline:** Keine automatische Verkettung mehr — Pepe entscheidet pro Lead welcher Agent läuft

---

## Agent-Status

| Agent | Status | Anmerkung |
|-------|--------|-----------|
| A1 Lead Qualifier | ✅ Aktiv | Score + Confidence funktioniert |
| A2 Claude Code Builder | ✅ Aktiv | Baut + deployt Websites, nutzt A7-Webhook intern |
| A3 Polish Agent | ✅ Aktiv | Score-API + Polish-API implementiert, a3-server.js läuft lokal |
| A4 Human Writer | 🔧 Gebaut, testen | n8n-Workflow vorhanden, UI-Integration ausstehend |
| A5 Pricing Agent | 🔧 Gebaut, testen | Preis-Logik in n8n, Command Center UI ausstehend |
| A6 Fact Checker | 🔧 Gebaut, testen | Verifikations-Webhook vorhanden |
| TWIN Voice | 🔧 In Arbeit | ElevenLabs Agent-ID aktiv, Orb-Komponente gebaut |

---

## Letzte abgeschlossene Arbeiten

- A2 Build-Optionen implementiert (verschiedene Website-Styles wählbar)
- A3 Quality Scorer fertiggestellt (gibt 0–100 Score zurück)
- A5/A6 Daten-Kopplung mit Lead-Detail implementiert
- CORS-Proxy für alle n8n-Calls über Vercel `/api/` gebaut
- A7 neverError-Fix deployed (kein mehr harter Crash bei Poe-Fehler)
- TWIN Orb-Komponente + TwinContext im Command Center integriert

---

## Aktueller Fokus

**Nächster Schritt:** Indian Crown Restaurant in A3 eintragen und ersten echten Quality Score laufen lassen.

**Danach:**
1. A4, A5, A6 im Command Center UI sichtbar machen und testbar schalten
2. Einen vollständigen manuellen Durchlauf A1→A2 mit echtem Leipzig-Lead
3. TWIN Webhooks in n8n bauen (twin/agent-status, twin/today-leads, twin/best-leads)
4. ElevenLabs Voice-Integration für TWIN vollständig testen

---

## Offene Technische Punkte

| Problem | Priorität | Status |
|---------|-----------|--------|
| Oxylabs Credentials reparieren | Hoch | Offen — ohne Oxylabs kein Scraping in A2/A3 |
| PageSpeed API aktivieren | Mittel | Google Cloud Console, macht A1-Score präziser |
| E2E-Test A1→A2 mit echtem Lead | Hoch | Noch ausstehend |
| TWIN Supabase-Memory anbinden | Niedrig | Schema geplant, noch nicht implementiert |
| A8 Outreach Agent | Niedrig | Konzept vorhanden, noch nicht gebaut |

---

## Test-Regeln

- **Nicht testen mit:** Auerbach's Keller Leipzig (zu bekannt, zu viele Daten, verfälscht Tests)
- **Gut zum Testen:** Mittlere Restaurants in Connewitz, Gohlis, Plagwitz mit Score > 80

---

## Roadmap

### Kurzfristig (laufender Monat)
- Indian Crown A3 Quality Score
- A4/A5/A6 UI-Integration
- Erster vollständiger manueller Lead-Durchlauf

### Mittelfristig (nächste 2–3 Monate)
- TWIN Voice Webhooks fertig (alle 11 Endpoints)
- Supabase Memory für TWIN aktiv
- 10+ aktive Demo-Websites in Produktion

### Langfristig (6 Monate)
- 100 aktive Abo-Kunden
- TWIN Daily Report (automatisch 8:00 Uhr)
- Agent City 2.0 (vollständige 2D-Karte im Videospiel-Stil)
- TWIN Mobile-App
- A8 Outreach-Agent (automatische Follow-Up E-Mails nach Demo-Launch)
