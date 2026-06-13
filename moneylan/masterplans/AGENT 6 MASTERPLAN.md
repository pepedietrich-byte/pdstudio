# MONEYLAN — Agent 6 Masterplan: Claude Code Prompt Builder

> (a) Spezifikation und (b) Masterprompt für Claude Code (Bau via n8n public REST API, Deploy, Test).
> Agent 6 ist das Finale der Daten-Pipeline: er macht aus Agent 5s Konzept einen perfekten Bauauftrag.

-----

## 1. Zweck & Rolle

Agent 6 übersetzt das validierte Konzept (Agent 5) in einen **präzisen, vollständigen Bauauftrag für Claude Code** — so, dass Claude Code beim Website-Bau **nicht raten muss** und **nicht generisch** baut, sondern gezielt eine hochwertige Demo produziert.

Er erzeugt zweierlei:

1. **`CLAUDE_BUILD_PROMPT.md`** — der menschen- und agentenlesbare Bauauftrag (das eigentliche Produkt).
1. **`claude_prompt.json`** — maschinenlesbares Begleitobjekt (build_prompt, expected_files, quality_checklist, post_build_tests).

**10/10-Kriterium:** Claude Code baut damit nicht generisch, sondern eine gezielte, hochwertige, markengerechte Demo — beim ersten Durchlauf bau-fähig, mobile-first, schnell, rechtlich vorsichtig, besser als das Original.

**Recherche-Prinzip (2026 agentic coding):** Kein Befehls-Prompt (“bau eine Website”). Stattdessen WARUM + Kontext + Erfolgskriterien + Constraints + Plan-vor-Code + Tests. Kontext ist Infrastruktur; kurze explizite Anweisungen schlagen vage Doku; Muster Research→Plan→Execute→Review→Ship.

-----

## 2. Input

Pro Lead (mit gültigem `concept.json`):

- `concept.json` (A5: design_direction, design_tokens, sections, copy, asset_plan, improvements, conversion_logic, constraints) — **Hauptquelle**.
- `content.json` (A2: fakten — die einzige Wahrheit für Adresse/Tel/Öffnungszeiten/Menü).
- `images.json` (A3: assets mit **local_path** — die echten Bilddateien).
- `validation.json` (A4: do_not_invent-Basis, ersatzstrategie).

-----

## 3. Output (JSON-Schema, eingefroren) → `/runs/{lead_id}/claude_prompt.json` + `/runs/{lead_id}/CLAUDE_BUILD_PROMPT.md` + Sheet/Supabase `BUILD`

```json
{
  "schema_version": "2.0",
  "agent": "prompt_builder",
  "lead_id": "",
  "generated_at": "ISO-8601",

  "build_prompt": "",                // vollständiger Markdown-Bauauftrag (= Inhalt der .md)
  "tech_stack": {
    "framework": "", "build_tool": "", "styling": "", "node_version": ""
  },
  "file_structure": [],              // erwartete Dateien/Ordner
  "input_files": [],                 // welche /runs/{lead_id}/-Dateien Claude Code liest
  "asset_paths": [],                 // konkrete local_paths der Bilder
  "sections_spec": [],               // pro Sektion: was rein muss (aus A5)
  "design_system": {},               // Tokens als CSS-Custom-Properties-fertig
  "copy_blocks": {},                 // fertige Texte (aus A5, faktentreu)
  "rules": [],                       // harte Bau-Regeln
  "do_not_invent": [],               // Fakten, die fehlen → NICHT erfinden
  "demo_notice": { "required": true, "text": "" },
  "noindex_required": true,
  "build_commands": [],              // npm install / build / etc.
  "quality_checklist": [],           // was nach Bau erfüllt sein muss
  "post_build_tests": [],            // konkrete Prüfungen
  "expected_output": "",             // was Claude Code abliefern soll
  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

-----

## 4. Verarbeitungs-Pipeline

```
Trigger → Leads mit concept.json laden → Loop je Lead
  → Code "Quellen laden" (concept + content + images + validation)
  → Code "Asset-Pfade auflösen" (local_path aus images.json → konkrete Pfade, nur usage=verwenden)
  → Code "do_not_invent zusammenführen" (aus A4 + A2 missing_fields)
  → Code "Tech-Stack + Dateistruktur festlegen" (deterministisch, Abschnitt 6)
  → Code "Prompt-Sektionen zusammenbauen" (deterministisch aus Konzept, Abschnitt 7)
  → LLM (Claude Sonnet/Poe) OPTIONAL "Prompt-Politur": macht den Bauauftrag flüssig/präzise,
        ohne Fakten/Constraints zu verändern (Constraints sind eingefroren)
  → Code "build_prompt.md rendern" (finaler Markdown)
  → Code "claude_prompt.json bauen" (+ quality_checklist + post_build_tests)
  → Write /runs/{lead_id}/CLAUDE_BUILD_PROMPT.md + /runs/{lead_id}/claude_prompt.json
  → Sheet/Supabase BUILD upsert
Fehlerpfad: jeder Call continueOnFail; LLM-Politur optional (Fallback = deterministischer Prompt)
```

**Wichtig:** Der Prompt-Aufbau ist **überwiegend deterministisch** (Template + eingesetzte Konzeptdaten), damit Constraints (do_not_invent, noindex, demo_notice) garantiert drinstehen. LLM nur zur sprachlichen Politur, NIE zur Änderung von Fakten/Regeln.

-----

## 5. Aufbau des CLAUDE_BUILD_PROMPT.md (die Pflicht-Struktur)

Recherche-belegt (agentic coding 2026): WARUM + Kontext + Erfolgskriterien + Constraints + Plan + Tests. Sektionen des Bauauftrags:

1. **Projektziel & WARUM**: moderne Demo-Website für {Betrieb}, Zweck = Kaltakquise, besser als Original. Erfolgskriterien (mobile-first, schnell, klare Conversion, markengerecht).
1. **Tech-Stack** (fix, Abschnitt 6).
1. **Dateistruktur** (exakt vorgegeben).
1. **Input-Dateien & Asset-Pfade**: welche `/runs/{lead_id}/`-Dateien lesen, welche Bilder (konkrete local_paths) verwenden.
1. **Design-System**: Tokens als CSS-Custom-Properties (Farben/Typo/Spacing/Effects aus A5).
1. **Sektionen** (in Reihenfolge, je mit Inhalt, Layout, verwendeten Assets, Copy).
1. **Copy** (fertige Texte, faktentreu — Claude Code formuliert NICHT um, setzt nur ein).
1. **Harte Regeln**:
- „Do NOT invent opening hours, menu items, prices, address, phone, awards or reviews.” (mehrfach, explizit — aus do_not_invent dynamisch ergänzt)
- „Use ONLY the provided assets and copy.”
- „Build premium modern one-page site. NOT a generic template. Strong visual hierarchy, modern spacing, mobile-first.”
1. **Rechtliches**: `<meta name="robots" content="noindex,nofollow">`, sichtbarer Demo-Hinweis (Text vorgegeben), keine echten Reservierungs-Backends (nur UI/mailto/tel).
1. **Build-Befehle**: `npm install`, `npm run build`, Fehler fixen, Mobile prüfen.
1. **Qualitäts-Checkliste & Post-Build-Tests** (Abschnitt 8).
1. **Erwarteter Output**: lauffähiges Projekt + Deploy-Hinweis (Vercel, privat/noindex).

-----

## 6. Tech-Stack & Dateistruktur (fix vorgegeben)

```
Framework: React + Vite   |  Styling: Tailwind (oder CSS-Custom-Properties + Module)
Node: LTS                 |  Output: statische, schnelle One-Page-Demo
```

```
/src
  App.jsx
  main.jsx
  components/
    Header.jsx  Hero.jsx  TrustBar.jsx  About.jsx
    MenuHighlights.jsx  Gallery.jsx  Atmosphere.jsx
    OpeningHours.jsx  Location.jsx  CTA.jsx  DemoNotice.jsx  Footer.jsx
  data/
    siteData.js          // alle Fakten + Copy aus content.json/concept.json
  styles/
    globals.css          // Design-Tokens als CSS-Custom-Properties
/assets                  // kopierte echte Bilder aus /runs/{lead_id}/assets/
index.html               // enthält noindex-Meta
```

Sektionen, die mangels Material entfallen, ersetzt Claude Code durch die A5-Ersatzstrategie (nicht weglassen).

-----

## 7. Nicht-Erfinden-Regel (mehrfach & dynamisch — kritisch)

Aus `do_not_invent` (A4/A2) wird im Prompt eine explizite, mehrfach platzierte Liste:

- als globale Regel ganz oben,
- pro betroffener Sektion erneut (“Opening hours unknown → show ‘Bitte erfragen’ placeholder, do NOT invent times”),
- in der Quality-Checklist als Prüfpunkt.

Das ist die wichtigste Absicherung gegen peinliche Falschangaben in der Verkaufsdemo. 2026-Best-Practice: explizite Constraints als Guardrails, mehrfach statt vage.

-----

## 8. Quality-Checklist & Post-Build-Tests (Claude Code muss sie erfüllen)

`quality_checklist[]` (Auszug):

- baut fehlerfrei (`npm run build` grün)
- mobile-first responsiv (390px, 768px, 1280px geprüft)
- Ladezeit-tauglich (Bilder optimiert, keine Riesen-Assets)
- noindex-Meta vorhanden
- sichtbarer Demo-Hinweis vorhanden
- keine erfundenen Fakten (Abgleich gegen do_not_invent)
- alle CTAs funktional (tel:/mailto:/Anker, kein totes Backend)
- Design entspricht Direction + Tokens (nicht generisch)
- alle verwendeten Assets aus /assets, keine Hotlinks

`post_build_tests[]` (Auszug):

- Build-Test, Lighthouse-Mobile (Performance/SEO/Best-Practices) → Ziel hohe Werte auf der NORMALEN Qualitätsskala (Bauziel ≥ 90, nicht die inverse A1-Skala)
- Viewport-Tests, Klick-Test der CTAs, Visual-Check gegen Konzept.

-----

## 9. Constraints & Rechtliches (1:1 aus A5 + fix)

- `noindex_required: true` → index.html Meta + Vercel privat.
- `demo_notice` → sichtbarer Banner (“Unverbindliche Demo – erstellt für {Betrieb}, keine offizielle Website”).
- Keine echten Buchungs-/Zahlungs-Backends (nur UI + tel:/mailto:).
- Originalmaterial nur für private Präsentation (dein rechtlicher Rahmen).

-----

## 10. Fehlerpfade

- concept.json fehlt → Lead übersprungen, Warning `no_concept`, kein Crash.
- Asset local_path fehlt/Datei weg → im Prompt als „fehlt, Ersatzstrategie nutzen” markiert, Warning.
- LLM-Politur scheitert → deterministischer Prompt wird verwendet (Politur ist optional), Warning `polish_failed`.
- do_not_invent leer obwohl missing_fields da → aus missing_fields rekonstruieren (Sicherheitsnetz).

-----

## 11. Quality Score, Warnings, Logs

- `confidence` 0–1: hoch wenn reiches Konzept + alle Assets vorhanden + alle Constraints gesetzt.
- `warnings[]`: no_concept, asset_missing, polish_failed, thin_concept.
- `logs[]`: Prompt-Länge, Anzahl Sektionen, Anzahl do_not_invent, Asset-Anzahl.

-----

## 12. Testfälle (echte Leipzig-Leads)

1. **Reiches Konzept** → vollständiger Prompt, alle Sektionen, alle Assets referenziert, do_not_invent leer/klein.
1. **Fehlende Öffnungszeiten** → do_not_invent enthält Öffnungszeiten, Prompt instruiert Platzhalter mehrfach.
1. **Kein Hero-Asset** → asset_plan-Fallback (Farbverlauf+Logo) im Prompt, kein erfundenes Bild.
1. **Steakhouse dark_premium** → Tokens + Direction korrekt im Design-System-Block.
1. **Prompt-Politur-LLM kaputt** → deterministischer Prompt, kein Crash.
1. **End-to-End-Probe**: Den erzeugten CLAUDE_BUILD_PROMPT.md tatsächlich an Claude Code geben → baut es eine nicht-generische, fehlerfreie, mobile, noindex-Demo? (Das ist der ultimative 10/10-Test.)
1. **do_not_invent-Härtetest**: Prompt enthält an ≥3 Stellen die Nicht-Erfinden-Regel.
1. **Asset-Pfad-Test**: alle asset_paths zeigen auf existierende Dateien in /runs/{lead_id}/assets/.

Jeder Test: Prompt vollständig + eindeutig? Claude Code könnte ohne Nachfrage bauen? Keine erfundenen Fakten möglich?

-----

## 13. Sheet/Supabase-Update

- `BUILD`-Tab/Tabelle upsert per lead_id. Spalten: lead_id, tech_stack, sections_count, asset_count, do_not_invent_count, noindex, demo_notice, confidence, warnings, prompt_url (Pfad zur .md).
- `/runs/{lead_id}/CLAUDE_BUILD_PROMPT.md` (Hauptprodukt) + `/runs/{lead_id}/claude_prompt.json`.

-----

## 14. MASTERPROMPT für Claude Code (Builder dieses Agenten)

**Projektziel:** Baue & deploye den n8n-Workflow „MONEYLAN Agent 6 — Claude Code Prompt Builder” via n8n public REST API. Er lädt pro Lead concept/content/images/validation, löst echte Asset-Pfade auf, führt do_not_invent zusammen, legt Tech-Stack + Dateistruktur fest, baut deterministisch einen vollständigen `CLAUDE_BUILD_PROMPT.md` (Struktur Abschnitt 5) + `claude_prompt.json`, und schreibt beide nach `/runs/{lead_id}/` + Supabase/Sheet `BUILD`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Volume `/files` (Build-Artefakte unter `/files/runs/{lead_id}/`).
- Credentials: Poe (optional, nur Prompt-Politur), Sheets/Supabase.
- Überwiegend Code-Nodes (deterministischer Prompt-Bau), LLM optional.

**Pflicht-Regeln:**

1. JSON-Schema (Abschnitt 3) exakt. Prompt-Struktur Abschnitt 5 vollständig.
1. Nicht-Erfinden-Regel mehrfach platzieren (Abschnitt 7), dynamisch aus do_not_invent.
1. Tech-Stack + Dateistruktur fix (Abschnitt 6). Echte Asset-Pfade referenzieren (nur usage=verwenden).
1. Constraints 1:1 aus A5: noindex, demo_notice, mobile_first, do_not_invent.
1. Quality-Checklist + Post-Build-Tests einbauen (Abschnitt 8) — inkl. Bauziel ≥90 auf NORMALER Qualitätsskala.
1. LLM nur Politur, NIE Fakten/Constraints ändern; Fallback deterministisch.
1. confidence, warnings[], logs[]. Nach Bau: 8 Testfälle (Abschnitt 12) — inkl. End-to-End-Probe (Prompt an Claude Code geben).

**Dateistruktur:**

```
/moneylan-agent6/
  build_agent6.(py|ts)
  workflow_agent6.json
  code_nodes/
    load_sources.js
    resolve_assets.js
    merge_do_not_invent.js
    assemble_prompt.js     # deterministischer Prompt-Aufbau
    render_md.js
    build_json.js
  templates/
    build_prompt_template.md
  tests/
    test_leads_leipzig.json
    run_tests.(py|ts)
```

**Rückgabe:**

```json
{ "workflow_id":"", "deployed":true,
  "test_results":[{"case":"","passed":true,"notes":""}],
  "e2e_build_verified": false, "open_issues":[] }
```

**No-Gos:** Befehls-Prompt (“bau eine Website”) statt WARUM+Kontext+Kriterien. Nicht-Erfinden-Regel weglassen oder nur einmal. Erfundene Fakten zulassen. noindex/demo_notice vergessen. Hotlink-Assets statt lokaler. LLM Fakten/Constraints ändern lassen. Generischen Template-Auftrag erzeugen.

-----

## 15. Offene Punkte für Claude Code

- **Asset-Kopie in den Build**: Sollen Bilder aus `/runs/{lead_id}/assets/` ins Website-Projekt `/assets` kopiert werden (Build-Schritt) — Pfade im Prompt müssen relativ + korrekt sein.
- **Tech-Stack-Wahl final**: React+Vite empfohlen (schnell, statisch deploybar auf Vercel). Bestätigen.
- **siteData.js-Format**: alle Fakten/Copy in eine strukturierte Datendatei, damit Claude Code Daten von Layout trennt.
- **End-to-End-Test**: der erzeugte Prompt sollte einmal real durch Claude Code gebaut werden (Phase „Website-Building”), um 10/10 zu beweisen.
- **Supabase-Schema** `build` anlegen, falls gewählt.

-----

# GESAMT-PIPELINE: Abschluss-Übersicht

```
A1 Lead Scanner   → lead.json        (findet & scort schlechte Websites mit Potenzial)
A2 Text Extractor → content.json     (Fakten hart getrennt von Interpretation, Mehrseiten+PDF)
A3 Image Extractor→ images.json + assets/  (echte gespeicherte, bewertete Bilder + Farbwelt)
A4 Data Validator → validation.json  (Türsteher: ready_for_concept true/false + rückgabe_an)
A5 Concept Architect→ concept.json   (Designrichtung, Tokens, Sektionen, Copy, Conversion)
A6 Prompt Builder → CLAUDE_BUILD_PROMPT.md + claude_prompt.json  (perfekter Bauauftrag)
                         │
                         ▼
                  Claude Code (Phase Website-Building)
                         │
                         ▼
        moderne, markengerechte, mobile-first, schnelle,
        rechtlich vorsichtige, private Demo — besser als Original
```

**Pipeline-Paket pro Lead** (`/runs/{lead_id}/`): lead.json, content.json, images.json, validation.json, concept.json, claude_prompt.json, CLAUDE_BUILD_PROMPT.md, assets/.

**Jeder Agent erfüllt:** Input · Output · JSON-Schema · n8n-Workflow · Testfälle · Fehlerpfade · Quality+Confidence Score · Warnings · Logs · Sheet/Supabase-Update — und ist erst fertig, wenn der nächste Agent ohne Nachfrage weiterarbeiten kann + mit echten Leipzig-Leads getestet wurde.

**Danach:** Gaming-Fabrik-Dashboard liest alle Tabellen/JSONs und zeigt Pipeline-Status + Daten pro Lead in schöner UI.

```

```