# MONEYLAN — Agent 5 Masterplan: Concept Architect

> (a) Spezifikation und (b) Masterprompt für Claude Code (Bau via n8n public REST API, Deploy, Test).
> Agent 5 ist der kreative Stratege: aus validierten Daten wird ein bau-fertiges Website-Konzept.

-----

## 1. Zweck & Rolle

Agent 5 verarbeitet nur Leads mit `ready_for_concept: true` (Agent 4) und macht aus den Daten ein **vollständiges, konkretes Website-Konzept** — kein generisches Template, sondern auf den Betrieb zugeschnitten. Output ist der Bauplan, den Agent 6 in einen Claude-Code-Prompt übersetzt.

Er entscheidet **begründet** (nicht beliebig):

- Welche Art Seite? (Branche + Positionierung + Tonalität → Designrichtung)
- Welche Struktur/Sektionen?
- Welche Farben/Typo/Design-Tokens?
- Welche Copy (neu formuliert, nicht kopiert)?
- Welche Assets wie einsetzen?
- Welche Verbesserungen ggü. Original (Verkaufsargument)?

**10/10-Kriterium:** Ein Designer ODER Claude Code könnte aus dem Konzept **sofort** eine starke Website bauen — ohne Rückfragen.

-----

## 2. Input

Pro Lead (ready_for_concept=true), die konsolidierten Quellen:

- `content.json` (A2: fakten + interpretation + missing_fields)
- `images.json` (A3: logo, hero, assets, farbpalette, bild_stil, fehlende_assets)
- `validation.json` (A4: ersatzstrategie, build_risk, conflicts)
- `lead.json` (A1: branche, audit, verkaufsargumente — fürs „besser als Original”)

-----

## 3. Output (JSON-Schema, eingefroren) → `/runs/{lead_id}/concept.json` + Sheet/Supabase `CONCEPT`

```json
{
  "schema_version": "2.0",
  "agent": "concept_architect",
  "lead_id": "",
  "generated_at": "ISO-8601",

  "positionierung": {
    "branche_typ": "",
    "design_direction": "",
    "design_direction_begruendung": "",
    "stimmung": [],
    "zielgruppe": ""
  },

  "design_tokens": {
    "colors": {
      "primary": "#", "secondary": "#", "accent": "#",
      "background": "#", "surface": "#", "text": "#", "text_muted": "#"
    },
    "typography": {
      "font_heading": "", "font_body": "",
      "scale": { "h1": "", "h2": "", "h3": "", "body": "", "small": "" },
      "weights": { "heading": 0, "body": 0 }
    },
    "spacing": { "section_y": "", "container_max": "", "radius": "", "gap": "" },
    "effects": { "shadow": "", "overlay": "", "transition": "" }
  },

  "sections": [
    {
      "id": "hero", "order": 1, "purpose": "",
      "layout": "", "assets_used": [], "content_ref": [],
      "copy": {}, "notes": ""
    }
  ],

  "copy": {
    "hero_headline": "",
    "hero_subheadline": "",
    "cta_primary": "",
    "cta_secondary": "",
    "section_headlines": {},
    "ueber_uns_neu": "",
    "angebot_bloecke": [],
    "microcopy": {}
  },

  "asset_plan": {
    "logo": { "source": "", "placement": "", "fallback": "" },
    "hero": { "source": "", "treatment": "", "fallback": "" },
    "gallery": { "sources": [], "layout": "", "min_count": 0 },
    "nicht_verwenden": []
  },

  "improvements_vs_original": [],

  "conversion_logic": {
    "primary_goal": "",
    "cta_placements": [],
    "trust_elements": [],
    "mobile_priorities": []
  },

  "constraints": {
    "do_not_invent": [],
    "demo_notice_required": true,
    "noindex_required": true,
    "mobile_first": true
  },

  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

-----

## 4. Verarbeitungs-Pipeline

```
Trigger → Leads mit ready_for_concept=true laden → Loop je Lead
  → Code "Quellen konsolidieren" (content + images + validation + lead)
  → Code "Branche & Positionierung bestimmen" (deterministische Regeln, Abschnitt 5)
  → Code "Design-Direction-Katalog matchen" (Abschnitt 6) → Tokens vorbelegen aus Farbpalette (A3)
  → LLM (Claude Sonnet/Poe) "Konzept-Architekt": erstellt sections, copy, improvements, conversion_logic
        Input: alle Daten + design_direction + tokens + missing_fields + ersatzstrategie
        STRIKTES JSON nach Schema
  → Code "Schema-Check + Self-Correction" (max 2 Retry)
  → Code "Tokens finalisieren" (Farben aus A3-Palette + Direction-Defaults mergen, Kontrast prüfen)
  → Code "Constraints setzen" (do_not_invent aus missing_fields ableiten!)
  → Sheet/Supabase CONCEPT upsert
  → Write /runs/{lead_id}/concept.json
Fehlerpfad: jeder Call continueOnFail + Warning; LLM-JSON-Fail → Self-Correction → Fallback-Skelett
```

LLM ist hier **zentral** (kreative Strategie) — anders als Agent 4. Aber durch deterministische Vor- und Nachbearbeitung gerahmt (Direction-Katalog, Token-Finalisierung, Constraints), damit das Ergebnis konsistent und bau-fertig ist.

-----

## 5. Branche & Positionierung (begründet, nicht generisch)

Ableitung aus A2-`interpretation` (kueche, atmosphaere, zielgruppe, positionierung, tonalitaet) + A1-`branche`:

- `branche_typ`: z.B. “italienisches Restaurant”, “Café/Brunch”, “Steakhouse”, “Bar”, “Imbiss”, “Bäckerei”.
- `zielgruppe` + `stimmung` aus interpretation übernehmen/verdichten.

Recherche-Grundlage (2026): Die Farbpalette signalisiert die Gastro-Kategorie, bevor ein Wort gelesen wird; die Seite muss sich wie eine Erweiterung des Lokals anfühlen (rustikal ≠ Sushi-Bar). → Direction folgt aus Positionierung, nicht aus Geschmack.

-----

## 6. Design-Direction-Katalog (deterministische Vorauswahl, LLM verfeinert)

Definierte Richtungen (keine beliebigen), jede mit Default-Tokens, die durch A3-Farbpalette überschrieben werden:

|Direction              |Passt zu                    |Default-Stimmung              |
|-----------------------|----------------------------|------------------------------|
|modern_warm_cafe       |Café, Brunch, Bäckerei      |hell, warm, einladend         |
|dark_premium_steakhouse|Steakhouse, Fine Dining     |dunkel, moody, edel           |
|bright_minimal_brunch  |Brunch, gesund, modern      |hell, viel Weißraum           |
|traditional_german     |Gasthaus, deutsche Küche    |warm, bodenständig, Holztöne  |
|urban_neon_bar         |Bar, Szene-Lokal            |dunkel, Akzent-Neon           |
|family_friendly_local  |Familienrestaurant, Pizzeria|freundlich, farbig, zugänglich|
|mediterranean_fresh    |Italienisch, Griechisch     |warm, Terrakotta/Oliv         |

Auswahl per Regel (branche_typ + stimmung → beste Direction), LLM darf begründet abweichen. `design_direction_begruendung` Pflicht.

-----

## 7. Seitenstruktur (Sektionen)

Basis-Set für lokale Restaurants (Reihenfolge anpassbar je Direction/Material):
`Hero → Trust Bar → About → Menu Highlights → Gallery → Atmosphere → Opening Hours → Location (Map) → Reservation/Contact CTA → Demo Notice`

Recherche-belegte Pflicht-Elemente 2026:

- **Hero** mit appetitlichem Bild, kurzer Value Proposition, **zwei CTAs** (“Speisekalte ansehen” + “Tisch reservieren”/“Anrufen”).
- **CTA above-the-fold + wiederholt** (35–50% mehr Reservierungen mit optimierten Booking-CTAs).
- **Menü inline, nicht als PDF**.
- **NAP konsistent** (Name/Adresse/Telefon) auf jeder Sektion, eingebettete Google-Map, Click-to-Call.
- **Mobile-first**, Laden < 3 Sek.

Sektionen, für die Material fehlt (missing_fields/fehlende_assets), bekommen eine **Ersatzstrategie** aus A4 (z.B. kein Hero-Bild → Vollflächen-Farbverlauf in Markenfarben + großes Logo + Claim), statt wegzufallen.

-----

## 8. Copy-Strategie (neu formuliert, NICHT kopiert)

LLM formuliert auf Basis der A2-`interpretation` neu:

- Hero Headline + Subheadline (benefit-orientiert, zur Stimmung passend).
- CTA-Texte (konkret: “Tisch reservieren”, “Speisekarte ansehen”, “Jetzt anrufen”).
- Section Headlines, Microcopy.
- Über-uns **neu geschrieben** (besser als Original, aber faktentreu).
- Angebotsblöcke aus echten Spezialitäten/Küche.

**Harte Regel:** Fakten (Adresse, Telefon, Öffnungszeiten, Preise, Menü-Items) werden NICHT erfunden und NICHT verändert — nur aus A2-`fakten` übernommen. Fehlt ein Fakt → in `constraints.do_not_invent` + Sektion nutzt Platzhalter-Hinweis, kein erfundener Inhalt.

-----

## 9. Asset-Plan & Design-Tokens

- **Tokens** kommen primär aus A3-`farbpalette` + `bild_stil`, ergänzt durch Direction-Defaults; Kontrast (Text/Background) wird geprüft (WCAG-tauglich).
- **asset_plan** bestimmt: Logo-Platzierung (oben links), Hero-Treatment (Overlay für Lesbarkeit), Galerie-Layout (Masonry/Grid), welche Bilder NICHT verwenden (A3 usage_recommendation=nicht_verwenden).
- Fehlende Assets → `fallback` definiert (z.B. Logo aus Wortmarke, Hero als Farbverlauf).

-----

## 10. Verbesserungen ggü. Original (Verkaufsargument)

`improvements_vs_original[]` leitet aus A1-`audit` + `verkaufsargumente` ab, was die neue Seite besser macht: HTTPS, mobil-optimiert, schnell, klare Reservierungs-CTA, modernes Design, Impressum/Datenschutz, SEO/Schema. Das ist die Munition fürs Verkaufsgespräch — Agent 6 nimmt es in den Build-Prompt, das spätere Reporting nutzt es.

-----

## 11. Constraints (für sicheren Bau)

- `do_not_invent[]`: aus missing_fields — z.B. “keine Öffnungszeiten erfunden”, “keine Preise erfunden”, “keine Awards”.
- `demo_notice_required: true`, `noindex_required: true`, `mobile_first: true`.
  Diese Constraints reicht Agent 6 1:1 an Claude Code weiter (rechtlich + qualitativ kritisch).

-----

## 12. Fehlerpfade

- Quelle fehlt trotz ready=true → Warning, Konzept mit reduziertem Umfang, confidence sinkt.
- LLM-JSON kaputt → Self-Correction (max 2), dann Fallback-Skelett (Standard-Sektionen + Tokens aus Palette, Copy minimal), Warning `llm_concept_failed`.
- Farbpalette leer (A3 schwach) → Direction-Default-Tokens, Warning.
- Kontrast-Check fehlschlägt → Tokens automatisch anpassen (Text dunkler/heller).

-----

## 13. Quality Score, Warnings, Logs

- `confidence` 0–1: hoch wenn reiches Material + valides LLM-JSON + vollständige Sektionen.
- `warnings[]`: llm_concept_failed, weak_palette, missing_source, low_material_generic_risk.
- `logs[]`: Direction-Wahl, Token-Quelle, Sektionsanzahl, Self-Correction-Runden.

-----

## 14. Testfälle (echte Leipzig-Leads)

1. **Italienisches Restaurant, reiches Material** → mediterranean_fresh, volle Sektionen, Food-Hero, inline-Menü.
1. **Café mit warmer Tonalität** → modern_warm_cafe, helle Tokens aus Palette.
1. **Steakhouse** → dark_premium_steakhouse, moody Tokens.
1. **Kein Hero-Bild (Ersatzstrategie aus A4)** → asset_plan.hero.fallback = Farbverlauf+Logo, Sektion bleibt.
1. **Fehlende Öffnungszeiten** → constraints.do_not_invent enthält Öffnungszeiten, Sektion mit Platzhalter-Hinweis.
1. **Dünnes Material (build_risk war medium)** → Konzept nutzt Ersatzstrategien, generic_risk-Warning, aber baufähig.
1. **LLM kaputtes JSON** → Self-Correction/Fallback-Skelett, kein Crash.
1. **Schwache Farbpalette** → Direction-Defaults greifen, Kontrast ok.

Jeder Test: Konzept vollständig + bau-fertig? Keine erfundenen Fakten? Agent 6 könnte ohne Nachfrage den Build-Prompt bauen?

-----

## 15. Sheet/Supabase-Update

- `CONCEPT`-Tab/Tabelle upsert per lead_id. Schlüsselspalten: lead_id, design_direction, design_direction_begruendung, colors (json), typography (json), sections (json), hero_headline, cta_primary, ueber_uns_neu, improvements_vs_original, do_not_invent, confidence, warnings.
- `/runs/{lead_id}/concept.json` vollständig (das ist die Hauptquelle für Agent 6, Sheet nur Mirror/Dashboard).

-----

## 16. MASTERPROMPT für Claude Code

**Projektziel:** Baue & deploye den n8n-Workflow „MONEYLAN Agent 5 — Concept Architect” via n8n public REST API. Er lädt pro Lead (ready_for_concept=true) die Quellen content/images/validation/lead, bestimmt deterministisch Positionierung + Design-Direction (Katalog), lässt Claude Sonnet das vollständige Konzept (Sektionen, Copy, Conversion-Logik, Verbesserungen) als striktes JSON erstellen, finalisiert Design-Tokens aus der A3-Farbpalette (mit Kontrast-Check), leitet `do_not_invent`-Constraints aus missing_fields ab, und schreibt nach Supabase/Sheet `CONCEPT` + `/runs/{lead_id}/concept.json`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Volume `/files`.
- Credentials: Poe (`Authorization: Bearer`, `Claude-Sonnet-4.6`), Sheets/Supabase.
- LLM zentral, aber durch Code gerahmt (Direction-Katalog vor, Token-Finalisierung + Constraints nach LLM).

**Pflicht-Regeln:**

1. JSON-Schema (Abschnitt 3) exakt. Nur ready_for_concept=true verarbeiten.
1. Design-Direction aus Katalog (Abschnitt 6), `design_direction_begruendung` Pflicht — keine generische Wahl.
1. Sektionen + Conversion-Elemente nach Abschnitt 7 (Hero+2CTAs, inline-Menü, NAP, Map, Click-to-Call, mobile-first).
1. Copy NEU formulieren (Abschnitt 8). Fakten NIE erfinden/ändern → `do_not_invent` aus missing_fields.
1. Tokens primär aus A3-Palette + Direction-Defaults, Kontrast prüfen.
1. Ersatzstrategien aus A4 nutzen statt Sektionen wegzulassen.
1. improvements_vs_original aus A1-audit ableiten.
1. constraints (demo_notice, noindex, mobile_first, do_not_invent) setzen.
1. Self-Correction bei LLM-JSON (max 2), Fallback-Skelett.
1. confidence, warnings[], logs[]. Nach Bau: 8 Testfälle (Abschnitt 14), iterativ fixen bis grün.

**Dateistruktur:**

```
/moneylan-agent5/
  build_agent5.(py|ts)
  workflow_agent5.json
  code_nodes/
    consolidate_sources.js
    positioning.js
    direction_catalog.js
    concept_prompt.js
    validate_and_finalize.js  # Schema-Check, Token-Finalisierung, Kontrast, Constraints
  tests/
    test_leads_leipzig.json
    run_tests.(py|ts)
```

**Rückgabe:**

```json
{ "workflow_id":"", "deployed":true,
  "test_results":[{"case":"","passed":true,"notes":""}],
  "direction_distribution": {}, "open_issues":[] }
```

**No-Gos:** Generische Template-Konzepte ohne Begründung. Fakten erfinden (Öffnungszeiten/Preise/Menü/Awards). Sektionen weglassen statt Ersatzstrategie. Alte Texte 1:1 kopieren. Tokens ohne Bezug zur Marke/Palette. Demo-Notice/noindex vergessen.

-----

## 17. Offene Punkte für Claude Code

- **Token-Format final**: CSS-Custom-Properties-tauglich (damit Agent 6/Claude Code sie 1:1 in globals.css gießen kann) — px/rem-Werte, Hex-Farben.
- **Kontrast-Check**: einfache WCAG-AA-Prüfung (Text vs. Background) im Code-Node.
- **Direction-Katalog-Defaults**: konkrete Default-Token-Sets pro Direction hinterlegen.
- **Menü-Umfang**: bei sehr langer Speisekarte „Menu Highlights” (Auswahl) statt voller Karte — LLM kuratiert.
- **Supabase-Schema** `concept` anlegen, falls gewählt.

```

```