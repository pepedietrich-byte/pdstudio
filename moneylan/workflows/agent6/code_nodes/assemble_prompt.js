/**
 * Agent 6 — Prompt Assembler
 * Lädt alle 4 Quell-JSONs, löst Asset-Pfade auf, baut deterministisch:
 *   - CLAUDE_BUILD_PROMPT.md  (der Bauauftrag)
 *   - claude_prompt.json      (maschinenlesbares Begleitobjekt)
 * Schreibt beide Dateien nach /files/runs/{lead_id}/.
 *
 * Input: $json = { lead_id, ... } (aus CONCEPT-Sheet-Row)
 */

const leadId  = $json.lead_id;
const warnings = [];

// ---- Quellen laden ----
function loadJson(path) {
  const fs = require('fs');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

let a2 = {}, a3 = {}, a4 = {}, a5 = {};
try { a5 = loadJson(`/files/runs/${leadId}/concept.json`);    } catch(e) { warnings.push('no_concept'); }
try { a2 = loadJson(`/files/runs/${leadId}/content.json`);    } catch(e) { warnings.push('source_missing_content'); }
try { a3 = loadJson(`/files/runs/${leadId}/images.json`);     } catch(e) { warnings.push('source_missing_images'); }
try { a4 = loadJson(`/files/runs/${leadId}/validation.json`); } catch(e) { warnings.push('source_missing_validation'); }

if (warnings.includes('no_concept')) {
  return [{ json: { lead_id: leadId, skipped: true, warnings, logs: [] } }];
}

// ---- Kurzreferenzen ----
const f  = a2.fakten         || {};
const it = a2.interpretation || {};
const concept = a5;
const tokens  = concept.design_tokens || {};
const colors  = tokens.colors        || {};
const typo    = tokens.typography    || {};
const spacing = tokens.spacing       || {};
const effects = tokens.effects       || {};
const pos     = concept.positionierung || {};
const copy    = concept.copy          || {};
const secs    = concept.sections      || [];
const ap      = concept.asset_plan    || {};
const conv    = concept.conversion_logic || {};
const constr  = concept.constraints   || {};

// ---- do_not_invent zusammenführen ----
const doNotInvent = [
  ...new Set([
    ...(a4.rückgabe_an?.map(r=>r.feld)||[]),
    ...(constr.do_not_invent||[]),
    ...((a2.missing_fields||[]).map(m=>{
      if(m==='keine_oeffnungszeiten') return 'Öffnungszeiten';
      if(m==='keine_speisekarte')     return 'Menü-Preise';
      if(m==='keine_email')           return 'E-Mail-Adresse';
      if(m==='keine_adresse')         return 'Adresse';
      if(m==='kein_telefon')          return 'Telefonnummer';
      return m;
    }))
  ])
].filter(Boolean);

// ---- Asset-Pfade auflösen ----
const assetPaths = [];
const usableAssets = (a3.assets||[]).filter(a=>a.usage_recommendation!=='nicht_verwenden'&&a.local_path);
for(const a of usableAssets) assetPaths.push(a.local_path);
if(a3.logo?.local_path) assetPaths.unshift(a3.logo.local_path);
if(a3.hero?.local_path) assetPaths.splice(1,0,a3.hero.local_path);
const uniqueAssets = [...new Set(assetPaths)];
if(uniqueAssets.length===0) warnings.push('asset_missing');

// ---- CSS Custom Properties aus Design-Tokens ----
const cssTokens = `/* Design-Tokens — 1:1 in globals.css einsetzen */
:root {
  /* Farben */
  --color-primary:    ${colors.primary    || '#C8956C'};
  --color-secondary:  ${colors.secondary  || '#F5E6D3'};
  --color-accent:     ${colors.accent     || '#8B5E3C'};
  --color-bg:         ${colors.background || '#FFFDF8'};
  --color-surface:    ${colors.surface    || '#FFF8F0'};
  --color-text:       ${colors.text       || '#2C1810'};
  --color-text-muted: ${colors.text_muted || '#8A7060'};

  /* Typografie */
  --font-heading: '${typo.font_heading || 'Playfair Display'}', Georgia, serif;
  --font-body:    '${typo.font_body    || 'Lato'}', system-ui, sans-serif;
  --fw-heading:    ${typo.weights?.heading || 700};
  --fw-body:       ${typo.weights?.body    || 400};
  --scale-h1:      ${typo.scale?.h1   || '3rem'};
  --scale-h2:      ${typo.scale?.h2   || '2rem'};
  --scale-h3:      ${typo.scale?.h3   || '1.375rem'};
  --scale-body:    ${typo.scale?.body  || '1rem'};
  --scale-small:   ${typo.scale?.small || '0.875rem'};

  /* Spacing & Layout */
  --section-y:       ${spacing.section_y    || '5rem'};
  --container-max:   ${spacing.container_max || '1200px'};
  --radius:          ${spacing.radius       || '0.5rem'};
  --gap:             ${spacing.gap          || '1.5rem'};

  /* Effects */
  --shadow:          ${effects.shadow     || '0 4px 24px rgba(0,0,0,0.10)'};
  --overlay:         ${effects.overlay    || 'rgba(0,0,0,0.45)'};
  --transition:      ${effects.transition || 'all 0.25s ease'};
}`;

// ---- Sektionen aufbereiten ----
const secLines = secs.map(s => {
  const assetRef = (s.assets_used||[]).length
    ? `\n   - Assets: ${(s.assets_used||[]).join(', ')}`
    : '';
  const copyNote = s.copy && Object.keys(s.copy).length
    ? `\n   - Copy: ${JSON.stringify(s.copy).slice(0,200)}`
    : '';
  return `### ${s.order||'?'}. ${s.id} — ${s.purpose||''}
   Layout: ${s.layout||'standard'}${assetRef}${copyNote}
   ${s.notes ? `Hinweis: ${s.notes}` : ''}`;
}).join('\n\n');

// ---- Fakten-Block (nur was vorhanden) ----
const factsBlock = [
  f.name       && `Name:             ${f.name}`,
  f.adresse    && `Adresse:          ${f.adresse}`,
  f.telefon    && `Telefon:          ${f.telefon}`,
  f.email      && `E-Mail:           ${f.email}`,
  f.oeffnungszeiten && `Öffnungszeiten:   ${f.oeffnungszeiten}`,
  f.reservierung_url && `Reservierung-URL: ${f.reservierung_url}`,
].filter(Boolean).join('\n');

// ---- do_not_invent Warnungen (mehrfach im Prompt) ----
const doNotStr = doNotInvent.length
  ? doNotInvent.map(d=>`  - ${d}`).join('\n')
  : '  - (keine kritischen Fehlenden — aber dennoch: keine erfundenen Fakten!)';

const doNotBlock = `### ⛔ DO NOT INVENT — KRITISCH (steht auch pro betroffener Sektion):
${doNotStr}
Diese Felder fehlen in den Quelldaten. Nutze Platzhalter-Texte wie "Bitte erfragen" oder "demnächst".
NIEMALS erfinden: Öffnungszeiten, Preise, Menü-Items, Adresse, Telefon, E-Mail, Awards, Bewertungen.`;

// ---- improvements_vs_original ----
const improvements = (concept.improvements_vs_original||[]).map(i=>`- ${i}`).join('\n') || '- Modern, mobil, schnell, rechtssicher';

// ---- Demo-Notice Text ----
const demoText = `Diese Website ist eine unverbindliche Demo-Präsentation, erstellt für ${f.name||'den Betrieb'}. Es handelt sich NICHT um die offizielle Website.`;

// ================================================================
// CLAUDE_BUILD_PROMPT.md aufbauen
// ================================================================
const md = `# MONEYLAN Bauauftrag — ${f.name || leadId}
**Design-Direction:** ${pos.design_direction || '—'} | **Zielgruppe:** ${pos.zielgruppe || '—'}
**Lead-ID:** ${leadId} | **Generiert:** ${new Date().toISOString().slice(0,10)}

---

## 1. Projektziel & WARUM

Du baust eine **moderne, markengerechte Demo-Website** für **${f.name || 'diesen Betrieb'}** — ein lokales Restaurant/Café in Leipzig.

**Zweck:** Kaltakquise-Demonstration. Der Inhaber sieht eine fertige Website und erkennt, was möglich wäre.
**Erfolgskriterium:** Besser als das Original — konkret:
${improvements}

**Design-Direction:** \`${pos.design_direction}\`
${pos.design_direction_begruendung ? `Begründung: ${pos.design_direction_begruendung}` : ''}
Stimmung: ${(pos.stimmung||[]).join(', ') || '—'}

**Wichtig:** Das ist KEINE generische Template-Website. Jede Designentscheidung muss zum Betrieb passen.

---

## 2. Tech-Stack (fix — nicht abweichen)

\`\`\`
Framework:  React + Vite
Styling:    Tailwind CSS (mit CSS Custom Properties für Design-Tokens)
Node:       LTS (22+)
Output:     Statische One-Page-Site, deploybar auf Vercel (privat, noindex)
\`\`\`

---

## 3. Dateistruktur (exakt so anlegen)

\`\`\`
/src
  App.jsx
  main.jsx
  components/
    Header.jsx       Hero.jsx        TrustBar.jsx
    About.jsx        MenuHighlights.jsx  Gallery.jsx
    Atmosphere.jsx   OpeningHours.jsx    Location.jsx
    CTA.jsx          DemoNotice.jsx      Footer.jsx
  data/
    siteData.js      ← alle Fakten + Copy hier zentralisieren
  styles/
    globals.css      ← Design-Tokens als CSS Custom Properties
/assets/             ← Bilder aus /runs/${leadId}/assets/ hierher kopieren
index.html           ← enthält noindex-Meta (PFLICHT)
vite.config.js
package.json
tailwind.config.js
\`\`\`

---

## 4. Input-Dateien & Asset-Pfade

Lies diese Dateien zu Beginn:
- \`/files/runs/${leadId}/concept.json\`    ← Design-Konzept (Hauptquelle)
- \`/files/runs/${leadId}/content.json\`   ← Fakten & Texte
- \`/files/runs/${leadId}/images.json\`    ← Bilder + Metadaten

**Verwendbare Assets (nur diese, keine Hotlinks):**
${uniqueAssets.length ? uniqueAssets.map((p,i)=>`- \`${p}\``).join('\n') : '- KEINE lokalen Assets → Ersatzstrategien nutzen (Farbverläufe, Typografie-Hero)'}

Hero-Fallback: ${ap.hero?.fallback || 'Vollflächen-Farbverlauf mit Logo + Claim-Text'}
Logo-Fallback: ${ap.logo?.fallback || 'Wortmarke aus Betriebsname, fette Typografie'}

---

## 5. Design-System — CSS Custom Properties

\`\`\`css
${cssTokens}
\`\`\`

**Google Fonts einbinden:** \`${typo.font_heading}\` + \`${typo.font_body}\`

---

## 6. Sektionen (in dieser Reihenfolge, alle bauen)

${secLines || `### 1. hero\n### 2. about\n### 3. menu_highlights\n### 4. gallery\n### 5. opening_hours\n### 6. location_map\n### 7. cta_reservation\n### 8. demo_notice`}

---

## 7. Fakten (aus content.json — 1:1 übernehmen, NICHT umformulieren)

\`\`\`
${factsBlock || '(Fakten direkt aus content.json lesen)'}
\`\`\`

Speisekarte/Angebot: ${JSON.stringify((f.speisekarte||[]).slice(0,8))}
Spezialitäten: ${(it.spezialitaeten||[]).join(', ') || '(aus content.json lesen)'}
Küche: ${(it.kueche||[]).join(', ') || '(aus content.json lesen)'}

---

## 8. Copy (aus Konzept — einsetzen, NICHT umformulieren)

\`\`\`json
{
  "hero_headline":    ${JSON.stringify(copy.hero_headline    || '')},
  "hero_subheadline": ${JSON.stringify(copy.hero_subheadline || '')},
  "cta_primary":      ${JSON.stringify(copy.cta_primary      || 'Tisch reservieren')},
  "cta_secondary":    ${JSON.stringify(copy.cta_secondary    || 'Speisekarte')},
  "ueber_uns_neu":    ${JSON.stringify((copy.ueber_uns_neu   || it.ueber_uns || '').slice(0,500))}
}
\`\`\`

Micro-Copy: ${JSON.stringify(copy.microcopy||{})}

---

## 9. ⛔ KRITISCHE REGELN — NIEMALS VERLETZEN

${doNotBlock}

### Weitere Pflicht-Regeln:
- **NICHT generisch bauen.** Jede Sektion muss den konkreten Betrieb widerspiegeln.
- **Nur lokale Assets** aus \`/assets/\` — keine externen Bild-URLs, keine Hotlinks.
- **Alle CTAs** funktional: tel:, mailto:, Anker-Links. Kein echtes Backend.
- **Mobile-first.** Prüfe bei 390px, 768px, 1280px.
- **Ladezeit:** Bilder mit loading="lazy", komprimiert ≤ 200KB pro Bild wenn möglich.
- **NAP konsistent:** Name, Adresse, Telefon auf jeder relevanten Sektion sichtbar.

---

## 10. Rechtliches (ALLE PFLICHT)

\`\`\`html
<!-- In index.html <head>: -->
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="Demo-Website — ${f.name||'Betrieb'} — nicht öffentlich">
\`\`\`

**Demo-Notice-Banner (sichtbar oben, nicht wegklickbar):**
\`\`\`
${demoText}
\`\`\`

Keine echten Buchungs-/Zahlungs-Backends. Reservierungen: \`tel:\` / \`mailto:\` / \`${f.reservierung_url||'Platzhalter'}\`.

---

## 11. Build-Befehle

\`\`\`bash
# 1. Assets kopieren
cp -r /files/runs/${leadId}/assets/* ./assets/

# 2. Dependencies
npm install

# 3. Build (muss grün sein, keine Fehler/Warnings)
npm run build

# 4. Preview lokal
npm run preview

# 5. Deploy (optional)
# vercel deploy --prod  (privat, domain nicht indexiert)
\`\`\`

---

## 12. Qualitäts-Checkliste (vor Abgabe abhaken)

${[
  '[ ] `npm run build` läuft fehlerfrei durch',
  '[ ] Mobile (390px): Layout korrekt, Text lesbar, CTAs klickbar',
  '[ ] Tablet (768px): sauber',
  '[ ] Desktop (1280px): volle Breite, keine Overflow-Fehler',
  '[ ] `<meta name="robots" content="noindex">` in index.html vorhanden',
  '[ ] Demo-Notice-Banner sichtbar (oben, nicht wegklickbar)',
  `[ ] Keine erfundenen Fakten (insb.: ${doNotInvent.join(', ')||'Öffnungszeiten, Preise'})`,
  '[ ] Alle CTAs funktional (tel:, mailto:, Anker)',
  '[ ] Alle verwendeten Bilder aus /assets/ (keine externen URLs)',
  '[ ] Design entspricht Direction-Tokens (Farben, Fonts korrekt)',
  '[ ] NAP (Name/Adresse/Telefon) auf mindestens 2 Sektionen sichtbar',
  '[ ] Hero hat CTA above-the-fold',
  '[ ] Keine generischen Stock-Texte (Lorem ipsum, Placeholder benennen)',
].join('\n')}

---

## 13. Post-Build-Tests

1. **Lighthouse Mobile** (Chrome DevTools): Ziel ≥ 90 Performance, ≥ 90 SEO, ≥ 90 Best Practices
   (Das ist die NORMALE Qualitätsskala — nicht die inverse A1-Score-Skala)
2. **noindex-Check:** `curl -s <URL> | grep -i noindex` → muss treffen
3. **CTA-Test:** jeden Link klicken — kein 404, kein totes Backend
4. **Visual-Check:** Seite neben Konzept halten → Direction erkennbar?
5. **Fakten-Check:** alle angezeigten Daten gegen content.json abgleichen

---

## 14. Erwarteter Output

Ein lauffähiges React+Vite Projekt mit:
- Vollständiger Dateistruktur (siehe Abschnitt 3)
- Alle Sektionen mit echten Inhalten (nicht "Lorem ipsum")
- Design entspricht \`${pos.design_direction}\`
- Alle rechtlichen Anforderungen erfüllt (noindex, demo_notice)
- Bereit für \`vercel deploy --prod\` (privat, noindex)

**Gib am Ende aus:**
\`\`\`
BUILD COMPLETE
Files: [Anzahl]
Sektionen: [Liste der IDs]
Assets verwendet: [Anzahl]
Lighthouse: Performance [X] | SEO [Y] | Best-Practices [Z]
\`\`\`
`;

// ---- claude_prompt.json aufbauen ----
const promptJson = {
  schema_version: '2.0',
  agent:          'prompt_builder',
  lead_id:        leadId,
  generated_at:   new Date().toISOString(),
  build_prompt:   md,
  tech_stack: {
    framework:    'React + Vite',
    build_tool:   'Vite',
    styling:      'Tailwind CSS + CSS Custom Properties',
    node_version: 'LTS (22+)',
  },
  file_structure: [
    'src/App.jsx','src/main.jsx',
    'src/components/Header.jsx','src/components/Hero.jsx','src/components/About.jsx',
    'src/components/MenuHighlights.jsx','src/components/Gallery.jsx',
    'src/components/OpeningHours.jsx','src/components/Location.jsx',
    'src/components/CTA.jsx','src/components/DemoNotice.jsx','src/components/Footer.jsx',
    'src/data/siteData.js','src/styles/globals.css',
    'assets/','index.html','vite.config.js','package.json','tailwind.config.js',
  ],
  input_files: [
    `/files/runs/${leadId}/concept.json`,
    `/files/runs/${leadId}/content.json`,
    `/files/runs/${leadId}/images.json`,
  ],
  asset_paths:   uniqueAssets,
  sections_spec: secs.map(s=>({id:s.id, order:s.order, layout:s.layout, assets:s.assets_used||[]})),
  design_system: { css_custom_properties: cssTokens, colors, typography: typo, spacing, effects },
  copy_blocks:   copy,
  rules: [
    'DO NOT invent: ' + (doNotInvent.join(', ')||'Öffnungszeiten, Preise, Menü-Items'),
    'Use ONLY provided local assets from /assets/',
    'Build mobile-first (390px primary breakpoint)',
    'All CTAs: tel:, mailto:, anchor-links only — no real backends',
    'noindex meta required in index.html',
    'Demo-notice banner required (visible, not dismissable)',
    `Design direction: ${pos.design_direction} — NOT generic template`,
  ],
  do_not_invent: doNotInvent,
  demo_notice: { required: true, text: demoText },
  noindex_required: true,
  build_commands: [
    `cp -r /files/runs/${leadId}/assets/* ./assets/`,
    'npm install',
    'npm run build',
  ],
  quality_checklist: [
    'npm run build exits 0',
    'Mobile 390px: layout correct, CTAs clickable',
    'noindex meta present in index.html',
    'Demo-notice banner visible',
    `No invented facts (${doNotInvent.join(', ')||'none'})`,
    'All CTAs functional (tel/mailto/anchor)',
    'All images from /assets/ (no hotlinks)',
    'Design matches direction tokens',
    'NAP visible on 2+ sections',
  ],
  post_build_tests: [
    'Lighthouse Mobile: Performance ≥90, SEO ≥90, Best-Practices ≥90 (NORMAL quality scale)',
    'noindex check: curl | grep noindex → match',
    'CTA click test: no 404s, no dead backends',
    'Visual check vs concept.json direction',
    'Facts check: displayed data matches content.json',
  ],
  expected_output: 'Lauffähiges React+Vite Projekt, deploybar auf Vercel (privat/noindex), vollständige Sektionen, echte Inhalte, Direction-konformes Design',
  confidence: Math.max(0.3, 1.0
    - (warnings.includes('asset_missing') ? 0.15 : 0)
    - (warnings.includes('source_missing_content') ? 0.20 : 0)
    - (uniqueAssets.length === 0 ? 0.20 : 0)
    - (secs.length < 4 ? 0.15 : 0)
  ),
  warnings,
  logs: [
    {ts:new Date().toISOString(), step:'assemble', status:'ok',
     sections:secs.length, assets:uniqueAssets.length,
     do_not_invent:doNotInvent.length, prompt_chars:md.length}
  ],
};

// ---- Dateien schreiben ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${leadId}`;
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(`${dir}/CLAUDE_BUILD_PROMPT.md`,  md, 'utf8');
  fs.writeFileSync(`${dir}/claude_prompt.json`, JSON.stringify(promptJson, null, 2), 'utf8');
  promptJson.logs.push({ts:new Date().toISOString(), step:'file_write', status:'ok'});
} catch(e) {
  promptJson.warnings.push('file_write_failed: ' + e.message);
}

return [{json: promptJson}];
