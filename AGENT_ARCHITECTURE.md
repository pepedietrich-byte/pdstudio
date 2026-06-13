# PDSTUDIO — Agenten-Architektur

> Ground Truth: 6-Agenten-System, manuell steuerbar.
> Die alte 7-Agenten-Auto-Pipeline (MONEYLAN_ECKDATEN.md) ist NICHT mehr die aktive Architektur.

---

## Überblick

Pepe entscheidet pro Lead, welcher Agent läuft. Keine automatische Verkettung.
Jeder Agent ist ein eigener n8n-Workflow mit Webhook-Trigger.
Alle Agents schreiben ihr Ergebnis in Google Sheets (jeweiliger Tab) und optional nach `/runs/{lead_id}/`.

---

## A1 — Lead Qualifier

**Zweck:** Bewertet einen einzelnen Lead. Beantwortet: "Lohnt sich eine Demo?"

**Score-Logik (kritisch):** Inverse Mängel-Skala.
- Hoch (>75) = schlechte Website = wertvoller Lead
- Niedriger Score = gute Website = nicht priorisieren

**Input:** Branche + Ort (oder bestehende Lead-URL)

**Output:**
```json
{
  "lead_id": "slug-name-plz",
  "business": { "name": "", "website": "", "phone": "", "address": "", "google_rating": 0.0, "google_reviews_count": 0 },
  "score": 0,
  "confidence": 0.0,
  "score_breakdown": {},
  "verkaufsargumente": [],
  "warnings": []
}
```

**Webhook:** `POST /webhook/agent1-start`
**Workflow-ID:** `8K3BEqjsfl21BAS9`
**Sheet-Tab:** LEADS

**Score-Dimensionen:**
1. Website-Schwäche (technisch + visuell) — wie schlecht ist die bestehende Seite?
2. Geschäftspotenzial — lohnt sich der Betrieb überhaupt? (Bewertungen, Relevanz)
3. Kontaktierbarkeit — kann man den Inhaber erreichen? (Telefon, Formular, Maps)

---

## A2 — Claude Code Builder

**Zweck:** Baut eine vollständige React+Vite Demo-Website und deployt sie auf Vercel.

**Intern:** Nutzt A7-Webhook (`/webhook/agent7-start`) als Backend — A2 ist die Command-Center-Steuerung, A7 führt den eigentlichen Build aus.

**Input:** `lead_id` + alle Daten aus CONTENT + IMAGES + CONCEPT Sheet

**Output:**
- Vollständige React+Vite Website (16 Dateien)
- Live-URL auf Vercel (`https://ml-{slug}-{timestamp}.vercel.app`)
- URL wird in BUILD-Tab gespeichert

**Webhook:** `POST /webhook/agent2-start`
**Workflow-ID:** `04XC92MJvaYKtjbi`
**Sheet-Tab:** BUILD

**Build-Modi (wählbar in Command Center):**
- Klassisch Restaurant
- Modern Bistro
- Traditional German
- Fine Dining
- Custom (eigene Direction aus CONCEPT-Sheet)

**Qualitäts-Pflichten (niemals weglassen):**
- Schema.org Restaurant-Markup
- Impressum, Datenschutz, AGB als echte Seiten
- Demo-Banner sticky am Top: "Diese Website ist eine Demo-Präsentation von PDSTUDIO"
- `noindex` Meta-Tag
- "Bist du interessiert?" Modal bei Klick → zeigt Restaurant-Kontaktdaten
- Mobile-first
- Echte Daten aus Sheets — nichts erfinden

**Fehlerpfad:**
- `neverError: true` auf Poe-API-Node → kein harter Crash
- Bei Fehler: `status: "error"` + `error_type` in BUILD-Tab schreiben
- Bei DEPLOYMENT_NOT_FOUND: Wait + Retry, nicht erneutes Deployment

---

## A3 — Polish Agent

**Zweck:** Verbessert eine bestehende Demo-Website. Generiert premium Bilder, polisht Code, verbessert Farbpalette.

**Two-Part Workflow:**
1. **Score-Phase:** Analysiert aktuelle Website, gibt 0–100 Quality Score zurück
2. **Polish-Phase:** Injiziert neue Bilder, verbessert CSS, deployt neues Vercel-Deployment

**Image-Quellen:**
- Poe API (FLUX-pro für Hauptbilder)
- Nano Banana (Fallback/Alternative)
- Echte extrahierte Restaurant-Bilder (wenn vorhanden und Qualität hoch genug)

**Input:** Lead-ID + aktuelle Demo-URL

**Output:**
```json
{
  "quality_score": 0,
  "score_breakdown": { "images": 0, "typography": 0, "color": 0, "layout": 0, "content": 0 },
  "improvements": [],
  "new_url": "https://...",
  "images_injected": []
}
```

**Webhook:** `POST /webhook/agent3-start`
**Workflow-ID:** `peVGxOTGY1v2D12B`
**Lokal:** `node a3-server.js` → http://localhost:3033

**API-Endpoints (lokal):**
- `POST /polish` — Images injizieren, Build, Deploy
- `POST /status` — Letzter Job-Status
- `GET /health` — Server läuft?

**Bild-Qualitäts-Regeln:**
- Mindestauflösung: 1200px breit für Hero
- Aspect Ratio Hero: 16:9 oder 3:1
- Keine Stock-Photo-Optik — restaurant-spezifisch
- Farbpalette: drenched, nicht neutral/weiß
- FLUX-pro: Prompt enthält immer Restaurant-Name + Küche + Atmosphäre

---

## A4 — Human Writer

**Zweck:** Schreibt Verkaufs-Kommunikation in Pepes Stimme — E-Mails, DMs, Follow-ups.

**Wichtig:** Schreibt NUR Entwürfe. Sendet NIEMALS automatisch. Immer Bestätigung durch Pepe.

**Input:** Lead-ID + Kontext (Kanal, Situation, Demo-URL)

**Output:**
```json
{
  "channel": "email|sms|whatsapp",
  "subject": "",
  "body": "",
  "tone": "direct|friendly|urgent",
  "personalization_used": [],
  "word_count": 0
}
```

**Webhook:** `POST /webhook/agent4-start`
**Workflow-ID:** `4E80rzbb97rCGx66`

**Schreib-Regeln:**
- Kurz und direkt — keine ellenlangen Absätze
- Pepes Stimme: kein "Sehr geehrte/r", kein "Mit freundlichen Grüßen"
- Immer Demo-URL integrieren
- Konkreter Nutzen im ersten Satz: nicht "Ich biete Website-Dienstleistungen an", sondern "Ich hab Ihnen schon eine Website gebaut."
- Auf Deutsch außer Kunde kommuniziert auf Englisch
- Nie lügen — nur echte Daten des Restaurants verwenden

**Kanäle:**
- E-Mail: Betreff + Body, max 150 Wörter
- SMS: max 160 Zeichen, nur Demo-Link + 1 Satz
- WhatsApp: informeller, Emoji erlaubt wenn passend

---

## A5 — Pricing Agent

**Zweck:** Berechnet den optimalen Preis für einen Lead. Gibt Min/Empfehlung/Premium + Closing-Chance.

**Input:** Lead-Daten (Score, Business-Typ, Stadt, Größe, bestehende Website-Qualität)

**Output:**
```json
{
  "pricing": {
    "minimum": 0,
    "recommended": 0,
    "premium": 0,
    "currency": "EUR",
    "model": "monthly|setup+monthly"
  },
  "closing_chance": 0.0,
  "closing_factors": [],
  "pitch_focus": "",
  "objection_prep": []
}
```

**Webhook:** `POST /webhook/agent5-start`
**Workflow-ID:** `HiIcsFHR3OAQr15m`

**Preis-Logik:**
- Standard Abo: €89/Monat
- Premium Abo (Fine Dining, großes Restaurant): €129/Monat
- Setup-Gebühr: €199–€499 (optional, je nach Aufwand)
- Rabatt nur bei Jahresvertrag (2 Monate gratis)

**Closing-Faktoren (positiv):**
- Google-Rating > 4.3 (Inhaber stolz auf Qualität)
- Keine/sehr alte Website (offensichtlicher Bedarf)
- Restaurant in Tourismusbereich
- Mehrere Standorte (Skalierbedarf)

**Closing-Faktoren (negativ):**
- Bereits gute Website vorhanden
- Kettenrestaurant (hat eigenes Web-Team)
- Sehr kleines Lokal (<20 Sitzplätze)

---

## A6 — Fact Checker

**Zweck:** Verifiziert Daten des Restaurants bevor Outreach oder Demo. Gibt Trust Score.

**Input:** Lead-ID + alle gesammelten Daten

**Output:**
```json
{
  "trust_score": 0,
  "verified": {
    "website_live": true,
    "phone_reachable": true,
    "email_valid": true,
    "address_confirmed": true,
    "google_listing_active": true
  },
  "corrections": [],
  "red_flags": [],
  "recommendation": "proceed|review|skip"
}
```

**Webhook:** `POST /webhook/agent6-start`
**Workflow-ID:** `4VMphtkSDdcpZTNU`

**Verifikations-Checks:**
- Website: HTTP-Request, Status 200, nicht parked domain
- Telefon: Format-Validierung + optional Anruf-Test
- E-Mail: MX-Record-Check + Format
- Adresse: Google Maps API Geocoding
- Google Listing: Places API aktiv, Rating aktuell

**Red Flags (sofortiger Skip):**
- Website antwortet mit Konkurrenz-URL (weitergeleitet)
- Google-Listing inaktiv oder "dauerhaft geschlossen"
- Telefonnummer nicht mehr vergeben
- Adresse existiert laut Maps nicht

---

## TWIN — Digitaler Assistent (A0)

**ElevenLabs Agent-ID:** `agent_7101ktxvqktvfm2ta3rdgrpds3bv`
**Sprache:** Deutsch (primär), Englisch (Fachbegriffe)

**TWIN Tools (ElevenAgents Function Calling):**

```json
[
  { "name": "get_agent_status", "endpoint": "GET /webhook/twin/agent-status" },
  { "name": "start_lead_scan", "endpoint": "POST /webhook/twin/lead-scan" },
  { "name": "get_today_leads", "endpoint": "GET /webhook/twin/today-leads" },
  { "name": "get_best_leads", "endpoint": "GET /webhook/twin/best-leads" },
  { "name": "get_revenue_summary", "endpoint": "GET /webhook/twin/revenue-summary" },
  { "name": "get_workflow_errors", "endpoint": "GET /webhook/twin/workflow-errors" },
  { "name": "create_client_concept", "endpoint": "POST /webhook/twin/create-concept" },
  { "name": "generate_website_demo", "endpoint": "POST /webhook/twin/generate-demo" },
  { "name": "validate_company_data", "endpoint": "POST /webhook/twin/validate-data" },
  { "name": "send_follow_up", "endpoint": "POST /webhook/twin/send-follow-up" },
  { "name": "create_ceo_briefing", "endpoint": "POST /webhook/twin/ceo-briefing" }
]
```

**Automatisch erlaubt (ohne Bestätigung):**
- Status-Abfragen
- Read-only Datenabrufe
- Zusammenfassungen, Briefings, Reports
- Fehleranalyse ohne Eingriff

**Immer Bestätigung erforderlich:**
- API-Calls die Geld kosten
- E-Mails oder Nachrichten an Kunden senden
- Vercel-Deployments starten oder überschreiben
- Google Sheets Zeilen löschen oder überschreiben
- n8n-Workflows deaktivieren oder löschen

**Niemals (auch nicht auf Anfrage):**
- Credentials oder API-Keys ausgeben
- In Produktionssysteme eingreifen ohne Bestätigung
- Als Pepe auftreten oder in seinem Namen kommunizieren

---

## Alte A7-Architektur (Referenz)

A7 (Website Builder) existiert noch als n8n-Workflow und wird intern von A2 aufgerufen.
Er ist KEIN eigenständiger Agent im Command Center mehr.

**A7 Workflow-ID:** `nTVZLymUEYRt1W86`
**A7 Webhook:** `POST /webhook/agent7-start`

A7 baut und deployt die React-Website. A2 orchestriert den Aufruf und schreibt das Ergebnis ins Command Center zurück.
