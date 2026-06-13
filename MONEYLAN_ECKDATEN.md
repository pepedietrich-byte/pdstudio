# MONEYLAN — Eckdaten

**Was es ist:** Automatisierte Pipeline die für lokale Restaurants in Leipzig Demo-Websites als Kaltakquise-Material baut — vollständig ohne manuellen Eingriff.

---

## Pipeline A1→A7

| Agent | Was er tut | Output |
|-------|-----------|--------|
| **A1** Lead Scanner | Google Places → findet Restaurants in Leipzig, bewertet Website-Qualität via PageSpeed + Claude Vision | Score 0–100 (invers: hoch = schlechte Website = guter Lead) |
| **A2** Text Extractor | Scrapt die Restaurant-Website via Oxylabs, extrahiert mit Claude: Name, Adresse, Tel, Öffnungszeiten, Speisekarte, Über-uns | Strukturiertes JSON ins CONTENT-Sheet |
| **A3** Image Extractor | Lädt Logo, Hero-Bild, Galerie-Fotos herunter, analysiert Farbpalette | Bilder auf `/files`, Metadaten ins IMAGES-Sheet |
| **A4** Data Validator | Prüft Datenvollständigkeit, flaggt was erfunden werden darf und was nicht | Freigabe oder Stopp per Gate |
| **A5** Concept Architect | Claude entwirft Design-Direction, Farbtokens, Fonts, Hero-Headline, Sections-Plan | Konzept-JSON ins CONCEPT-Sheet |
| **A6** Prompt Builder | Assembliert vollständigen Claude-Code-Bauauftrag (~7500 Zeichen) mit allen Assets, do-not-invent-Liste, Qualitäts-Checkliste | CLAUDE_BUILD_PROMPT.md + claude_prompt.json |
| **A7** Website Builder | Claude generiert komplettes React+Vite Projekt (16 Dateien), deployt auf Vercel | Live-URL ins BUILD-Sheet, sofort anklickbar |

---

## Zahlen

- **Laufzeit A1→A7** für einen Lead: ~8–12 Minuten gesamt
- **A7 allein:** ~90 Sekunden (LLM-Call + Vercel Build)
- **Output:** vollständige React+Vite Website, Tailwind CSS, restaurant-spezifische Fonts, echte Daten des Betriebs
- **Kosten pro Lead:** Poe API-Calls (A5 + A7 = ~2×6000 Tokens) + Oxylabs-Scraping
- **Kapazität:** beliebig viele Leads parallel (n8n Webhooks, Vercel Deployments)

---

## Was die Demo-Website enthält

- Hero mit Restaurant-spezifischem Claim und Design-Direction (z.B. `traditional_german`, `modern_bistro`)
- Über-uns mit echten Texten aus der Original-Website
- Spezialitäten, Öffnungszeiten, Kontakt — **nur echte Daten, nichts erfunden**
- Sticky Demo-Banner: "Diese Website ist eine Demo-Präsentation von MONEYLAN"
- `noindex`-Meta — nicht von Google indexiert
- "Bist du interessiert?"-Modal bei jedem Klick — zeigt Telefonnummer des Restaurants
- Mobile-first, Lighthouse-ready

---

## Command Center

**URL:** https://command-center-lac-one.vercel.app

- Echtzeit-Übersicht aller Leads mit Stage-Badges A1–A7
- Ein-Klick-Start für jeden Agenten
- Lead-Detail mit Design-Preview (Farb-Swatches, Fonts, Hero-Headline)
- "Agent 7 starten"-Button direkt aus dem Lead-Detail
- Auto-Refresh alle 12s

---

## Technischer Stack

| Schicht | Technologie |
|---------|------------|
| Automatisierung | n8n (self-hosted, hstgr.cloud) |
| LLM | Claude Sonnet 4.6 via Poe API |
| Scraping | Oxylabs Proxy |
| Daten | Google Sheets (6 Tabs: LEADS, CONTENT, IMAGES, VALIDATION, CONCEPT, BUILD) |
| Demo-Websites | React + Vite + Tailwind CSS, Deploy auf Vercel |
| Command Center | React + Vite, Deploy auf Vercel |
| Assets | /files Volume im n8n-Container |

---

## Workflow-IDs (n8n)

| Agent | ID | Webhook |
|-------|----|---------|
| A1 | `8K3BEqjsfl21BAS9` | `/webhook/agent1-start` |
| A2 | `04XC92MJvaYKtjbi` | `/webhook/agent2-start` |
| A3 | `peVGxOTGY1v2D12B` | `/webhook/agent3-start` |
| A4 | `4E80rzbb97rCGx66` | `/webhook/agent4-start` |
| A5 | `HiIcsFHR3OAQr15m` | `/webhook/agent5-start` |
| A6 | `4VMphtkSDdcpZTNU` | `/webhook/agent6-start` |
| A7 | `nTVZLymUEYRt1W86` | `/webhook/agent7-start` |

---

## Offene Punkte

1. **Oxylabs-Credentials** reparieren — dann haben A2/A3 echte Bilder und Texte (Dashboard: dashboard.oxylabs.io)
2. **PageSpeed API** aktivieren — A1-Score wird präziser (Google Cloud Console → APIs aktivieren)
3. **E2E-Test** mit Lead der komplett durch A1–A7 läuft
4. Optionale Erweiterung: **A8 Outreach-Agent** — schickt dem Restaurantinhaber automatisch eine E-Mail mit Demo-Link
