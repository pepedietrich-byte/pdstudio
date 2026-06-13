/**
 * Merge & Manifest v2.0 — Agent 3
 * Parst Vision-LLM, baut Schema v2.0, speichert Assets nach /files/runs/{lead_id}/assets/,
 * berechnet fehlende_assets + stats + confidence, schreibt images.json.
 *
 * Input:
 *   $json                           = Poe Vision HTTP-Response
 *   $('Bild-Kandidaten').first().json = Kandidaten-Metadaten (lead_id, candidates, ...)
 *   $('Bild laden').all()           = geladene Bild-Items mit Binary-Daten
 */

const candSet   = $('Bild-Kandidaten').first().json;
const visionResp = $json;
const leadId    = candSet.lead_id;
const warnings  = [];
const logs      = [];

// ---- Vision-Antwort parsen ----
function parseLLM(resp) {
  try {
    let c = resp?.choices?.[0]?.message?.content || '';
    c = String(c).trim().replace(/^```(?:json)?[\r\n]*/i,'').replace(/[\r\n]*```\s*$/,'').trim();
    const m = c.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return JSON.parse(c);
  } catch (e) { return null; }
}

let v = parseLLM(visionResp);
if (!v) {
  warnings.push('vision_parse_failed');
  logs.push({ ts: new Date().toISOString(), step: 'vision_parse', status: 'failed' });
  v = {};
} else {
  logs.push({ ts: new Date().toISOString(), step: 'vision_parse', status: 'ok' });
}

const cands = candSet.candidates || [];

// ---- Binary-Map aufbauen (URL → base64 + mime) ----
const urlToBin = {};
try {
  const loadedItems = $('Bild laden').all();
  for (const it of loadedItems) {
    const url = it.json?.url;
    const bin = it.binary?.data;
    if (url && bin?.data) {
      urlToBin[url] = { b64: bin.data, mime: bin.mimeType || 'image/jpeg' };
    }
  }
} catch (e) {
  warnings.push('binary_access_failed');
}
logs.push({ ts: new Date().toISOString(), step: 'binary_map', count: Object.keys(urlToBin).length });

// ---- Logo bestimmen ----
const logoHint  = cands.find(c => c.is_logo_hint) || null;
const logoFromV  = v.logo?.url ? v.logo : null;
const logoUrl    = logoFromV?.url || logoHint?.url || '';
const logo = {
  url:         logoUrl,
  local_path:  '',
  format:      logoUrl.endsWith('.svg') ? 'svg' : 'png',
  width:       logoFromV?.width  || 0,
  height:      logoFromV?.height || 0,
  is_vector:   logoUrl.endsWith('.svg'),
  qualitaet:   logoFromV?.qualitaet || (logoHint ? 'niedrig' : 'keins'),
  begruendung: logoFromV?.begruendung || '',
};

// ---- Hero bestimmen ----
const heroFromV = v.hero?.url ? v.hero : null;
const heroUrl   = heroFromV?.url || '';
const hero = {
  url:           heroUrl,
  local_path:    '',
  width:         heroFromV?.width  || 0,
  height:        heroFromV?.height || 0,
  qualitaet_score: heroFromV?.qualitaet_score || 0,
  begruendung:   heroFromV?.begruendung || '',
};

// ---- Assets Array (v2.0) ----
const bilderLLM = Array.isArray(v.bilder) ? v.bilder : [];
const assets = bilderLLM.map(b => ({
  url:                  b.url || '',
  local_path:           '',
  width:                b.width  || 0,
  height:               b.height || 0,
  file_size:            0,
  mime_type:            '',
  aspect_ratio:         (b.width && b.height) ? Math.round(b.width / b.height * 100) / 100 : 0,
  source_url:           candSet.final_url || '',
  category:             b.kategorie || 'sonstiges',
  quality_score:        b.qualitaet_score || 0,
  usage_recommendation: b.eignung === 'verwenden' ? 'verwenden'
                        : b.eignung === 'mit_vorbehalt' ? 'mit_vorbehalt' : 'nicht_verwenden',
  begruendung:          b.begruendung || '',
}));

const verwendbare = assets.filter(a => a.usage_recommendation !== 'nicht_verwenden');

// ---- Assets wirklich speichern ----
let saved = 0;
try {
  const fs = require('fs');
  const dir = `/files/runs/${leadId}/assets`;
  fs.mkdirSync(dir, { recursive: true });

  const saveAsset = (url, filename, assetObj) => {
    const bin = urlToBin[url];
    if (!bin) return;
    try {
      const ext = bin.mime.includes('svg') ? 'svg'
        : bin.mime.split('/')[1]?.split('+')[0] || 'jpg';
      const finalName = filename.includes('.') ? filename : `${filename}.${ext}`;
      const filepath = `${dir}/${finalName}`;
      fs.writeFileSync(filepath, Buffer.from(bin.b64, 'base64'));
      assetObj.local_path = filepath;
      assetObj.mime_type  = bin.mime;
      saved++;
    } catch (e) { warnings.push('asset_save_failed:' + filename); }
  };

  // Logo
  if (logo.url) saveAsset(logo.url, 'logo', logo);
  // Hero
  if (hero.url && hero.url !== logo.url) saveAsset(hero.url, 'hero', hero);
  // Gallery
  let gIdx = 0;
  for (const a of verwendbare) {
    if (a.url === logo.url || a.url === hero.url) continue;
    gIdx++;
    saveAsset(a.url, `gallery_${String(gIdx).padStart(2,'0')}`, a);
  }
  logs.push({ ts: new Date().toISOString(), step: 'asset_save', saved });
} catch (e) {
  warnings.push('asset_save_failed');
}

// ---- fehlende_assets ----
const fehlende = [];
const cats = bilderLLM.map(b => b.kategorie || '');
if (!hero.url)                                         fehlende.push('kein_gutes_hero');
if (logo.qualitaet === 'keins')                        fehlende.push('logo_nur_favicon');
if (!cats.includes('food'))                            fehlende.push('keine_food_bilder');
if (!cats.some(c => c === 'interieur'))                fehlende.push('keine_innenraum_bilder');
if (!cats.includes('team'))                            fehlende.push('keine_team_bilder');
if (verwendbare.length > 0 && verwendbare.every(a => (a.width || 0) < 600)) fehlende.push('bilder_zu_klein');
if (bilderLLM.filter(b => b.qualitaet_score < 30).length > bilderLLM.length / 2) fehlende.push('viele_unscharf');

// ---- Stats ----
const stats = {
  kandidaten_gesamt: candSet.candidates_total || cands.length,
  geladen:           Object.keys(urlToBin).length,
  verwendbar:        verwendbare.length,
  gespeichert:       saved,
};

// ---- Confidence ----
let conf = 1.0;
if (warnings.includes('vision_parse_failed'))   conf -= 0.40;
if (warnings.includes('asset_save_failed'))     conf -= 0.20;
if (stats.geladen === 0)                        conf -= 0.30;
if (stats.verwendbar === 0)                     conf -= 0.20;
conf = Math.round(Math.max(0.1, Math.min(1.0, conf)) * 100) / 100;

// ---- Schema v2.0 ----
const manifest = {
  schema_version: '2.0',
  agent:          'image_extractor',
  lead_id:        leadId,
  source_url:     candSet.final_url || '',
  crawled_urls:   [],
  generated_at:   new Date().toISOString(),
  logo,
  hero,
  assets,
  farbpalette:    Array.isArray(v.farbpalette) ? v.farbpalette : [],
  bild_stil:      v.bild_stil    || '',
  konzept_text:   v.konzept_text || '',
  empfehlung_agent5: v.empfehlung_agent4 || v.empfehlung_agent5 || '',
  fehlende_assets: fehlende,
  stats,
  confidence: conf,
  warnings,
  logs: [...logs, { ts: new Date().toISOString(), step: 'manifest_complete', status: 'ok' }],
};

// ---- images.json schreiben ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${leadId}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/images.json`, JSON.stringify(manifest, null, 2), 'utf8');
} catch (e) {
  manifest.warnings.push('file_write_failed');
}

return [{ json: manifest }];
