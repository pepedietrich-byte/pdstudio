/**
 * Validate + Finalize — Agent 5
 * Parst LLM-Konzept, finalisiert Design-Tokens, setzt Constraints, schreibt concept.json.
 *
 * Input:
 *   $json                             = Poe LLM HTTP-Response
 *   $('Konzept-Prompt').item.json._sources = alle Quelldaten + Direction-Infos
 */

const src       = $('Konzept-Prompt').item.json._sources || {};
const srcWarn   = $('Konzept-Prompt').item.json.warnings || [];
const leadId    = $('Konzept-Prompt').item.json.lead_id;
const llmResp   = $json;
const warnings  = [...srcWarn];
const logs      = [];

// ---- LLM-Antwort parsen (robust) ----
function parseLLM(resp) {
  try {
    let c = resp?.choices?.[0]?.message?.content || '';
    c = String(c).trim().replace(/^```(?:json)?[\r\n]*/i,'').replace(/[\r\n]*```\s*$/,'').trim();
    const m = c.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : JSON.parse(c);
  } catch(e) { return null; }
}

let concept = parseLLM(llmResp);
if (!concept) {
  warnings.push('llm_concept_failed');
  logs.push({ts:new Date().toISOString(), step:'llm_parse', status:'failed_using_skeleton'});
  // Fallback-Skelett
  concept = {
    positionierung:{ branche_typ: src.a1?.business?.branche || 'Restaurant',
      design_direction: src.directionKey || 'family_friendly_local',
      design_direction_begruendung:'Fallback wegen LLM-Fehler', stimmung:[], zielgruppe:'' },
    design_tokens: src.designTokens || {},
    sections:[
      {id:'hero',order:1,purpose:'Aufmerksamkeit',layout:'full_width_image',assets_used:[],content_ref:[],
       copy:{headline:'Willkommen', subheadline:''},notes:'LLM-Fallback'},
      {id:'about',order:2,purpose:'Über uns',layout:'text_image',assets_used:[],content_ref:[],copy:{},notes:''},
      {id:'cta_reservation',order:8,purpose:'Kontakt/Reservierung',layout:'full_width_cta',assets_used:[],content_ref:[],copy:{},notes:''},
      {id:'demo_notice',order:9,purpose:'Demo-Hinweis',layout:'banner',assets_used:[],content_ref:[],copy:{},notes:'PFLICHT'},
    ],
    copy:{ hero_headline:'', hero_subheadline:'', cta_primary:'Tisch reservieren', cta_secondary:'Speisekarte',
      section_headlines:{}, ueber_uns_neu:'', angebot_bloecke:[], microcopy:{} },
    asset_plan:{ logo:{source:'',placement:'top-left',fallback:'Wortmarke'},
      hero:{source:'',treatment:'dark_overlay',fallback:'Farbverlauf+Logo'},
      gallery:{sources:[],layout:'masonry',min_count:2}, nicht_verwenden:[] },
    improvements_vs_original: src.improvements || [],
    conversion_logic:{ primary_goal:'reservation', cta_placements:['hero','sticky_header','footer'],
      trust_elements:['google_reviews','address','phone'], mobile_priorities:['click_to_call','map'] },
    constraints:{ do_not_invent:[], demo_notice_required:true, noindex_required:true, mobile_first:true },
    confidence:0.3, warnings:[], logs:[],
  };
} else {
  logs.push({ts:new Date().toISOString(), step:'llm_parse', status:'ok'});
}

// ---- Pflichtfelder sicherstellen ----
concept.schema_version = '2.0';
concept.agent          = 'concept_architect';
concept.lead_id        = leadId;
concept.generated_at   = new Date().toISOString();

// Positionierung aus _sources ergänzen wenn LLM fehlt
if (!concept.positionierung) concept.positionierung = {};
concept.positionierung.design_direction = concept.positionierung.design_direction || src.directionKey;
concept.positionierung.design_direction_begruendung = concept.positionierung.design_direction_begruendung || src.directionBegruendung;

// ---- Design-Tokens aus A3-Palette finalisieren ----
// LLM-Tokens + deterministische Überschreibung mit Farbpalette
const srcColors = src.designTokens?.colors || {};
if (!concept.design_tokens) concept.design_tokens = src.designTokens || {};
// A3-Palette hat Vorrang vor LLM-Interpretation
const palette = src.a3?.farbpalette || [];
if (palette.length >= 1) concept.design_tokens.colors = { ...(concept.design_tokens.colors||{}), ...srcColors };
// Font-Defaults aus Catalog falls LLM leer
if (!concept.design_tokens.typography?.font_heading) {
  concept.design_tokens.typography = src.designTokens?.typography || concept.design_tokens.typography;
}

// ---- Demo-Sektion sicherstellen ----
if (!Array.isArray(concept.sections)) concept.sections = [];
const hasDemo = concept.sections.some(s => s.id === 'demo_notice');
if (!hasDemo) {
  concept.sections.push({
    id:'demo_notice', order:99, purpose:'Demo-Hinweis (PFLICHT)',
    layout:'banner', assets_used:[], content_ref:[],
    copy:{text:'Diese Website ist eine Demo-Präsentation und nicht öffentlich zugänglich.'},
    notes:'noindex + Demo-Notice Pflicht'
  });
}

// ---- Constraints setzen (Pflicht) ----
if (!concept.constraints) concept.constraints = {};
concept.constraints.demo_notice_required = true;
concept.constraints.noindex_required     = true;
concept.constraints.mobile_first         = true;
// do_not_invent aus missing_fields ableiten
const existingInvent = concept.constraints.do_not_invent || [];
const derivedInvent  = src.doNotInvent || [];
concept.constraints.do_not_invent = [...new Set([...existingInvent, ...derivedInvent])];

// ---- improvements_vs_original aus A1 anreichern ----
if (!Array.isArray(concept.improvements_vs_original) || !concept.improvements_vs_original.length) {
  concept.improvements_vs_original = src.improvements || [];
}

// ---- Confidence ----
let conf = 0.9;
if (warnings.includes('llm_concept_failed'))      conf -= 0.50;
if (warnings.includes('source_missing_content'))  conf -= 0.20;
if (warnings.includes('source_missing_images'))   conf -= 0.15;
if ((concept.sections || []).length < 4)          conf -= 0.15;
concept.confidence = Math.round(Math.max(0.1, Math.min(1.0, conf)) * 100) / 100;

// ---- Warnings + Logs finalisieren ----
concept.warnings = [...new Set([...warnings, ...(concept.warnings||[])])];
concept.logs = [
  ...(concept.logs||[]), ...logs,
  {ts:new Date().toISOString(), step:'finalize_complete', status:'ok',
   sections: (concept.sections||[]).length, direction: concept.positionierung?.design_direction}
];

// ---- concept.json schreiben ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${leadId}`;
  fs.mkdirSync(dir, {recursive:true});
  // _sources nicht in Datei (zu groß)
  const toWrite = Object.fromEntries(Object.entries(concept).filter(([k])=>k!=='_sources'));
  fs.writeFileSync(`${dir}/concept.json`, JSON.stringify(toWrite, null, 2), 'utf8');
  logs.push({ts:new Date().toISOString(), step:'file_write', status:'ok'});
} catch(e) {
  concept.warnings.push('file_write_failed');
}

// _sources aus Output entfernen
delete concept._sources;
return [{json: concept}];
