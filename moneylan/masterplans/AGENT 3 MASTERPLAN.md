# MONEYLAN — Agent 3 Masterplan: Image Extractor / Asset Design Manager

> (a) Spezifikation und (b) Masterprompt für Claude Code (Bau via n8n public REST API,
> Deploy, Test mit echten Leipzig-Leads).

-----

## 1. Zweck & Rolle

Agent 3 agiert als **Asset Design Manager**. Er beantwortet für jeden qualifizierten Lead:

- Welche Bilder sind nutzbar?
- Welches ist DAS Logo (beste Auflösung/Vektor)?
- Welches Hero-Bild?
- Welche Farbwelt / Bildsprache?
- Was fehlt (Asset-Lücken)?

**Entscheidend (deine 10/10-Definition):** Claude Code muss später **echte, lokal gespeicherte, bewertete Assets** verwenden können — nicht nur URLs. Also werden die nutzbaren Bilder **wirklich heruntergeladen** nach `/runs/{lead_id}/assets/` mit echten Metadaten.

Ergebnis ist die Bild-Basis für Agent 5 (Konzept) und das Material für Agent 6 → Claude Code.

-----

## 2. Input

Aus Agent 1 (Score ≥ Schwelle): `lead_id`, `business{website,...}`, `score`. Optional `content.json` aus Agent 2 (für Kontext, welche Unterseiten existieren).

-----

## 3. Output (JSON-Schema, eingefroren) → `/runs/{lead_id}/images.json` + Sheet/Supabase `IMAGES`

```json
{
  "schema_version": "2.0",
  "agent": "image_extractor",
  "lead_id": "",
  "source_url": "",
  "crawled_urls": [],
  "generated_at": "ISO-8601",

  "logo": {
    "url": "", "local_path": "", "format": "", "width": 0, "height": 0,
    "is_vector": false, "qualitaet": "hoch|mittel|niedrig|keins",
    "begruendung": ""
  },
  "hero": {
    "url": "", "local_path": "", "width": 0, "height": 0,
    "qualitaet_score": 0, "begruendung": ""
  },
  "assets": [
    {
      "url": "", "local_path": "",
      "width": 0, "height": 0, "file_size": 0, "mime_type": "", "aspect_ratio": 0.0,
      "source_url": "",
      "category": "logo|hero|gallery|team|interieur|food|aussen|hintergrund|deko|sonstiges",
      "quality_score": 0,
      "usage_recommendation": "verwenden|mit_vorbehalt|nicht_verwenden",
      "begruendung": ""
    }
  ],
  "farbpalette": [],
  "bild_stil": "",
  "konzept_text": "",
  "empfehlung_agent5": "",
  "fehlende_assets": [],
  "stats": { "kandidaten_gesamt": 0, "geladen": 0, "verwendbar": 0, "gespeichert": 0 },
  "confidence": 0.0,
  "warnings": [],
  "logs": []
}
```

-----

## 4. Verarbeitungs-Pipeline

```
Trigger → Leads laden → Filter Score≥Schwelle → Loop je Lead
  → Oxylabs Startseite → Linkfinder (Galerie/Speisekarte/Über-uns/Team) → Oxylabs Unterseiten → HTML sammeln
  → Code "Bild-Kandidaten sammeln" (ALLE Quellen, Abschnitt 5)
  → Code "Vorfilter" (Müll raus, Logo-Hints, SVG-Handling)
  → Split: Kandidaten als Items (data:-URLs raus)
  → HTTP "Bild laden" (Binary) → echte Metadaten: width/height/file_size/mime_type/aspect_ratio
  → Code "Top-N wählen" (max 12 für Vision, Logo+Hero-Kandidaten priorisiert)
  → Code "Vision-Input bauen" (Base64-Data-URIs)
  → LLM Vision (Claude Sonnet/Poe, multimodal): Klassifikation, Qualität, Eignung, Logo-Wahl, Hero-Wahl, Farbpalette, Stil, Konzept
  → Code "Schema-Check + Self-Correction" (max 2 Retry, sonst Fallback)
  → Code "kuratieren": verwendbare Assets bestimmen
  → HTTP "verwendbare Bilder herunterladen" → /runs/{lead_id}/assets/ (logo.png, hero.jpg, gallery_01.jpg, ...)
  → Code "Manifest bauen" (+ fehlende_assets + confidence)
  → Sheet/Supabase IMAGES upsert
  → Write /runs/{lead_id}/images.json
Fehlerpfad: jeder Call continueOnFail + Warning; nie harter Stop
```

-----

## 5. Bild-Quellen (Pflicht — alle abdecken)

`img src`, `srcset` (größte Auflösung wählen), `<picture>/<source>`, lazy-load `data-src`/`data-srcset`, CSS `background-image:url()`, OpenGraph `og:image`, `twitter:image`, `favicon`, `apple-touch-icon`, Web-Manifest-Icons, inline-SVG-Logos, WordPress `wp-content/uploads`, Galerie-Bilder. Absolut machen, deduplizieren, interne + relevante CDN-URLs behalten.

**Vorfilter:** raus = tracking-pixel, 1x1, spacer, sprite, icon/arrow/chevron, base64-Mini-Icons, Maße < 50px. **Logo-Quellen (favicon/apple-touch/manifest/SVG) NIE als Müll verwerfen** (Logo-Fallback).

-----

## 6. Echte Metadaten + Qualität (die A3-Härtung)

- **Deterministisch (aus geladenem Bild):** width, height, file_size, mime_type, aspect_ratio. Echte Maße nur durch Laden zuverlässig.
- **Qualität/Schärfe/Eignung:** Vision-LLM beurteilt (Schärfe, Belichtung, Motiv, Markeneignung) und vergibt `quality_score` 0–100 + `usage_recommendation`. (2026-Praxis: technischer IQA-Score via API optional als Verschärfung — Schwelle ~0.5; im Standard reicht Vision-Urteil + Maße.)
- **Logo-Wahl:** beste Auflösung/Vektor; SVG/Manifest-512 schlägt 32px-Favicon. LLM bestätigt, Fallback = höchste verfügbare Logo-Quelle.

-----

## 7. Assets wirklich speichern (10/10-Kriterium)

Nur `usage_recommendation != nicht_verwenden`-Bilder werden heruntergeladen nach `/runs/{lead_id}/assets/`:

- `logo.png` / `logo.svg`
- `hero.jpg`
- `gallery_01.jpg` … `gallery_NN.jpg`
  Jedes mit `local_path` im Manifest. Damit kann Claude Code (Agent 6 → Bau) echte lokale Dateien einbinden.

**Rechtlich:** Download nur zur privaten Präsentation gegenüber dem Inhaber (dein Rahmen). Im Manifest vermerkt, Demo bleibt nicht-öffentlich.

-----

## 8. Fehlende Assets erkennen (für Agent 4/5)

`fehlende_assets[]`: `kein_gutes_hero` (kein Bild ≥ 1200px Hero-tauglich), `logo_nur_favicon` (nur Mini-Logo), `keine_food_bilder`, `keine_innenraum_bilder`, `keine_team_bilder`, `bilder_zu_klein`, `viele_unscharf`. Das ist Verkaufs- und Konzept-relevant (Agent 5 plant Ersatzstrategie, Agent 4 bewertet Build-Risiko).

-----

## 9. Farbpalette & Stil (Basis für Agent 5)

- **Farbpalette:** 3–6 dominante Marken-/Stimmungsfarben als Hex. Vision-LLM leitet aus Logo + Hero + Galerie ab. (Optional deterministisch via Farb-Quantisierung der geladenen Bilder als Verschärfung.)
- **bild_stil:** Bildsprache (warm/rustikal, modern/clean, dunkel/edel).
- **konzept_text + empfehlung_agent5:** welche Bildwelt die neue Seite haben sollte, welche Bilder als Hero/Galerie, was meiden, was fehlt.

-----

## 10. Fehlerpfade

- Oxylabs leer/401 → Warning `scrape_failed`, weniger Kandidaten.
- Bild-Download 403/Hotlink-Block → Bild überspringen, Warning, weiter.
- data:-URL → vor Laden filtern.
- Vision kaputtes JSON → Self-Correction (max 2), dann Fallback (Logo aus Hint, keine Bewertung), Warning `vision_parse_failed`.
- Keine Bilder gefunden → `fehlende_assets` füllen, leeres aber valides Manifest, KEIN Crash (Always Output Data).
- Asset-Speicherung scheitert (Volume) → Warning `asset_save_failed`, URL bleibt im Manifest.

-----

## 11. Quality Score, Warnings, Logs

- `confidence` 0–1: sinkt bei scrape_failed, vision_parse_failed, wenig Kandidaten, asset_save_failed.
- `warnings[]`: scrape_failed, image_load_failed, vision_parse_failed, asset_save_failed, no_images, logo_only_favicon.
- `logs[]`: pro Schritt fürs Dashboard.
- `stats`: kandidaten_gesamt, geladen, verwendbar, gespeichert.

-----

## 12. Testfälle (echte Leipzig-Leads)

1. **Bildreiche Seite** (Galerie + Logo + Food) → mehrere verwendbare Assets, Logo erkannt, gespeichert.
1. **Nur Favicon als Logo** → logo.qualitaet niedrig, fehlende_assets: logo_nur_favicon.
1. **Lazy-load-Galerie** (data-src) → Bilder trotzdem erfasst.
1. **CSS-Background-Hero** → als Hero-Kandidat erkannt.
1. **Hotlink-geschützte Bilder** → image_load_failed, kein Crash.
1. **Seite fast ohne Bilder** → fehlende_assets gefüllt, valides leeres Manifest.
1. **Vision kaputtes JSON** (erzwungen) → Self-Correction/Fallback, Logo trotzdem da.
1. **Asset wirklich gespeichert?** → prüfen, dass /runs/{lead_id}/assets/ echte Dateien enthält + local_path stimmt.

Jeder Test: Schema-konform? local_path vorhanden? Agent 5 könnte ohne Nachfrage Konzept bauen?

-----

## 13. Sheet/Supabase-Update

- `IMAGES`-Tab/Tabelle upsert per lead_id. Spalten: lead_id, name, logo_url, logo_local_path, logo_qualitaet, hero_url, hero_local_path, galerie_urls (| ), galerie_local_paths (| ), farbpalette, bild_stil, anzahl_gesamt, anzahl_verwendbar, anzahl_gespeichert, konzept_text, empfehlung_agent5, fehlende_assets, confidence, warnings.
- `/runs/{lead_id}/images.json` vollständig, `/runs/{lead_id}/assets/` mit echten Dateien.

-----

## 14. MASTERPROMPT für Claude Code

**Projektziel:** Baue & deploye den n8n-Workflow „MONEYLAN Agent 3 — Image Extractor / Asset Design Manager” via n8n public REST API. Er crawlt Website (Start + Unterseiten), sammelt Bilder aus ALLEN Quellen, lädt Kandidaten für echte Metadaten, lässt Claude Sonnet (Vision) klassifizieren/bewerten, lädt die verwendbaren Bilder wirklich nach `/runs/{lead_id}/assets/`, und schreibt Manifest + Farbpalette + Stil + fehlende_assets nach Supabase/Sheet `IMAGES` + `/runs/{lead_id}/images.json`.

**Stack & Umgebung:**

- n8n self-hosted, Container `n8n-n8n-1`, Volume `/files` (Host `/local-files`), beschreibbar — Assets dort unter `/files/runs/{lead_id}/assets/`.
- Credentials in n8n: Oxylabs **Basic Auth**, Poe (`Authorization: Bearer`), Sheets/Supabase.
- Vision: Claude Sonnet via Poe, **Bilder als Base64-Data-URI** (verifiziert: Poe akzeptiert Base64, nicht zwingend externe URL), max ~12 Bilder/Lead.

**Pflicht-Regeln:**

1. JSON-Schema (Abschnitt 3) exakt. Alle Bild-Quellen (Abschnitt 5).
1. Echte Metadaten aus geladenem Bild (Abschnitt 6). Vision für Qualität/Eignung.
1. Verwendbare Bilder WIRKLICH herunterladen (Abschnitt 7) — local_path Pflicht. Das ist das 10/10-Kriterium.
1. fehlende_assets (Abschnitt 8), Farbpalette + Stil (Abschnitt 9).
1. Self-Correction bei Vision-JSON (max 2), Fallback Logo-Hint.
1. confidence, warnings[], logs[], stats immer.
1. Jeder Call continueOnFail + Timeout, Always Output Data, nie harter Stop.
1. Nach Bau: 8 Testfälle (Abschnitt 12), iterativ fixen bis grün — inkl. Prüfung, dass echte Asset-Dateien gespeichert wurden.

**Dateistruktur:**

```
/moneylan-agent3/
  build_agent3.(py|ts)
  workflow_agent3.json
  code_nodes/
    image_collect.js   # Sammler + Vorfilter
    split_candidates.js
    build_vision.js     # Base64-Input
    vision_prompt.js
    manifest_build.js   # Schema-Check + Self-Correction + Kuratierung
    save_assets.js      # Download verwendbarer Bilder
  tests/
    test_leads_leipzig.json
    run_tests.(py|ts)
```

**Rückgabe:**

```json
{ "workflow_id":"", "deployed":true,
  "test_results":[{"case":"","passed":true,"notes":""}],
  "open_issues":[], "asset_save_verified": true }
```

**No-Gos:** Nur URLs ohne echten Download (verfehlt 10/10). Logo-Quellen als Müll verwerfen. Bilder öffentlich machen (nur private Demo). Harter Stop bei Einzelfehler. Credentials hardcoden.

-----

## 15. Offene Punkte für Claude Code

- **Bild-Download-Pfad**: `/files/runs/{lead_id}/assets/` — Unterordner-Anlage testen (ReadWriteFile legt Ordner ggf. nicht an → ggf. flache Namen `{lead_id}_logo.png`).
- **Echte Maße ohne Bildlib**: aus HTTP-Response (Content-Length) + ggf. Maße aus Bild-Header parsen; sonst Vision schätzen lassen.
- **Optionale IQA-API** (Sightengine o.ä.) als Schärfe-Verschärfung — nur wenn Budget.
- **Hotlink-Schutz**: bei 403 ggf. Referer-Header der Quellseite mitsenden.
- **Supabase-Schema** `images` anlegen, falls gewählt.

```

```