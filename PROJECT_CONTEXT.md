# PDSTUDIO — Projektkontext

## Was ist PDSTUDIO?

PDSTUDIO ist Pepe Dietrichs vollständig selbst gebautes System zur automatisierten Lead-Generation und Demo-Website-Erstellung für lokale Restaurants in Deutschland. Früher unter dem Namen MONEYLAN bekannt.

**Kernidee:** Geh zu einem Restaurant mit schlechter Website und zeig ihm eine fertige, personalisierte Demo — live im Netz, mit echten Daten des Betriebs. Nicht ein Mockup. Eine echte React-Website. Das erzeugt eine andere Gesprächssituation als jede Präsentation der Welt.

---

## Geschäftsmodell

**Zielgruppe:** Restaurants in mittelgroßen deutschen Städten (Leipzig, Dresden, Nürnberg, Würzburg) mit schlechter oder fehlender Website und guter Google-Bewertung.

**Lead-Qualität:** Gutes Produkt + schlechte digitale Präsenz = bester Lead. Score ist eine inverse Mängel-Skala: hoher Score = schlechte Website = wertvoller Lead.

**Sales-Kanal:** Telefon. Nicht E-Mail, nicht LinkedIn. Demo-Link wird live während des Gesprächs gesendet.

**Umsatzmodell:** Monatliches Hosting- und Service-Abo (€89–€129 Standard). Einmalige Setup-Gebühr optional. Recurring Revenue ist das Ziel.

**Kurzfristiges Ziel:** 100 aktive Kunden in 6 Monaten.

---

## Technischer Stack

| Schicht | Technologie |
|---------|------------|
| Automatisierung | n8n self-hosted (Hostinger VPS, Leipzig) |
| LLM | Claude Sonnet 4.6 via Poe API |
| Scraping | Oxylabs Proxy (Basic Auth) |
| Daten | Google Sheets (6 Tabs: LEADS, CONTENT, IMAGES, VALIDATION, CONCEPT, BUILD) |
| Persistenz | Supabase (langfristig, TWIN Memory) |
| Demo-Websites | React + Vite + Tailwind CSS, Deployment auf Vercel |
| Command Center | React + Vite, Deployment auf Vercel |
| Voice-Assistent | TWIN via ElevenLabs + ElevenAgents |
| Assets | /files Volume im n8n-Container |

---

## Infrastruktur-Endpoints

```
n8n Instanz:       https://n8n.srv1736252.hstgr.cloud
Command Center:    https://command-center-lac-one.vercel.app
Google Sheets ID:  1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc

Agenten-Webhooks:
  POST /webhook/agent1-start   → A1 Lead Qualifier
  POST /webhook/agent2-start   → A2 Claude Code Builder
  POST /webhook/agent3-start   → A3 Polish Agent
  POST /webhook/agent4-start   → A4 Human Writer
  POST /webhook/agent5-start   → A5 Pricing Agent
  POST /webhook/agent6-start   → A6 Fact Checker
  POST /webhook/agent7-start   → Website Builder (intern von A2 genutzt)

TWIN Webhooks (geplant, noch zu bauen):
  GET  /webhook/twin/agent-status
  POST /webhook/twin/lead-scan
  GET  /webhook/twin/today-leads
  GET  /webhook/twin/best-leads
  GET  /webhook/twin/revenue-summary
  GET  /webhook/twin/workflow-errors
  POST /webhook/twin/create-concept
  POST /webhook/twin/generate-demo
  POST /webhook/twin/validate-data
  POST /webhook/twin/send-follow-up
  POST /webhook/twin/ceo-briefing
```

---

## Google Sheets Struktur

| Tab | Inhalt | Hauptfeld |
|-----|--------|-----------|
| LEADS | Alle Leads mit Score, Stage, Kontakt | lead_id |
| CONTENT | Texte aus A1-Scraping (Name, OZ, Menü, Über-uns) | lead_id |
| IMAGES | Bild-URLs, Metadaten, Farbpalette | lead_id |
| VALIDATION | Validator-Ergebnisse, fehlende Felder, Freigabe | lead_id |
| CONCEPT | Design-Direction, Tokens, Fonts, Headlines | lead_id |
| BUILD | Demo-URLs, Build-Status, Deployment-IDs | lead_id |

Arrays in Sheets werden als `|`-getrennter Text gespeichert. Dashboard zerlegt beim Lesen.

---

## Demo-Website Eigenschaften

Jede generierte Demo-Website enthält:
- Hero mit restaurant-spezifischem Claim und Design-Direction
- Über-uns mit echten Texten aus der Original-Website
- Speisekarte, Öffnungszeiten, Kontakt — **nur echte Daten, nichts erfunden**
- Sticky Demo-Banner: "Diese Website ist eine Demo-Präsentation von PDSTUDIO"
- `noindex`-Meta — nicht von Google indexiert
- Schema.org Restaurant-Markup
- Impressum, Datenschutz, AGB (echte Pflichtseiten)
- "Bist du interessiert?"-Modal — zeigt Kontaktdaten des Restaurants
- Mobile-first, Lighthouse-ready

**Laufzeit A1→Demo:** ~8–12 Minuten gesamt. A2 allein: ~90 Sekunden (LLM + Vercel Build).

---

## TWIN — Digitaler Assistent

TWIN ist Pepes persönlicher KI-Operator für PDSTUDIO. Kein Allgemein-Assistent — kennt ausschließlich das PDSTUDIO-System.

**Was TWIN ist:**
- Operator: kennt alle laufenden Workflows, kann Agenten starten
- Analyst: liest Lead-Daten, sortiert nach Qualität, erkennt Muster
- Berater: kennt die Verkaufslogik, empfiehlt welcher Lead heute angerufen wird
- Projektmanager: kennt den Stand jedes Projekts, erinnert an offene Aktionen
- Entwicklungspartner: kann Claude Code-Prompts formulieren, n8n-Fehler diagnostizieren

**Wie TWIN spricht:** Direkt. Klar. Ohne Floskeln. Deutsch primär, Fachbegriffe Englisch. Kein "Natürlich!", kein "Gerne!".

**Sicherheitsprinzip:** TWIN fragt immer bevor er Geld ausgibt, Kunden anschreibt, oder Deployments überschreibt. Die Entscheidung trifft immer Pepe.

**Voice:** ElevenLabs mit Pepes geklonter Stimme (ElevenAgents Agent-ID: `agent_7101ktxvqktvfm2ta3rdgrpds3bv`)

---

## Supabase Memory Schema (TWIN)

```sql
-- Agenten-Logs
CREATE TABLE twin_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  lead_id text,
  status text NOT NULL,
  error_type text,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Entscheidungen
CREATE TABLE twin_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL,
  action_type text NOT NULL,
  action_params jsonb,
  user_confirmed boolean NOT NULL,
  outcome text,
  created_at timestamptz DEFAULT now()
);

-- Kunden-Profile
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text UNIQUE NOT NULL,
  business_name text NOT NULL,
  city text,
  monthly_value integer,
  signed_at date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- TWIN Memory
CREATE TABLE twin_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  confidence float DEFAULT 1.0,
  last_confirmed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

---

## Wer ist Pepe Dietrich?

- Baut Systeme, keine Projekte. Hebeleffekt statt Einzelarbeit.
- Debugging = Systemkritik. Will nicht nur Fehler fixen, sondern verstehen warum sie entstehen.
- Verkauft am Telefon — nicht per E-Mail oder LinkedIn.
- Dokumentiert ungern. TWIN soll das lebende Gedächtnis des Systems sein.
- Stärke: Systemdenken. Erkennt schnell, welche Komponente ein Problem verursacht hat.
- Sprache: Deutsch bevorzugt. Direkt. Kein Drumherum.
