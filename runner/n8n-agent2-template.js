// n8n Code Node — Agent 2 Build Trigger
// Position: Nach "Concept Architect" / "Prompt Builder"
// Output: HTTP-Request-ready payload für den VPS Runner
//
// Eingang: Lead-Daten aus CONTENT + CONCEPT + IMAGES Sheets
// Ausgang: POST-Payload für http://76.13.11.80:8787/run-a2

const lead = $input.item.json;

// ── 1. Site-Slug erzeugen (URL-safe)
function slugify(s) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const slug = slugify(lead.business_name || lead.lead_id);
const siteDir = `sites/${slug}`;

// ── 2. Build-Optionen aus dem Command Center (Pepe wählt)
//    Diese kommen über $input.item.json.build_options vom Frontend
const opts = lead.build_options || {
  style: 'restaurant-premium',     // restaurant-premium | cafe-warm | bar-dark | bistro-modern
  colorDirection: 'auto',           // auto | warm-earth | dark-luxury | cool-modern | drenched
  quality: 'premium',               // premium | standard
  imageSource: 'unsplash',          // unsplash | poe-generated | scraped
};

// ── 3. Prompt aus Template + Lead-Daten zusammenbauen
const PROMPT = `Du bist Claude Code auf einem VPS. Baue eine vollständige, produktionsreife Restaurant-Demo-Website.

DEINE AUFGABE:
Schreibe diese zwei Dateien komplett neu:
1. ${siteDir}/src/App.jsx — komplette React Single-Component-App
2. ${siteDir}/index.html — ersetze den <head> mit Schema.org + Google Fonts

Nichts sonst. Kein npm install. Keine anderen Dateien.

QUALITÄT: Lies zuerst project-napoli-premium/index.html — das ist die Qualitätslatte. Gleiche Klasse oder besser.

RESTAURANT-DATEN (NUR diese verwenden):
Name: ${lead.business_name}
Adresse: ${lead.address}
Telefon: ${lead.phone}
Website: ${lead.website_url}
Kategorie: ${lead.cuisine || 'Restaurant'}
Atmosphäre: ${lead.atmosphere || ''}
Öffnungszeiten:
${lead.opening_hours || ''}
Google Rating: ${lead.google_rating || ''} / ${lead.google_reviews_count || ''} Bewertungen
Specials: ${lead.specials || ''}
Preis: ${lead.price_range || '€€'}

DESIGN-OPTIONEN (vom User gewählt):
Style: ${opts.style}
Farb-Direction: ${opts.colorDirection}
Qualität: ${opts.quality}

Bilder (Unsplash URLs direkt verwenden):
${lead.images?.map(i => `- ${i.role}: ${i.url}`).join('\n') || '- Standard Hero/Interior/Food URLs nach Style wählen'}

PFLICHT:
1. <meta name="robots" content="noindex,nofollow"> in index.html (behalten)
2. Sticky Demo-Banner: "Demo von PDSTUDIO · ${lead.website_url}"
3. Schema.org Restaurant JSON-LD in index.html <head>
4. Nur react + react-dom — KEINE externen Packages
5. KEINE Animation-Libraries — pure CSS
6. Mobile-first
7. "Erstellt von PDSTUDIO" im Footer
8. Impressum, Datenschutz, AGB als #anchors im Footer

SECTIONS (alle pflicht):
- Nav sticky
- Hero fullscreen
- Trust Strip (Google Rating, Bewertungen, Specials)
- Konzept/About
- Karte/Angebot (6-8 Items — als Demo markiert)
- Öffnungszeiten (heute highlighted)
- Anfahrt + Kontakt + Maps iframe
- Footer

VERBOTEN: Placeholder-Text, erfundene Daten, npm-Packages, Dateien außerhalb ${siteDir}/`;

// ── 4. Payload für Runner
return [{
  json: {
    url: 'http://76.13.11.80:8787/run-a2',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${$env.RUNNER_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: {
      mode: 'build',
      branch: 'main',
      run_id: `${slug}-${Date.now().toString(36).slice(-6)}`,
      prompt: PROMPT,
      metadata: {
        lead_name: lead.business_name,
        lead_id: lead.lead_id,
        site_dir: siteDir,
        site_type: opts.style,
        quality_target: opts.quality,
        requires_deploy: true,
      },
    },
  },
}];

// ── n8n Workflow-Pfad ──────────────────────────────────────────────────────────
// 1. Diesen Code-Node nach Concept/Prompt Builder einfügen
// 2. HTTP Request Node danach: nimmt die url/headers/body-Felder
// 3. Response → Code Node parst response.deploy_url
// 4. Google Sheets BUILD-Tab Update: { lead_id, demo_url, build_status, run_id }
