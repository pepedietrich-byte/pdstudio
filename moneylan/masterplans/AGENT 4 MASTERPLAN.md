# MONEYLAN — Agent 4 Masterplan: Data Validator (Türsteher / Quality Gate)

> (a) Spezifikation und (b) Masterprompt für Claude Code (Bau via n8n public REST API, Deploy, Test).
> Agent 4 ist der ERSTE Agent, der nicht extrahiert, sondern **urteilt**.

-----

## 1. Zweck & Rolle

Agent 4 ist der **Türsteher** vor dem kreativen Teil. Er konsolidiert die drei Datenquellen pro Lead — `lead.json` (A1), `content.json` (A2), `images.json` (A3) — und entscheidet **binär**:

> **`ready_for_concept: true | false`**

- **true** → Lead geht an Agent 5 (Concept Architect).
- **false** → Lead wird zurückgewiesen, mit präziser Begründung **an welchen Agenten** (1/2/3) und **was** nachgebessert werden muss.

Kernprinzip (2026 Data-Quality-Standard, recherchiert): Jede Prüfung ist eine **Regel mit binärem Pass/Fail**. Die Summe der Regeln über die kanonischen Dimensionen **Vollständigkeit, Konsistenz, Validität** ergibt einen `data_quality_score` und das Gate.

**10/10-Kriterium:** Kein schlechter Lead rutscht ungeprüft zu Agent 5 durch. Kein guter Lead wird fälschlich abgewiesen.

-----

## 2. Input

Pro Lead die drei Quell-Manifeste:

- `/runs/{lead_id}/lead.json` (A1: business, audit, score)
- `/runs/{lead_id}/content.json` (A2: fakten, interpretation, missing_fields)
- `/runs/{lead_id}/images.json` (A3: logo, hero, assets, fehlende_assets)

(Bzw. die entsprechenden Supabase/Sheet-Zeilen.)

-----

## 3. Output (JSON-Schema, eingefroren) → `/runs/{lead_id}/validation.json` + Sheet/Supabase `VALIDATION`

```json
{
  "schema_version": "2.0",
  "agent": "data_validator",
  "lead_id": "",
  "generated_at": "ISO-8601",

  "ready_for_concept": false,

  "data_quality_score": 0,
  "dimensions": {
    "completeness": 0,
    "consistency": 0,
    "validity": 0
  },

  "checks": [
    { "id": "", "dimension": "completeness|consistency|validity",
      "field": "", "passed": true, "severity": "blocker|major|minor",
      "detail": "" }
  ],

  "conflicts": [
    { "field": "", "source_a": "google", "value_a": "",
      "source_b": "website", "value_b": "", "resolution": "", "severity": "" }
  ],

  "missing_critical": [],
  "missing_optional": [],

  "build_risk": {
    "level": "low|medium|high",
    "would_be_generic": false,
    "reasons": []
  },

  "rückgabe_an": [
    { "agent": "agent1|agent2|agent3", "grund": "", "feld": "" }
  ],

  "ersatzstrategie": [],

  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

-----

## 4. Verarbeitungs-Pipeline

```
Trigger → Leads laden (die mit content.json + images.json vorhanden) → Loop je Lead
  → Code "Quellen laden": lead.json + content.json + images.json zusammenführen
  → Code "Regelwerk Vollständigkeit" (Abschnitt 5a)
  → Code "Regelwerk Konsistenz / Cross-Source" (Abschnitt 5b)
  → Code "Regelwerk Validität" (Abschnitt 5c)
  → Code "Build-Risiko bewerten" (Abschnitt 6) — optional LLM-gestützt
  → Code "Gate-Entscheidung": ready_for_concept + data_quality_score + rückgabe_an (Abschnitt 7)
  → Sheet/Supabase VALIDATION upsert
  → Write /runs/{lead_id}/validation.json
  → Branch: ready=true → markiere für Agent 5 ; ready=false → markiere für Rück-Lauf
Fehlerpfad: fehlende Quelle = harte Blocker-Regel (kein Crash), Lead bleibt false mit klarer Begründung
```

Agent 4 ist überwiegend **deterministisches Regelwerk** (kein LLM nötig fürs Gate). LLM nur optional für die „würde generisch werden”-Einschätzung beim Build-Risiko.

-----

## 5. Regelwerk (jede Regel = Pass/Fail + Severity)

### 5a. Vollständigkeit (completeness) — „ist genug Material da?”

|id             |Feld                                |Severity|Pass-Bedingung                                         |
|---------------|------------------------------------|--------|-------------------------------------------------------|
|c_name         |name                                |blocker |vorhanden, nicht leer                                  |
|c_website      |website                             |blocker |vorhanden, gültige URL                                 |
|c_address      |adresse                             |blocker |vorhanden (A1 oder A2)                                 |
|c_contact      |telefon ODER email ODER reservierung|blocker |mindestens eines vorhanden                             |
|c_hours        |oeffnungszeiten                     |major   |vorhanden                                              |
|c_offer        |angebot/speisekarte/leistungen      |blocker |mindestens 2–4 nutzbare Inhalte                        |
|c_logo         |logo ODER Ersatzstrategie           |major   |logo.qualitaet != keins ODER ersatz definierbar        |
|c_hero         |hero ODER Ersatzstrategie           |major   |hero vorhanden ODER ersatz definierbar                 |
|c_usable_assets|assets verwendbar                   |major   |≥ 2 usage_recommendation=verwenden ODER Ersatzstrategie|
|c_about        |ueber_uns                           |minor   |vorhanden                                              |

**completeness-Score** = gewichteter Anteil bestandener Regeln (blocker zählt am meisten).

### 5b. Konsistenz (consistency) — Cross-Source-Reconciliation

Vergleich Google-Daten (A1) vs. Website-Daten (A2). Master-Regel: bei Konflikt gewinnt i.d.R. Website für Inhalt, Google für Standort — aber Konflikt wird IMMER protokolliert.

|id             |Vergleich                                     |Severity                |
|---------------|----------------------------------------------|------------------------|
|k_address      |A1.address vs A2.fakten.adresse (normalisiert)|major bei Abweichung    |
|k_phone        |A1.phone vs A2.fakten.telefon                 |minor                   |
|k_name         |A1.name vs A2.fakten.name (Schreibweise)      |minor                   |
|k_hours        |A1 opening_hours vs A2 oeffnungszeiten        |major bei Widerspruch   |
|k_phone_present|Telefon in Google aber nicht auf Website      |minor (Info für Konzept)|

Jeder Konflikt → Eintrag in `conflicts[]` mit `resolution` (welche Quelle gewählt + warum).

### 5c. Validität (validity) — „sind die Werte plausibel/wohlgeformt?”

|id     |Feld                                                   |Severity|
|-------|-------------------------------------------------------|--------|
|v_url  |website ist erreichbare http(s)-URL                    |blocker |
|v_email|email matcht E-Mail-Format                             |minor   |
|v_phone|telefon plausibel (Ziffern/Format DE)                  |minor   |
|v_hours|oeffnungszeiten nicht widersprüchlich (nicht „Mo 10–9”)|minor   |
|v_score|A1.score im Bereich, confidence vorhanden              |minor   |

-----

## 6. Build-Risiko-Bewertung (für Agent 5/6 + Verkauf)

Beantwortet: **„Kann Claude Code daraus eine STARKE Seite bauen, oder wird es generisch?”**

- `would_be_generic: true` wenn z.B.: kein verwendbares Hero, < 3 Inhaltsbilder, kein Über-uns, keine Spezialitäten, dünner Text — dann hätte die neue Seite kaum echtes Material und würde nach Template aussehen.
- `level`: low (reichlich Material), medium (Lücken, aber Ersatzstrategie möglich), high (so dünn, dass Demo schwach würde).
- `reasons[]`: konkrete Gründe.

Optional LLM-Check: Sonnet bewertet das konsolidierte Material in einem Satz auf „Demo-Stärke”. Deterministische Schwellen bleiben führend.

-----

## 7. Gate-Logik (die Türsteher-Entscheidung)

```
WENN irgendeine blocker-Regel failt  → ready_for_concept = false
SONST WENN data_quality_score < GATE_THRESHOLD (Default 70) → false
SONST WENN build_risk.level == "high" → false
SONST → ready_for_concept = true
```

Bei `false`:

- `rückgabe_an[]` füllen: welcher Agent, welches Feld, welcher Grund.
  - fehlende Bilder/Logo → agent3
  - fehlende Texte/Öffnungszeiten/Speisekarte → agent2
  - Website nicht erreichbar / falscher Lead → agent1
- `ersatzstrategie[]`: wo ein Mangel durch Konzept ausgleichbar wäre (z.B. „kein Hero → Vollflächen-Farbverlauf mit Logo + Claim”), damit nicht jeder Mangel hart blockt.

**Wichtig:** Ein Mangel mit gültiger Ersatzstrategie ist KEIN Blocker (sonst fällt fast jeder schwache-Website-Lead durch — und das sind genau unsere Zielkunden). Nur fehlende *Fakten* (Name, Kontakt, Angebot, erreichbare Website) blocken hart.

-----

## 8. Fehlerpfade

- Quelle fehlt (content.json/images.json nicht da) → entsprechende Blocker-Regel failt, `warnings: source_missing_*`, ready=false, kein Crash.
- Kaputtes Quell-JSON → Warning `source_parse_failed`, als fehlend behandeln.
- Adress-Normalisierung unsicher → Konflikt als minor, nicht blockierend.
- LLM-Build-Check fehlgeschlagen → deterministische Bewertung führt allein, Warning.

-----

## 9. Quality Score, Warnings, Logs

- `data_quality_score` 0–100 (gewichtete Pass-Rate über alle Dimensionen).
- `dimensions{completeness, consistency, validity}` einzeln 0–100.
- `confidence` 0–1 (sinkt bei fehlenden Quellen, unsicherer Normalisierung).
- `warnings[]`: source_missing_lead/content/images, source_parse_failed, llm_buildcheck_failed.
- `logs[]`: pro Regel-Block + Gate-Entscheidung fürs Dashboard.

-----

## 10. Testfälle (echte Leipzig-Leads)

1. **Vollständiger Lead** (alle 3 Quellen reich) → ready=true, score hoch, keine rückgabe_an.
1. **Kein Kontakt** (weder Tel noch Mail noch Reservierung) → blocker c_contact, ready=false, rückgabe_an agent2.
1. **Website nicht erreichbar** → blocker v_url, ready=false, rückgabe_an agent1.
1. **Adresse Google ≠ Website** → conflict k_address (major), resolution dokumentiert, ready evtl. true.
1. **Kein Logo, nur Favicon** → c_logo major, aber ersatzstrategie greift → ready=true (kein harter Block).
1. **Sehr dünnes Material** (kein Hero, 1 Bild, kein Über-uns, kein Angebot) → build_risk high, ready=false.
1. **Fehlende images.json** (A3 nicht gelaufen) → source_missing_images, ready=false, rückgabe_an agent3.
1. **Widersprüchliche Öffnungszeiten** → v_hours/k_hours, als major markiert, dokumentiert.

Jeder Test: Entscheidung nachvollziehbar? rückgabe_an präzise? Agent 5 wüsste bei true sofort, womit er arbeitet?

-----

## 11. Sheet/Supabase-Update

- `VALIDATION`-Tab/Tabelle upsert per lead_id. Spalten: lead_id, ready_for_concept, data_quality_score, completeness, consistency, validity, missing_critical, missing_optional, conflicts, build_risk_level, would_be_generic, rückgabe_an, ersatzstrategie, confidence, warnings.
- `/runs/{lead_id}/validation.json` vollständig.
- Im LEADS/Übersichts-Tab Status-Flag setzen (ready_for_concept), damit das Dashboard die Pipeline-Stufe zeigt.

-----

## 12. MASTERPROMPT für Claude Code

**Projektziel:** Baue & deploye den n8n-Workflow „MONEYLAN Agent 4 — Data Validator” via n8n public REST API. Er lädt pro Lead die drei Manifeste (lead/content/images), prüft sie mit einem deterministischen Regelwerk über die Dimensionen Vollständigkeit/Konsistenz/Validität (jede Regel Pass/Fail + Severity), erkennt Cross-Source-Widersprüche, bewertet das Build-Risiko, und trifft die binäre Entscheidung `ready_for_concept`. Bei false: präzise `rückgabe_an` den verantwortlichen Agenten. Output nach Supabase/Sheet `VALIDATION` + `/runs/{lead_id}/validation.json`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Volume `/files`.
- Credentials in n8n: Sheets/Supabase, optional Poe (nur für Build-Risiko-LLM-Check).
- Überwiegend Code-Nodes (deterministisches Regelwerk), kein LLM fürs Gate selbst.

**Pflicht-Regeln:**

1. JSON-Schema (Abschnitt 3) exakt. Jede Prüfung als Pass/Fail-Check mit Severity in `checks[]`.
1. Regelwerk Abschnitt 5 (Vollständigkeit/Konsistenz/Validität) vollständig.
1. Gate-Logik Abschnitt 7 EXAKT: blocker-Fail ODER score<70 ODER build_risk high → false. Ersatzstrategie verhindert harten Block bei nicht-faktischen Mängeln.
1. Cross-Source-Konflikte in `conflicts[]` mit resolution dokumentieren.
1. `rückgabe_an[]` präzise (Agent + Feld + Grund) bei false.
1. confidence, warnings[], logs[] immer.
1. Fehlende Quelle = Blocker-Regel, kein Crash.
1. Nach Bau: 8 Testfälle (Abschnitt 10), iterativ fixen bis grün.

**Dateistruktur:**

```
/moneylan-agent4/
  build_agent4.(py|ts)
  workflow_agent4.json
  code_nodes/
    load_sources.js
    rules_completeness.js
    rules_consistency.js
    rules_validity.js
    build_risk.js
    gate_decision.js
  tests/
    test_leads_leipzig.json
    run_tests.(py|ts)
```

**Rückgabe:**

```json
{ "workflow_id":"", "deployed":true,
  "test_results":[{"case":"","passed":true,"notes":""}],
  "gate_stats": {"ready_true": 0, "ready_false": 0, "by_rückgabe_agent": {}},
  "open_issues":[] }
```

**No-Gos:** Guten Lead fälschlich blocken (Ersatzstrategie beachten!). Schlechten Lead durchwinken. Mangel ohne `rückgabe_an` zurückweisen (Agent muss wissen, was zu tun ist). LLM die Gate-Entscheidung treffen lassen (muss deterministisch/nachvollziehbar sein). Harter Crash bei fehlender Quelle.

-----

## 13. Offene Punkte für Claude Code

- **GATE_THRESHOLD kalibrieren**: Default 70, aber mit echten Leipzig-Leads prüfen — zu hoch blockt Zielkunden (schlechte-Website-Leads), zu niedrig lässt Schrott durch. Bewusst einstellen.
- **Adress-Normalisierung**: simple Normalisierung (Straße/PLZ extrahieren) vor Vergleich, sonst zu viele falsche Konflikte.
- **Ersatzstrategie-Katalog**: definierte Liste, welche Mängel wie ausgleichbar sind (kein Hero→Farbverlauf+Logo, kein Logo→Wortmarke aus Name, keine Food-Bilder→Stock-Hinweis fürs Verkaufsgespräch).
- **Build-Risiko LLM optional**: erst deterministisch, LLM nur als Zusatzsignal.
- **Supabase-Schema** `validation` anlegen, falls gewählt.

```

```