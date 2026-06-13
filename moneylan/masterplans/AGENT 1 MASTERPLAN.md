# MONEYLAN — Agent 1 Masterplan: Lead Scanner

> Dieses Dokument ist (a) die vollständige Spezifikation von Agent 1 und (b) der
> Masterprompt, mit dem Claude Code den n8n-Workflow über die n8n public REST API
> baut, deployt und mit echten Leipzig-Leads testet.

-----

## 1. Zweck & Rolle in der Pipeline

Agent 1 beantwortet eine einzige Frage hart und messbar: **„Für wen lohnt sich überhaupt eine Demo?”**

Er ist der Trichter-Eingang. Er sammelt nicht nur Leads, sondern bewertet drei Dimensionen gleichzeitig:

1. **Website-Schwäche** — wie schlecht ist die bestehende Seite? (technisch + visuell)
1. **Geschäftspotenzial** — lohnt sich der Betrieb überhaupt? (Bewertungen, Relevanz)
1. **Kontaktierbarkeit** — kann man den Inhaber erreichen? (Telefon, Formular, Maps)

Output ist eine priorisierte Lead-Liste. Nur Leads über der Schwelle gehen an Agent 2.

**Score-Logik (kritisch, nicht verwechseln):** Agent-1-Score ist eine **INVERSE Mängel-Skala**: hoch = schlechte Website = guter Verkaufs-Lead. Schwelle für Weitergabe: konfigurierbar, Default **75**.

-----

## 2. Input

|Feld             |Quelle         |Beschreibung                                                |
|-----------------|---------------|------------------------------------------------------------|
|`branche`        |Set-Node / Form|z.B. “Restaurant”, “Café”, “Friseur”                        |
|`ort`            |Set-Node / Form|z.B. “Leipzig”                                              |
|`stadtteile[]`   |Set-Node       |optional, für Geo-Abdeckung (Grünau, Plagwitz, Connewitz, …)|
|`max_leads`      |Set-Node       |Deckel pro Lauf (Kostenkontrolle)                           |
|`score_threshold`|Set-Node       |Default 75                                                  |

-----

## 3. Output (JSON-Schema, eingefroren)

Pro Lead ein Objekt. Geschrieben nach `/runs/{lead_id}/lead.json` UND als Zeile in Sheet/Supabase-Tab `LEADS`.

```json
{
  "schema_version": "2.0",
  "agent": "lead_scanner",
  "lead_id": "slug-name-plz",
  "generated_at": "ISO-8601",
  "business": {
    "name": "", "address": "", "phone": "", "website": "",
    "email_guess": null,
    "google_rating": 0.0, "google_reviews_count": 0,
    "place_id": "", "maps_url": "",
    "branche": "", "ort": "", "stadtteil": null,
    "social": [ {"platform": "", "url": ""} ],
    "opening_hours": null
  },
  "audit_technical": {
    "final_url": "", "fetch_ok": true, "http_status": 200,
    "https": false,
    "has_viewport_meta": false, "mobile_friendly": false,
    "psi_performance_mobile": 0, "psi_seo": 0, "psi_accessibility": 0, "psi_best_practices": 0,
    "psi_lcp_ms": 0, "psi_cls": 0,
    "has_title": false, "title_text": null,
    "has_meta_description": false, "has_h1": false, "has_schema_jsonld": false,
    "has_impressum": false, "has_datenschutz": false,
    "has_phone_link": false, "has_contact_form": false,
    "has_reservation_link": false,
    "tech_stack": [], "design_age_signals": []
  },
  "audit_visual": {
    "screenshot_desktop_url": null,
    "screenshot_mobile_url": null,
    "above_the_fold_score": 0,
    "hero_present": false, "hero_quality": "none|weak|ok|strong",
    "cta_above_fold": false, "cta_text_found": [],
    "visual_modernity_score": 0,
    "vs_modern_benchmark": "",
    "visual_findings": []
  },
  "score": 0,
  "score_breakdown": {},
  "potential": {
    "business_substance": 0,
    "contactability": 0,
    "local_relevance": 0,
    "conversion_potential": 0
  },
  "verkaufsargumente": [],
  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

**Felder, die für Agent 2/4 zwingend brauchbar sein müssen:** `lead_id`, `business.website`, `business.name`, `score`. Ohne diese darf kein Lead durchgereicht werden.

-----

## 4. Verarbeitungs-Pipeline (n8n-Nodes)

```
Trigger (Manual + Schedule optional)
  → Set: Suchparameter
  → [pro Stadtteil-Schleife optional]
  → HTTP: Google Places Text Search (New API) + Pagination (nextPageToken, bis max_leads)
  → Split Out: ein Betrieb pro Item
  → Set: Map Places → business
  → Dedup gegen vorhandene Leads (Sheet/Supabase lesen, place_id/lead_id abgleichen)
  → Filter: nur mit Website
  → Loop je Lead (batchSize 1):
       → HTTP (Oxylabs Basic Auth): Startseiten-HTML
       → Code: technisches HTML-Audit (deterministisch)
       → HTTP: PageSpeed Insights (offizielle API, GET, mobile)
       → Code: PSI mappen
       → HTTP (Screenshot-Dienst): Desktop + Mobile Screenshot → URL/Binary
       → LLM Vision (Claude Sonnet/Poe): visuelle Bewertung der Screenshots
       → Code: Scoring (technisch + visuell + Potenzial) → score, breakdown, confidence, warnings
  → Filter: score >= threshold
  → Sort: score desc
  → Sheet/Supabase: LEADS upsert
  → Write: /runs/{lead_id}/lead.json
  → Log-Sammlung fürs Dashboard
Fehlerpfad: jeder externe Call mit continueOnFail + Warning-Eintrag, nie harter Stop
Approval (optional): vor Weitergabe an Agent 2 manuelle Sichtung im Dashboard
```

-----

## 5. Scoring-Modell (erweitert: technisch + visuell + Potenzial)

### 5a. Mängelpunkte (technisch, invers — hoch = schlecht)

|Signal                     |Gewicht|Prüfung                                             |
|---------------------------|-------|----------------------------------------------------|
|Kein HTTPS                 |12     |final_url-Schema                                    |
|Nicht mobiloptimiert       |14     |Viewport fehlt ODER PSI-Perf < 50                   |
|Langsame PageSpeed         |10     |PSI-Perf mobil < 50, skaliert                       |
|Impressum/Datenschutz fehlt|10     |Text-/Link-Scan                                     |
|SEO-Basics fehlen          |8      |title/meta-desc/h1/JSON-LD                          |
|Veraltetes Design (Code)   |8      |Flash, Tabellen-Layout, alt-jQuery, frames, font-Tag|
|Schwacher Kontakt/CTA      |6      |tel:-Link, Formular, Reservierung                   |

### 5b. NEU — Visuelle Mängel (Screenshot-basiert, Vision-LLM)

|Signal                                       |Gewicht|Prüfung                            |
|---------------------------------------------|-------|-----------------------------------|
|Schwacher/kein Hero above-the-fold           |12     |Vision: hero_present + hero_quality|
|Kein CTA above-the-fold                      |8      |Vision: cta_above_fold             |
|Visuell veraltet vs. moderne Restaurantseiten|12     |Vision: visual_modernity_score     |

### 5c. Potenzial-Dämpfer (invers wirkend — wenig Substanz = Lead weniger wert)

|Faktor                                            |Wirkung                          |
|--------------------------------------------------|---------------------------------|
|`business_substance` = f(reviews, rating)         |bis −8 wenn tote Bude            |
|`contactability` (Telefon/Maps/Formular vorhanden)|Lead nur wertvoll wenn erreichbar|

**Endscore** = Summe Mängelpunkte (5a+5b) gedämpft durch fehlendes Potenzial (5c), 0–100, gerundet.
**confidence** = wie sicher das Audit ist (sinkt bei fetch_ok=false, fehlendem PSI, fehlendem Screenshot).

-----

## 6. NEU — Visuelle Bewertung (das Herzstück der A1-Härtung)

Screenshot-basierte Analyse, weil reines HTML-Audit nicht erkennt, ob eine Seite *aussieht* wie aus 2008.

**Schritte:**

1. **Screenshot Desktop + Mobile** via Screenshot-API. Optionen (Claude Code wählt/testet): ScreenshotOne, ScreenshotMachine, urlbox, oder Oxylabs-Rendering + eigener Screenshot. Mobile = Viewport 390×844.
1. **Vision-LLM (Claude Sonnet via Poe, multimodal)** bewertet beide Screenshots:
- **Above-the-fold**: Was sieht man ohne Scrollen? Klar/chaotisch?
- **Hero-Bereich**: vorhanden? Qualität (none/weak/ok/strong)?
- **CTA-Erkennung**: Gibt es above-the-fold einen klaren Handlungsaufruf (Reservieren, Anrufen, Speisekarte)?
- **Visuelle Modernität**: Score 0–100 im Vergleich zu modernen Restaurantseiten 2026.
- **Mobile**: Bricht das Layout? Lesbar?
- **vs_modern_benchmark**: kurzer Vergleichssatz (“wirkt wie 2010, moderne Seiten nutzen großflächige Food-Fotografie + sticky Reservierungs-CTA”).
1. Ergebnis fließt in `audit_visual` + ins Scoring (5b).

**Vision-Prompt-Kern (für Claude Code zum Einbauen):**

> “Du bist ein Conversion- und Webdesign-Experte. Bewerte den Screenshot der Startseite eines lokalen Restaurants/Cafés. Vergleiche mit modernen Restaurantseiten 2026 (großflächige Food-Fotografie, klare Reservierungs-CTA, sticky Header, mobile-first). Gib striktes JSON: above_the_fold_score 0-100, hero_present bool, hero_quality, cta_above_fold bool, cta_text_found[], visual_modernity_score 0-100, vs_modern_benchmark string, visual_findings[].”

-----

## 7. Datenquellen (jetzt + später)

**Jetzt:** Google Places (New) Text Search + Place Details, Oxylabs (HTML), PageSpeed Insights API, Screenshot-API, Vision-LLM.
**Später (erweiterbar, im Schema schon vorgesehen):** Google Maps Detaildaten, Branchenverzeichnisse, Social-Link-Extraktion, Bewertungs-Texte.

-----

## 8. Fehlerpfade (Pflicht)

- Jeder externe HTTP-Call: `continueOnFail`, Timeout gesetzt, bei Fehler `warnings[]`-Eintrag + `confidence` senken, **nie** harter Workflow-Stop.
- Oxylabs leer/401 → Warning “scrape_failed”, Lead behalten mit reduzierter confidence (nur Places-Daten).
- PSI fehlgeschlagen → Score ohne PSI-Anteil, Warning “psi_unavailable”.
- Screenshot fehlgeschlagen → visuelle Bewertung übersprungen, Warning “screenshot_failed”, confidence sinkt.
- Vision-LLM kaputtes JSON → Fallback ohne visuelle Punkte, Warning “vision_parse_failed”.
- Places-Quota erschöpft → sauberer Abbruch mit Log, bereits gefundene Leads werden geschrieben.

-----

## 9. Quality Score & Warnings (für Dashboard)

- `score` (0–100, Lead-Qualität als Verkaufschance)
- `confidence` (0–1, wie verlässlich das Audit war)
- `warnings[]` (maschinenlesbar: scrape_failed, psi_unavailable, screenshot_failed, vision_parse_failed, no_website, low_substance)
- `logs[]` (Zeitstempel + Schritt + Status, fürs Gaming-Fabrik-Dashboard)

-----

## 10. Testfälle (mit echten Leipzig-Leads)

Claude Code MUSS nach dem Bau diese Tests fahren:

1. **Moderne Seite** (z.B. etabliertes Restaurant mit guter Website) → erwartet: niedriger Score, hohe confidence.
1. **Uralt-Seite** (Tabellen-Layout, kein SSL) → erwartet: hoher Score (>75), viele verkaufsargumente.
1. **Seite ohne Impressum** → erwartet: missing_legal-Punkte, Warning.
1. **Betrieb ohne Website** → erwartet: rausgefiltert, kein Crash.
1. **Tote Bude** (Website schlecht, aber 2 Reviews) → erwartet: Substanz-Dämpfer greift, Score gedrückt.
1. **Screenshot-Block** (Seite blockt Rendering) → erwartet: Warning screenshot_failed, Lead trotzdem mit techn. Score.
1. **PSI-Timeout** → erwartet: Score ohne PSI, Warning, kein Crash.

Jeder Test prüft: Output vollständig? Schema-konform? Nächster Agent (2) könnte ohne Nachfrage weiterarbeiten?

-----

## 11. Sheet/Supabase-Update

- **LEADS-Tab/Tabelle** upsert per `lead_id` (Matching-Spalte). Spalten: lead_id, name, score, confidence, website, phone, email_guess, address, branche, stadtteil, google_rating, google_reviews, visual_modernity_score, hero_quality, cta_above_fold, verkaufsargumente, warnings, screenshot_desktop_url, screenshot_mobile_url, generated_at.
- Zusätzlich `/runs/{lead_id}/lead.json` (vollständiges Objekt).
- **Empfehlung:** Supabase statt Sheets für strukturierte Daten + Dashboard-Anbindung (Sheets bleibt optionaler Mirror). Claude Code soll Supabase-Tabelle `leads` anlegen, falls gewählt.

-----

## 12. MASTERPROMPT für Claude Code

> Kopiere ab hier als Auftrag an Claude Code.

**Projektziel:** Baue und deploye den n8n-Workflow „MONEYLAN Agent 1 — Lead Scanner” vollständig über die n8n public REST API (`POST {N8N_BASE_URL}/api/v1/workflows`, Header `X-N8N-API-KEY`). Der Workflow findet lokale KMU in Leipzig, auditiert ihre Websites technisch UND visuell (Screenshots + Vision-LLM), scort sie auf der inversen Mängel-Skala (hoch = schlechter Lead = besser für uns), und schreibt qualifizierte Leads (Score ≥ threshold) nach Supabase + `/runs/{lead_id}/lead.json`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Compose unter `/docker/n8n/docker-compose.yml`, beschreibbares Volume `/files` (Host `/local-files`).
- Credentials liegen in n8n: Oxylabs (Basic Auth!), Google Places Key, PageSpeed Key, Poe (Header `Authorization: Bearer`), Google Sheets (Service Account), ggf. Supabase, ggf. Screenshot-API.
- LLM: Claude Sonnet via Poe (`https://api.poe.com/v1/chat/completions`, Modell `Claude-Sonnet-4.6`).
- Scraping: Oxylabs (`https://realtime.oxylabs.io/v1/queries`, **Basic Auth**, source universal, render html).
- PageSpeed: offizielle API `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, GET, strategy=mobile.

**Pflicht-Regeln:**

1. Halte dich EXAKT an das JSON-Schema in Abschnitt 3. Kein Feld weglassen.
1. Jeder externe Call: continueOnFail, Timeout, Warning bei Fehler, nie harter Stop (Abschnitt 8).
1. Score-Logik exakt nach Abschnitt 5 (technisch + visuell + Potenzial-Dämpfer).
1. Visuelle Bewertung nach Abschnitt 6 (Screenshot Desktop+Mobile, Vision-LLM, striktes JSON).
1. Dedup gegen bestehende Leads vor dem Scrapen (Quota sparen).
1. Schreibe `confidence`, `warnings[]`, `logs[]` für jedes Lead (Dashboard).
1. Nach dem Bau: führe die 7 Testfälle aus Abschnitt 10 mit echten Leipzig-Leads aus, logge Ergebnisse, fixe Fehler iterativ bis alle grün.

**Dateistruktur (Claude Code legt an):**

```
/moneylan-agent1/
  build_agent1.(py|ts)     # baut Workflow via n8n API
  workflow_agent1.json     # generierte Definition
  code_nodes/
    audit_technical.js
    psi_map.js
    vision_prompt.js
    scoring.js
  tests/
    test_leads_leipzig.json # echte Test-Leads
    run_tests.(py|ts)
  README_INTERNAL.md
```

**Rückgabe nach Abschluss:**

```json
{
  "workflow_id": "",
  "deployed": true,
  "test_results": [ {"case": "", "passed": true, "notes": ""} ],
  "open_issues": [],
  "score_distribution": {}
}
```

**No-Gos:** Keine erfundenen Audit-Werte. Kein harter Stop bei einzelnem Fehler. Keine Credentials im Code hardcoden (immer n8n-Credentials referenzieren). Score-Skala nicht invertieren.

-----

## 13. Offene technische Punkte, die Claude Code beim Bau klären muss

- **Screenshot-Dienst wählen** und Credential anlegen (ScreenshotOne / urlbox / Oxylabs-render). Test: liefert er Desktop + Mobile zuverlässig?
- **Poe-Vision per Base64** (verifiziert: Poe akzeptiert Base64-Data-URI, nicht zwingend externe URL) — Screenshot vor Vision-Call Base64-kodieren.
- **Supabase vs. Sheets** final entscheiden (Empfehlung Supabase fürs Dashboard).
- **Geo-Abdeckung**: Text Search vs. searchNearby mit Stadtteil-Koordinaten — searchNearby findet die schlechten Randlagen-Seiten besser.

```

```