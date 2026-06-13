/**
 * Load Sources + Positionierung + Design-Direction + LLM-Payload vorbereiten
 * Liest alle 4 Quell-JSONs, bestimmt deterministisch Branche/Direction/Tokens,
 * und baut den vollständigen LLM-Payload.
 *
 * Input: $json = { lead_id, score, ... } (aus VALIDATION-Sheet-Row)
 */

const leadId = $json.lead_id;
const warnings = [];

// ---- Quellen laden ----
function loadJson(path) {
  const fs = require('fs');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

let a1 = {}, a2 = {}, a3 = {}, a4 = {};
try { a1 = loadJson(`/files/runs/${leadId}/lead.json`);       } catch(e) { warnings.push('source_missing_lead'); }
try { a2 = loadJson(`/files/runs/${leadId}/content.json`);    } catch(e) { warnings.push('source_missing_content'); }
try { a3 = loadJson(`/files/runs/${leadId}/images.json`);     } catch(e) { warnings.push('source_missing_images'); }
try { a4 = loadJson(`/files/runs/${leadId}/validation.json`); } catch(e) { warnings.push('source_missing_validation'); }

const b    = a1.business        || {};
const f    = a2.fakten           || {};
const it   = a2.interpretation   || {};
const imgs = a3;
const val  = a4;

// ---- Design-Direction-Katalog ----
const CATALOG = {
  modern_warm_cafe: {
    trigger: s => /café|kaffee|brunch|bäckerei|kuchen|coffee|bistro/i.test(s),
    stimmung: ['warm','einladend','gemütlich','hell'],
    colors: { primary:'#C8956C', secondary:'#F5E6D3', accent:'#8B5E3C',
               background:'#FFFDF8', surface:'#FFF8F0', text:'#2C1810', text_muted:'#8A7060' },
    font_heading:'Playfair Display', font_body:'Lato',
  },
  dark_premium_steakhouse: {
    trigger: s => /steak|grill|fine.?dining|premium|edel|bar.?&.?grill/i.test(s),
    stimmung: ['dunkel','edel','moody','exklusiv'],
    colors: { primary:'#C9A84C', secondary:'#1A1A1A', accent:'#8B0000',
               background:'#0D0D0D', surface:'#1A1A1A', text:'#F5F5F0', text_muted:'#A0A0A0' },
    font_heading:'Cormorant Garamond', font_body:'Montserrat',
  },
  bright_minimal_brunch: {
    trigger: s => /brunch|bowl|smoothie|vegan|vegetarisch|gesund|organic/i.test(s),
    stimmung: ['hell','clean','modern','frisch'],
    colors: { primary:'#4A9B6F', secondary:'#F0FFF4', accent:'#FF6B6B',
               background:'#FFFFFF', surface:'#F8FFFE', text:'#1A2B1A', text_muted:'#6B7F6B' },
    font_heading:'DM Sans', font_body:'DM Sans',
  },
  traditional_german: {
    trigger: s => /gasthaus|gasthof|deutsch|bayerisch|thüring|sächsisch|schnitzel|bratwurst/i.test(s),
    stimmung: ['bodenständig','warm','traditionell','gemütlich'],
    colors: { primary:'#8B4513', secondary:'#FFF8DC', accent:'#228B22',
               background:'#FFFEF5', surface:'#FFF8E8', text:'#2C1A0E', text_muted:'#7A6040' },
    font_heading:'Merriweather', font_body:'Source Serif 4',
  },
  urban_neon_bar: {
    trigger: s => /bar|cocktail|lounge|nachtleben|club|szene/i.test(s),
    stimmung: ['dunkel','urban','stylish','energetisch'],
    colors: { primary:'#FF00FF', secondary:'#0D0D1A', accent:'#00FFCC',
               background:'#05050F', surface:'#0D0D1A', text:'#F0F0FF', text_muted:'#8888BB' },
    font_heading:'Space Grotesk', font_body:'Inter',
  },
  family_friendly_local: {
    trigger: s => /familien|pizza|pasta|imbiss|schnell|günstig|kinder/i.test(s),
    stimmung: ['freundlich','zugänglich','farbig','einladend'],
    colors: { primary:'#E85D04', secondary:'#FFF3E0', accent:'#388E3C',
               background:'#FFFEF9', surface:'#FFF8F0', text:'#1A1200', text_muted:'#7A6030' },
    font_heading:'Nunito', font_body:'Open Sans',
  },
  mediterranean_fresh: {
    trigger: s => /italienisch|griechisch|spanisch|mediterran|pizza|pasta|tapas|mezze/i.test(s),
    stimmung: ['warm','mediterran','lebendig','frisch'],
    colors: { primary:'#C0763B', secondary:'#FFF5EC', accent:'#4A7C59',
               background:'#FFFDF8', surface:'#FFF8F0', text:'#2A1800', text_muted:'#7A5540' },
    font_heading:'Cormorant Garamond', font_body:'Raleway',
  },
};

// ---- Direction bestimmen ----
const cuisineStr = [
  b.branche || '', it.kueche?.join(' ') || '', it.spezialitaeten?.join(' ') || '',
  it.atmosphaere || '', it.positionierung || '', a2.interpretation?.tonalitaet?.beschreibung || ''
].join(' ');

let directionKey = 'family_friendly_local'; // Fallback
let directionBegruendung = 'Standard-Fallback (keine eindeutige Zuordnung möglich)';
for (const [key, dir] of Object.entries(CATALOG)) {
  if (dir.trigger(cuisineStr)) {
    directionKey = key;
    directionBegruendung = `Erkannt: "${key}" basierend auf Küche/Atmosphäre: "${cuisineStr.slice(0,80)}"`;
    break;
  }
}
const dir = CATALOG[directionKey];

// ---- Design-Tokens: A3-Palette überschreibt Catalog-Defaults ----
const palette = imgs.farbpalette || [];
const colors = { ...dir.colors };
if (palette.length >= 1) colors.primary   = palette[0];
if (palette.length >= 2) colors.secondary = palette[1];
if (palette.length >= 3) colors.accent    = palette[2];

// Einfacher WCAG-Kontrast-Check (Luminanz-Näherung)
function hexLum(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b2= parseInt(hex.slice(5,7),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b2;
}
function contrastOk(fg, bg) {
  try {
    const lf = hexLum(fg), lb = hexLum(bg);
    const ratio = (Math.max(lf,lb)+0.05)/(Math.min(lf,lb)+0.05);
    return ratio >= 4.5;
  } catch(e) { return true; }
}
if (!contrastOk(colors.text, colors.background)) {
  colors.text = colors.background < '#888888' ? '#FFFFFF' : '#111111';
  warnings.push('contrast_adjusted');
}

const designTokens = {
  colors,
  typography: {
    font_heading: dir.font_heading, font_body: dir.font_body,
    scale: { h1:'3rem', h2:'2rem', h3:'1.375rem', body:'1rem', small:'0.875rem' },
    weights: { heading:700, body:400 },
  },
  spacing: { section_y:'5rem', container_max:'1200px', radius:'0.5rem', gap:'1.5rem' },
  effects: { shadow:'0 4px 24px rgba(0,0,0,0.10)', overlay:'rgba(0,0,0,0.45)', transition:'all 0.25s ease' },
};

// ---- improvements_vs_original aus A1-Audit ableiten ----
const audit = a1.audit_technical || {};
const improvements = a1.verkaufsargumente || [];
if (!audit.https)             improvements.push('HTTPS-Verschlüsselung (neu)');
if (!audit.mobile_friendly)   improvements.push('Mobile-first Design');
if (!audit.has_schema_jsonld)  improvements.push('Schema.org-Markup für Google');
if (!audit.has_impressum)      improvements.push('Korrektes Impressum + Datenschutz');

// ---- do_not_invent aus missing_fields ableiten ----
const missing = a2.missing_fields || [];
const doNotInvent = [];
if (missing.includes('keine_oeffnungszeiten')) doNotInvent.push('Öffnungszeiten (fehlen, nicht erfinden)');
if (missing.includes('keine_speisekarte'))     doNotInvent.push('Menü-Preise (fehlen, nicht erfinden)');
if (missing.includes('keine_email'))           doNotInvent.push('E-Mail-Adresse (fehlen, nicht erfinden)');

// ---- LLM-Prompt bauen ----
const systemPrompt = `Du bist ein erfahrener Webdesign-Stratege und Conversion-Experte für lokale Restaurants/Cafés in Deutschland (2026).
Du bekommst alle Daten eines Betriebs und baust daraus ein vollständiges, konkretes Website-Konzept als striktes JSON.

RULES:
- Antworte AUSSCHLIESSLICH mit validem JSON, kein Markdown, keine Erklärungen
- Fakten aus "fakten" NIEMALS erfinden oder ändern — nur übernehmen
- Copy (Headline, Über-uns) NEU formulieren, nicht 1:1 kopieren
- Sektionen mit fehlenden Assets: Ersatzstrategie nutzen, nicht weglassen
- design_direction_begruendung MUSS den Betrieb konkret nennen
- Immer: demo_notice_required=true, noindex_required=true, mobile_first=true

JSON-SCHEMA (exakt diese Struktur):
${JSON.stringify({
  schema_version:"2.0", agent:"concept_architect", lead_id:leadId, generated_at:"ISO",
  positionierung:{ branche_typ:"", design_direction:"", design_direction_begruendung:"", stimmung:[], zielgruppe:"" },
  design_tokens:designTokens,
  sections:[{ id:"hero", order:1, purpose:"", layout:"", assets_used:[], content_ref:[], copy:{}, notes:"" }],
  copy:{ hero_headline:"", hero_subheadline:"", cta_primary:"", cta_secondary:"", section_headlines:{}, ueber_uns_neu:"", angebot_bloecke:[], microcopy:{} },
  asset_plan:{ logo:{source:"",placement:"",fallback:""}, hero:{source:"",treatment:"",fallback:""}, gallery:{sources:[],layout:"",min_count:0}, nicht_verwenden:[] },
  improvements_vs_original:[],
  conversion_logic:{ primary_goal:"", cta_placements:[], trust_elements:[], mobile_priorities:[] },
  constraints:{ do_not_invent:[], demo_notice_required:true, noindex_required:true, mobile_first:true },
  confidence:0.95, warnings:[], logs:[]
}, null, 2)}`;

const userMsg = `BETRIEB: ${b.name || 'Unbekannt'} | ${b.branche || ''} | ${b.address || ''}
WEBSITE ORIGINAL: ${b.website || ''}
A1-SCORE: ${a1.score} (hoch=schlechte Original-Seite=gute Verkaufschance)
VERKAUFSARGUMENTE GEGEN ORIGINAL: ${improvements.slice(0,5).join(' | ')}

FAKTEN (NICHT ERFINDEN):
Telefon: ${f.telefon || b.phone || 'fehlt'}
E-Mail: ${f.email || 'fehlt'}
Adresse: ${f.adresse || b.address || 'fehlt'}
Öffnungszeiten: ${f.oeffnungszeiten || 'fehlt'}
Reservierung: ${f.reservierung_url || 'keine URL'}
Speisekarte: ${JSON.stringify((f.speisekarte||[]).slice(0,10))}

INTERPRETATION (LLM darf formulieren):
Über-uns: ${it.ueber_uns || 'fehlt'}
Angebot: ${(it.angebot||[]).join(', ') || 'fehlt'}
Spezialitäten: ${(it.spezialitaeten||[]).join(', ') || 'fehlt'}
Küche: ${(it.kueche||[]).join(', ') || 'fehlt'}
Atmosphäre: ${it.atmosphaere || 'fehlt'}
Zielgruppe: ${it.zielgruppe || 'fehlt'}
Tonalität: ${it.tonalitaet?.beschreibung || 'fehlt'}

BILDER:
Logo: ${imgs.logo?.url || 'fehlt'} (Qualität: ${imgs.logo?.qualitaet || '?'})
Hero: ${imgs.hero?.url || 'fehlt'}
Galerie verwendbar: ${(imgs.assets||[]).filter(a=>a.usage_recommendation==='verwenden').length} Bilder
Fehlende Assets: ${(imgs.fehlende_assets||[]).join(', ') || 'keine'}
Farbpalette: ${(imgs.farbpalette||[]).join(', ') || 'nicht erkannt'}
Bildstil: ${imgs.bild_stil || 'nicht erkannt'}
Ersatzstrategien (A4): ${(val.ersatzstrategie||[]).join(' | ') || 'keine'}

DESIGN-DIRECTION VORAUSWAHL: ${directionKey}
Begründung: ${directionBegruendung}
Vorgeschlagene Tokens: ${JSON.stringify(designTokens.colors)}

DO-NOT-INVENT: ${doNotInvent.join(', ') || 'keine'}

Baue jetzt das vollständige Website-Konzept. Pflicht-Sektionen: hero, trust_bar, about, menu_highlights, gallery, opening_hours, location_map, cta_reservation. Nutze Ersatzstrategien statt Sektionen wegzulassen. Formuliere Copy neu und benefit-orientiert.`;

return [{json:{
  lead_id: leadId,
  llm_payload: {
    model:'Claude-Sonnet-4.6', temperature:0, max_tokens:4000,
    messages:[
      {role:'system', content:systemPrompt},
      {role:'user',   content:userMsg}
    ]
  },
  // Alle Quell-Daten für den Finalize-Node durchreichen
  _sources:{ a1, a2, a3, a4, directionKey, directionBegruendung, designTokens, improvements, doNotInvent },
  warnings,
}}];
