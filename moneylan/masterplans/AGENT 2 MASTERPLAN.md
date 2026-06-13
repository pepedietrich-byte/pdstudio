# MONEYLAN — Agent 2 Masterplan: Text Extractor

> (a) Vollständige Spezifikation von Agent 2 und (b) Masterprompt, mit dem Claude Code den
> n8n-Workflow über die n8n public REST API baut, deployt und mit echten Leipzig-Leads testet.

-----

## 1. Zweck & Rolle

Agent 2 holt aus der Website jedes qualifizierten Leads (Agent-1-Score ≥ Schwelle) **alle verwertbaren Texte** und trennt dabei hart:

- **Fakten** (objektiv, dürfen NICHT erfunden/verändert werden): Adresse, Telefon, E-Mail, Öffnungszeiten, Speisekarte, Preise.
- **Interpretation** (abgeleitet): Tonalität, Stil, Positionierung, Zielgruppe, Atmosphäre.

Ergebnis ist das Text-Fundament, aus dem Agent 5 das Konzept und Agent 6 den Build-Prompt bauen. **Kein eigenes Quality-Gate** — Agent 2 verwirft keine Leads, sondern meldet fehlende Felder (`missing_fields`) an Agent 4.

**Architektur-Prinzip (2026 Best Practice, recherchiert):** Hybrid — deterministische Extraktion (JSON-LD + Fließtext + PDF) liefert das verlässliche Fundament, das LLM normalisiert/kategorisiert/interpretiert. LLM-Output wird gegen das Schema validiert mit Selbstkorrektur-Retry.

-----

## 2. Input

Aus Agent 1 (Item-Format oder aus `/runs/{lead_id}/lead.json` bzw. LEADS-Tab):
`lead_id`, `business{website,name,address,phone,...}`, `score`. Nur Leads ≥ Schwelle (Default 75).

-----

## 3. Output (JSON-Schema, eingefroren) → `/runs/{lead_id}/content.json` + Sheet/Supabase `CONTENT`

```json
{
  "schema_version": "2.0",
  "agent": "text_extractor",
  "lead_id": "",
  "source_url": "",
  "crawled_urls": [],
  "generated_at": "ISO-8601",

  "fakten": {
    "name": "",
    "adresse": "",
    "telefon": "",
    "email": "",
    "oeffnungszeiten": "",
    "speisekarte": [],
    "preise_erkannt": false,
    "reservierung_url": null,
    "lieferdienste": [],
    "socials": [ {"platform": "", "url": ""} ]
  },
  "interpretation": {
    "claim_slogan": "",
    "ueber_uns": "",
    "angebot": [],
    "spezialitaeten": [],
    "kueche": [],
    "events": [],
    "catering": null,
    "atmosphaere": "",
    "zielgruppe": "",
    "positionierung": "",
    "tonalitaet": { "ton": [], "beschreibung": "" }
  },
  "roh_reserve": "",
  "quellen": { "json_ld": false, "json_ld_business": false, "fliesstext": true, "pdf_menu": false },
  "missing_fields": [],
  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

**Harte Trennung umgesetzt:** Alles unter `fakten` stammt aus deterministischer Extraktion oder wird vom LLM nur 1:1 übernommen (nicht umformuliert). Alles unter `interpretation` darf das LLM frei formulieren.

-----

## 4. Verarbeitungs-Pipeline

```
Trigger → Leads laden (Supabase/Sheet/Agent1) → Filter Score≥Schwelle → Loop je Lead
  → Oxylabs: Startseite holen (Basic Auth, render html)
  → Code Linkfinder: Schlüssel-Unterseiten (Impressum/Kontakt, Speisekarte/Menü, Über-uns, Datenschutz) → max 4 URLs als Items
  → Oxylabs: Unterseiten scrapen
  → PDF-Erkennung: gefundene .pdf-Links (Speisekarte) → laden → Text extrahieren
  → Code: HTML aller Seiten + PDF-Text pro Lead zusammenführen
  → Code: Roh-Extraktion deterministisch (JSON-LD zuerst, Fließtext-Fallback, mailto/tel/Social-Regex, Öffnungszeiten-Muster)
  → Code: Build Prompt (Rohmaterial als sauberes Feld)
  → LLM (Claude Sonnet/Poe): Strukturieren + Interpretation, STRIKTES JSON
  → Code: Schema-Validierung → bei Invalid: Retry-Prompt an LLM (max 2x), sonst Fallback auf Roh-Fakten
  → Code: Merge (Fakten aus Roh haben Vorrang) + missing_fields berechnen + confidence
  → Sheet/Supabase: CONTENT upsert (Matching lead_id)
  → Write /runs/{lead_id}/content.json
Fehlerpfad: jeder Call continueOnFail + Warning; nie harter Stop
```

-----

## 5. Mehrseiten-Crawl & PDF (die A2-Härtung)

- **Schlüssel-Unterseiten** über Linkfinder (Anchor-Text + URL-Heuristik), interne Links, max 4, dedupliziert. Kategorien: Impressum/Kontakt (→ E-Mail!), Speisekarte/Menü/Karte, Über-uns/Team, Datenschutz.
- **PDF-Speisekarten**: Links auf `.pdf` mit Menü-Schlüsselwörtern → PDF laden → Text extrahieren (n8n Extract-from-File-Node oder Code mit pdf-parse). Hybrid: Tool sichert Text/Struktur, LLM normalisiert danach.
- **E-Mail-Strategie**: mailto-Links über alle Seiten, dann Text-Regex; Impressum-Unterseite ist Hauptquelle. `missing_fields` markiert, wenn trotzdem nichts gefunden.
- **Lead-Zuordnung**: HTML-Sammler bündelt alle Seiten-Items pro Lead zu einem Item (batchSize-1-Loop hält die Zuordnung sauber).

-----

## 6. Missing-Fields-Erkennung (für Agent 4 essenziell)

Agent 2 meldet explizit, was fehlt — das ist der wichtigste Input für den Türsteher (Agent 4):
`missing_fields[]` kann enthalten: `keine_oeffnungszeiten`, `keine_speisekarte`, `keine_email`, `kein_ueber_uns`, `keine_adresse`, `kein_telefon`, `keine_socials`, `kein_angebot`.
Zusätzlich `vollstaendigkeit`-artige Booleans implizit über `missing_fields` (leer = vollständig).

-----

## 7. Self-Correction (2026 Best Practice gegen JSON-Drift)

Nach dem LLM-Call: Output gegen JSON-Schema validieren. Bei Invalid: erneuter Prompt an das LLM mit der konkreten Fehlermeldung (“dein JSON war ungültig wegen X, gib es korrekt zurück”), max 2 Wiederholungen. Erst danach Fallback auf reine Roh-Fakten (`warnings: llm_json_failed`, `confidence` sinkt). Self-Correction-Loop bis valide ist 2026-Standard.

-----

## 8. Fehlerpfade

- Oxylabs leer/401 → Warning `scrape_failed`, Lead mit reduzierter confidence (nur Agent-1-Daten).
- Unterseite nicht erreichbar → übersprungen, Warning, Hauptseite zählt weiter.
- PDF-Extraktion scheitert → Warning `pdf_failed`, Text ohne Menü.
- LLM kaputtes JSON → Self-Correction, dann Fallback (Abschnitt 7).
- Kein Feld gefunden → `missing_fields` füllen, KEIN Crash.

-----

## 9. Quality Score, Warnings, Logs

- `confidence` 0–1: sinkt bei scrape_failed, pdf_failed, llm_json_failed, vielen missing_fields.
- `warnings[]`: scrape_failed, pdf_failed, llm_json_failed, subpage_failed, no_email, no_menu.
- `logs[]`: pro Schritt Zeitstempel+Status fürs Dashboard.

-----

## 10. Testfälle (echte Leipzig-Leads)

1. **Seite mit JSON-LD-Restaurant-Schema** → Fakten verlässlich, json_ld=true.
1. **Alte Fließtext-Seite ohne Schema** → Fließtext-Fallback liefert Fakten, json_ld=false.
1. **Speisekarte als PDF** → pdf_menu=true, speisekarte[] gefüllt.
1. **E-Mail nur im Impressum (Unterseite)** → E-Mail gefunden dank Mehrseiten-Crawl.
1. **Seite ohne Öffnungszeiten** → missing_fields enthält keine_oeffnungszeiten.
1. **LLM liefert kaputtes JSON** (erzwungen) → Self-Correction greift, sonst Fallback, kein Crash.
1. **Oxylabs 401** (falsche Auth simuliert) → Warning, Lead überlebt, confidence niedrig.

Jeder Test: Schema-konform? Fakten/Interpretation sauber getrennt? Agent 4 könnte ohne Nachfrage prüfen?

-----

## 11. Sheet/Supabase-Update

- `CONTENT`-Tab/Tabelle upsert per lead_id. Spalten: lead_id, name, claim_slogan, ueber_uns, angebot, speisekarte, spezialitaeten, kueche, adresse, oeffnungszeiten, telefon, email, socials, reservierung_url, lieferdienste, events, catering, atmosphaere, zielgruppe, ton, ton_beschreibung, missing_fields, confidence, warnings, roh_text.
- Arrays als `|`-getrennter Text (Dashboard zerlegt wieder).
- `/runs/{lead_id}/content.json` vollständig.
- E-Mail zusätzlich in LEADS-Tab nachtragen (per lead_id).

-----

## 12. MASTERPROMPT für Claude Code

**Projektziel:** Baue & deploye den n8n-Workflow „MONEYLAN Agent 2 — Text Extractor” über die n8n public REST API. Er lädt Leads (Score ≥ Schwelle), crawlt Startseite + bis zu 4 Schlüssel-Unterseiten + PDF-Speisekarten, extrahiert Texte hybrid (deterministisch + LLM mit Self-Correction), trennt Fakten hart von Interpretation, meldet missing_fields, und schreibt nach Supabase/Sheet `CONTENT` + `/runs/{lead_id}/content.json`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Volume `/files` (Host `/local-files`), beschreibbar.
- Credentials in n8n: Oxylabs **Basic Auth**, Poe (`Authorization: Bearer`), Google Sheets/Supabase.
- LLM: Claude Sonnet via Poe (`https://api.poe.com/v1/chat/completions`, `Claude-Sonnet-4.6`, temperature 0).
- Scraping: Oxylabs `https://realtime.oxylabs.io/v1/queries`, Basic Auth, source universal, render html.

**Pflicht-Regeln:**

1. JSON-Schema aus Abschnitt 3 exakt einhalten. Fakten/Interpretation strikt trennen — `fakten` NIE vom LLM umformulieren lassen.
1. Mehrseiten-Crawl + PDF-Menü nach Abschnitt 5.
1. Self-Correction-Loop nach Abschnitt 7 (max 2 Retries, dann Fallback).
1. `missing_fields`, `confidence`, `warnings[]`, `logs[]` immer setzen.
1. Jeder Call continueOnFail + Timeout, nie harter Stop.
1. Nach Bau: 7 Testfälle (Abschnitt 10) mit echten Leipzig-Leads, iterativ fixen bis grün.

**Dateistruktur:**

```
/moneylan-agent2/
  build_agent2.(py|ts)
  workflow_agent2.json
  code_nodes/
    linkfinder.js
    raw_extract.js
    pdf_extract.js
    build_prompt.js
    validate_and_merge.js   # Schema-Check + Self-Correction-Trigger + Merge
  tests/
    test_leads_leipzig.json
    run_tests.(py|ts)
```

**Rückgabe nach Abschluss:**

```json
{ "workflow_id": "", "deployed": true,
  "test_results": [ {"case":"","passed":true,"notes":""} ],
  "open_issues": [], "missing_fields_stats": {} }
```

**No-Gos:** Fakten erfinden oder umformulieren. PDF-Menü ignorieren. Harter Stop bei Einzelfehler. Credentials hardcoden. Leads verwerfen (Agent 2 hat KEIN Gate — nur melden).

-----

## 13. Offene Punkte für Claude Code

- **PDF-Extraktion in n8n**: Extract-from-File-Node testen vs. Code-Node mit pdf-parse — welcher liefert sauberen Menütext?
- **Öffnungszeiten-Parsing**: aus Fließtext sind Zeiten heikel — LLM-Interpretation erlaubt, aber als Fakt markieren nur wenn eindeutig; sonst missing_fields.
- **Supabase-Schema** `content` anlegen, falls Supabase gewählt.
- **Crawl-Tiefe**: bei großen Seiten Limit auf 4 Unterseiten halten (Oxylabs-Kosten).

```

```