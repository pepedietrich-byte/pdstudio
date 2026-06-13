/**
 * Merge & Manifest v2.0
 * Parst LLM-Response, merged mit Roh-Fakten (Roh hat Vorrang),
 * berechnet missing_fields + confidence, schreibt /files/runs/{lead_id}/content.json.
 *
 * Input:
 *   $json                       = Poe LLM HTTP Response
 *   $('Roh-Extraktion1').item.json = deterministisch extrahierte Roh-Fakten
 */

const raw = $('Roh-Extraktion1').item.json;
const rf  = raw.raw_facts || {};
const llmResp = $json;
const warnings = [];
const logs = [];

// ---- LLM-Antwort parsen (robustly) ----
function parseLLM(resp) {
  try {
    let content = resp?.choices?.[0]?.message?.content || '';
    content = String(content).trim()
      .replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/,'').trim();
    // JSON-Objekt aus Antwort extrahieren
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(content);
  } catch (e) { return null; }
}

let llm = parseLLM(llmResp);
if (!llm) {
  warnings.push('llm_json_failed');
  logs.push({ ts: new Date().toISOString(), step: 'llm_parse', status: 'failed_fallback' });
  llm = {};
} else {
  logs.push({ ts: new Date().toISOString(), step: 'llm_parse', status: 'ok' });
}

// ---- Schema v2.0: fakten (Roh hat Vorrang) ----
const fakten = {
  name:            rf.name          || llm.fakten?.name          || raw.business?.name || '',
  adresse:         rf.address       || llm.fakten?.adresse        || raw.business?.address || '',
  telefon:         rf.telephone     || llm.fakten?.telefon        || raw.business?.phone || '',
  email:           rf.email         || llm.fakten?.email          || '',
  oeffnungszeiten: rf.opening_hours || llm.fakten?.oeffnungszeiten || '',
  speisekarte:     (rf.menu_jsonld?.length ? rf.menu_jsonld : (llm.fakten?.speisekarte || [])),
  preise_erkannt:  !!(llm.fakten?.preise_erkannt || (rf.menu_jsonld || []).some(i => i.price)),
  reservierung_url: llm.fakten?.reservierung_url || null,
  lieferdienste:   llm.fakten?.lieferdienste || [],
  socials:         (rf.social?.length ? rf.social.map(s => ({platform: s.platform || 'social', url: s.url}))
                    : (llm.fakten?.socials || [])),
};

// ---- Schema v2.0: interpretation (LLM-Domäne) ----
const interpretation = {
  claim_slogan:  llm.interpretation?.claim_slogan  || llm.identitaet?.claim_slogan  || '',
  ueber_uns:     llm.interpretation?.ueber_uns     || llm.identitaet?.ueber_uns     || '',
  angebot:       llm.interpretation?.angebot       || llm.angebot?.leistungen       || [],
  spezialitaeten: llm.interpretation?.spezialitaeten || llm.angebot?.spezialitaeten || (rf.cuisine || []),
  kueche:        llm.interpretation?.kueche        || llm.angebot?.kueche           || (rf.cuisine || []),
  events:        llm.interpretation?.events        || [],
  catering:      llm.interpretation?.catering      || null,
  atmosphaere:   llm.interpretation?.atmosphaere   || '',
  zielgruppe:    llm.interpretation?.zielgruppe    || '',
  positionierung: llm.interpretation?.positionierung || '',
  tonalitaet: {
    ton:         llm.interpretation?.tonalitaet?.ton  || llm.tonalitaet?.ton  || [],
    beschreibung: llm.interpretation?.tonalitaet?.beschreibung || llm.tonalitaet?.beschreibung || '',
  },
};

// ---- missing_fields berechnen ----
const missing_fields = [];
if (!fakten.oeffnungszeiten)                     missing_fields.push('keine_oeffnungszeiten');
if (!fakten.speisekarte || !fakten.speisekarte.length) missing_fields.push('keine_speisekarte');
if (!fakten.email)                               missing_fields.push('keine_email');
if (!interpretation.ueber_uns)                  missing_fields.push('kein_ueber_uns');
if (!fakten.adresse)                             missing_fields.push('keine_adresse');
if (!fakten.telefon)                             missing_fields.push('kein_telefon');
if (!fakten.socials || !fakten.socials.length)  missing_fields.push('keine_socials');
if (!interpretation.angebot || !interpretation.angebot.length) missing_fields.push('kein_angebot');

// ---- confidence berechnen ----
let conf = 1.0;
if (warnings.includes('llm_json_failed'))        conf -= 0.35;
if (raw.scrape_failed)                           conf -= 0.30;
if (missing_fields.length >= 4)                  conf -= 0.20;
else if (missing_fields.length >= 2)             conf -= 0.10;
conf = Math.round(Math.max(0.1, Math.min(1.0, conf)) * 100) / 100;

// ---- Schema v2.0 Content-Objekt ----
const content = {
  schema_version: '2.0',
  agent:          'text_extractor',
  lead_id:        raw.lead_id,
  source_url:     raw.source_url || raw.business?.website || '',
  crawled_urls:   raw.crawled_urls || [],
  generated_at:   new Date().toISOString(),
  fakten,
  interpretation,
  roh_reserve:    (raw.visible_text || '').slice(0, 5000),
  quellen: {
    json_ld:          !!rf.json_ld_found,
    json_ld_business: !!rf.json_ld_business,
    fliesstext:       true,
    pdf_menu:         false,
  },
  missing_fields,
  confidence: conf,
  warnings,
  logs: [
    ...logs,
    { ts: new Date().toISOString(), step: 'merge_complete', status: 'ok',
      missing_count: missing_fields.length }
  ],
};

// ---- Datei schreiben ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${raw.lead_id}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/content.json`, JSON.stringify(content, null, 2), 'utf8');
} catch (e) {
  content.warnings.push('file_write_failed');
}

return [{ json: content }];
