# Google Sheets → Command Center Sync

> **Sheet:** `1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc`
> **Refresh-Intervall:** 60 Sekunden (automatisch im Command Center)
> **Manueller Refresh:** Button im Header

---

## Welcher Tab steuert was

| Tab | Zweck | Wird gelesen für |
|-----|-------|------------------|
| **LEADS** | Basis-Lead-Daten | Lead-Liste, Score, Kontakt |
| **CONTENT** | Texte aus Website-Scraping | Lead-Detail, Karte, Atmosphäre |
| **IMAGES** | Bilder-URLs + Metadaten | Lead-Detail, Hero-Bild |
| **VALIDATION** | Validator-Ergebnisse | Validierungs-Status |
| **CONCEPT** | Design-Konzept | Konzept-Preview |
| **BUILD** | Deploy-URL + Datum | **Sites-Tab** |

---

## Sites-Tab erscheint NICHT — was prüfen

Eine Site erscheint im Sites-Tab wenn **alle 3 Bedingungen erfüllt** sind:

### 1. BUILD-Tab Zeile mit `demo_url` existiert

Pflichtfeld `demo_url` muss eine echte URL sein (`https://...`).

### 2. EINS dieser Datumsfelder ist gesetzt UND liegt in der Range gestern-heute-zukunft

Priorität (von oben nach unten):
- `deployed_at`
- `built_at`
- `polished_at`
- `build_date`
- `created_at`
- `generated_at`
- `updated_at`
- `website_built_at` (legacy)
- `date`
- `timestamp`

**Format:** ISO-8601 (z.B. `2026-06-13T17:42:00.000Z`)
**Range:** alles ab gestern 00:00 — inkl. zukünftig

### 3. ODER `source` enthält einen der bekannten Build-Run-Tags

| `source`-Wert | Bedeutung |
|---------------|-----------|
| `a2-vps-builder` | A2 VPS Build |
| `a3-polish-agent` | A3 Polish Re-Deploy |
| `5-styles-demo` | Aus 5-Style-Run |
| `10-build-run` | Aus 10-Site-Run |
| `ui-manual-save` | Manuell via UI gespeichert |
| `backfill`, `session-backfill` | Backfill nach Session |

---

## BUILD-Tab — Alle Spalten

### Pflicht (für Sites-Tab)
| Spalte | Beispiel | Notizen |
|--------|----------|---------|
| `lead_id` | `pho-saigon` | UNIQUE — auch ohne LEADS-Zeile OK |
| `demo_url` | `https://pho-saigon.vercel.app` | https/http Pflicht |
| `deploy_status` | `success` | success/failed |

### Datum (mind. EINS)
| Spalte | Beispiel | Wann setzen |
|--------|----------|-------------|
| `built_at` | `2026-06-13T17:42:00.000Z` | nach A2 Build |
| `deployed_at` | `2026-06-13T17:43:00.000Z` | nach Vercel Deploy |
| `polished_at` | `2026-06-13T18:00:00.000Z` | nach A3 Polish |
| `updated_at` | `2026-06-13T18:00:00.000Z` | bei jedem Update |

### Optional (Anreicherung)
| Spalte | Beispiel | Zweck |
|--------|----------|-------|
| `restaurant_name` | `Pho Saigon` | Anzeigename im Sites-Tab |
| `branche` | `restaurant` | Filter |
| `opportunity_score` | `88` | Sales-Score |
| `website_quality_score` | `25` | Web-Score |
| `pain_points` | `Nur Lieferando · keine eigene Site` | Notes-Display |
| `selected_reason` | `Starkes Produkt + Lieferando-Hebel` | Notes-Display |
| `reservation_mode` | `reservation` / `ordering` / `contact` | A4-Default |
| `design_reference` | `Style: cinnabar` | Style-Tag |
| `skills_used` | `taste-skill, emilkowalski, impeccable` | Marker |
| `notes` | freier Text | Audit |
| `next_action` | `verify_contact → A4 demo_intro` | TODO |
| `site_dir` | `sites/pho-saigon` | Repo-Pfad |
| `run_id` | `r10-pho-saigon-70934` | Tracking |
| `source` | siehe oben | Sites-Tab-Trigger |

---

## Wie schreibe ich von außen ins BUILD-Sheet

### Option 1: Webhook (empfohlen)

```bash
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/build-meta-write \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "neu-restaurant",
    "demo_url": "https://neu-restaurant.vercel.app",
    "build_status": "success",
    "deploy_status": "success",
    "site_dir": "sites/neu-restaurant",
    "restaurant_name": "Neu Restaurant",
    "branche": "restaurant",
    "opportunity_score": 85,
    "website_quality_score": 30,
    "pain_points": "...",
    "selected_reason": "...",
    "reservation_mode": "reservation",
    "design_reference": "Style: cinnabar",
    "skills_used": "taste-skill, emilkowalski, impeccable",
    "notes": "...",
    "next_action": "verify_contact → A4 demo_intro",
    "run_id": "manual-001",
    "source": "ui-manual-save",
    "kind": "build"
  }'
```

Der Webhook setzt automatisch:
- `built_at`/`polished_at` je nach `kind` (`build` oder `polish`)
- `deployed_at` wenn `deploy_status === "success"`
- `updated_at` immer
- `website_built_at` (legacy field) automatisch

### Option 2: Direkt im Google Sheet

1. Sheet öffnen → BUILD-Tab
2. Neue Zeile einfügen
3. Mindestens diese Spalten füllen:
   - `lead_id` (unique)
   - `demo_url` (https://...)
   - `built_at` (ISO-Datum)
   - `deploy_status` = `success`
   - `source` = `ui-manual-save` (oder leer wenn Datum reicht)

→ Nach max. 60s erscheint die Site im Command Center Sites-Tab.

---

## Wie schreibe ich neue LEADS

LEADS-Tab steuert die **Lead-Liste**. Eine Site die NUR im BUILD-Tab existiert wird zwar im Sites-Tab gezeigt (als virtueller Lead), aber NICHT in der Lead-Liste.

Wenn die Site auch als Lead durchsuchbar sein soll:

1. LEADS-Tab öffnen
2. Neue Zeile mit:
   - `lead_id` (gleich wie in BUILD)
   - `name` / `business_name`
   - `address`, `phone`
   - `score` (optional)

Refresh wartet max 60s.

---

## Häufige Probleme

### Site erscheint nicht im Sites-Tab obwohl in BUILD

**Check:**
1. `demo_url` startet mit `http://` oder `https://`?
2. Mindestens EIN Datumsfeld gesetzt UND in der Range?
3. Falls Datum fehlt: ist `source` einer der Build-Run-Tags?

**Manual-Fix:** im UI in der Karte "Metadaten speichern" Button → setzt alle Datumsfelder mit aktueller Zeit.

### Site verschwindet nach Browser-Reload

**Ursache:** Nur `markSiteFresh()` im SessionStorage, kein persistierter `built_at`.

**Fix:** Webhook `build-meta-write` aufrufen oder Button im UI.

### Site erscheint doppelt

**Ursache:** Eine Zeile in LEADS, eine in BUILD mit demselben `lead_id`. Tritt nur bei manuellem Edit auf — Filter macht Dedup automatisch (LEADS gewinnt).

### Falscher Restaurant-Name

**Ursache:** `restaurant_name` nicht in BUILD UND keine LEADS-Zeile.

**Fix:** `restaurant_name`-Spalte in BUILD-Tab füllen.

---

## Diagnose im Sites-Tab

Oben unter "Sites" gibt es einen Diagnose-Strip:

```
Sichtbar │ Persistiert │ Session-only │ Datum fehlt │ Letzter Refresh
   5     │      4      │      1       │     0       │   17:25:33
```

- **Sichtbar** — Anzahl Sites die durch den Filter kommen
- **Persistiert** — haben mind. ein Datumsfeld im Sheet
- **Session-only** — nur via `markSiteFresh()` markiert (verschwinden beim Reload!)
- **Datum fehlt** — Site ist sichtbar via `source`-Tag aber ohne Datum
- **Letzter Refresh** — wann das Command Center zuletzt das Sheet gelesen hat

---

## Webhook-Übersicht (alle relevanten Endpoints)

```
POST /webhook/build-meta-write
  → BUILD-Sheet upsert (siehe oben)

POST /webhook/agent2-build
  → A2: scaffold → claude code → build → deploy → BUILD-Sheet
  Body: { lead_id, business_name, address, phone, ..., build_options: { style, ... } }

POST /webhook/agent3-polish
  → A3: Polish existing site → re-deploy → BUILD-Sheet (polished_at)
  Body: { lead_id, business_name, site_slug, polish_options: { level, focus } }

POST /webhook/agent4-write
  → A4: E-Mail/SMS/WhatsApp Texte (kein Sheet-Write)
  Body: { lead_id, business_name, channel, context, demo_url }

POST /webhook/agent5-price
  → A5: Pricing-Berechnung (kein Sheet-Write)

POST /webhook/agent6-check
  → A6: Fact-Check (kein Sheet-Write)
```

---

## Beispiel-Workflow: Neue Demo manuell ins Sites-Tab bekommen

Du hast eine Demo `https://meine-pizzeria.vercel.app` extern gebaut und willst sie sehen:

```bash
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/build-meta-write \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "meine-pizzeria",
    "demo_url": "https://meine-pizzeria.vercel.app",
    "build_status": "success",
    "deploy_status": "success",
    "restaurant_name": "Meine Pizzeria",
    "source": "ui-manual-save",
    "kind": "build"
  }'
```

In Command Center → Sites Tab nach max 60s → "Meine Pizzeria" erscheint mit allen Buttons.

---

## Auto-Refresh deaktivieren

Falls du das Sheet manuell editierst und nicht die 60s warten willst:

- Refresh-Button rechts im Command Center Header drücken (rotiert)
- Oder ENV `VITE_SHEET_REFRESH_MS` setzen
