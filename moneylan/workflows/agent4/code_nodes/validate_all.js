/**
 * Validierung — alle Regeln (Vollständigkeit + Konsistenz + Validität + Build-Risiko)
 * Lädt die drei Quell-Manifeste aus /files/runs/{lead_id}/ (fs) oder Sheet-Row-Daten.
 * Gibt komplettes Validierungsobjekt zurück (ohne Gate-Entscheidung).
 *
 * Input:
 *   $json = { lead_id, score, business: {...} }  (aus LEADS-Sheet-Row gemapped)
 */

const leadId    = $json.lead_id;
const sheetLead = $json;          // Sheets-Daten als Fallback
const checks    = [];
const conflicts = [];
const warnings  = [];
const logs      = [];
let   a1 = null, a2 = null, a3 = null;

// ---- Quellen laden ----
function loadJson(path) {
  const fs = require('fs');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

try {
  a1 = loadJson(`/files/runs/${leadId}/lead.json`);
  logs.push({ ts: new Date().toISOString(), step: 'load_a1', status: 'ok' });
} catch (e) {
  warnings.push('source_missing_lead');
  // Fallback: Sheets-Daten
  a1 = {
    business: {
      name:                 sheetLead.name    || null,
      website:              sheetLead.website || null,
      phone:                sheetLead.phone   || null,
      address:              sheetLead.address || null,
      email_guess:          null,
      google_rating:        sheetLead.google_rating  ? Number(sheetLead.google_rating)  : null,
      google_reviews_count: sheetLead.google_reviews ? Number(sheetLead.google_reviews) : null,
      maps_url: null,
    },
    audit_technical: { https: null, has_phone_link: false, psi_performance_mobile: null },
    score:      Number(sheetLead.score || 0),
    confidence: Number(sheetLead.confidence || 0),
  };
}

try {
  a2 = loadJson(`/files/runs/${leadId}/content.json`);
  logs.push({ ts: new Date().toISOString(), step: 'load_a2', status: 'ok' });
} catch (e) {
  warnings.push('source_missing_content');
  // Fallback: leere Struktur (alle Checks werden failen)
  a2 = { fakten: {}, interpretation: {}, missing_fields: ['alle_fehlend'], confidence: 0 };
}

try {
  a3 = loadJson(`/files/runs/${leadId}/images.json`);
  logs.push({ ts: new Date().toISOString(), step: 'load_a3', status: 'ok' });
} catch (e) {
  warnings.push('source_missing_images');
  a3 = { logo: { qualitaet: 'keins' }, hero: {}, assets: [], fehlende_assets: [], confidence: 0 };
}

// ---- Helferfunktionen ----
function check(id, dim, field, passed, severity, detail) {
  checks.push({ id, dimension: dim, field, passed, severity, detail: detail || '' });
  return passed;
}

function normAddr(s) {
  return String(s || '').toLowerCase()
    .replace(/straße/g,'str.').replace(/strasse/g,'str.')
    .replace(/\s+/g,' ').trim();
}

const b  = a1.business || {};
const at = a1.audit_technical || {};
const f  = a2.fakten          || {};
const it = a2.interpretation  || {};

const usableAssets = (a3.assets || []).filter(a => a.usage_recommendation !== 'nicht_verwenden');

// ================================================================
// 5a. VOLLSTÄNDIGKEIT
// ================================================================

// c_name
check('c_name', 'completeness', 'name',
  !!(b.name || f.name),
  'blocker', !b.name && !f.name ? 'Name fehlt in A1 und A2' : '');

// c_website
const websiteUrl = b.website || '';
const websiteOk  = /^https?:\/\/.+\..+/.test(websiteUrl);
check('c_website', 'completeness', 'website', websiteOk, 'blocker',
  !websiteOk ? `Kein valides Website-URL: "${websiteUrl}"` : '');

// c_address
check('c_address', 'completeness', 'adresse',
  !!(b.address || f.adresse),
  'blocker', !b.address && !f.adresse ? 'Adresse fehlt in A1 und A2' : '');

// c_contact
const hasContact = !!(f.telefon || b.phone || f.email || f.reservierung_url);
check('c_contact', 'completeness', 'telefon_email_reservierung', hasContact, 'blocker',
  !hasContact ? 'Kein Kontakt: weder Telefon, E-Mail noch Reservierungs-URL' : '');

// c_hours
check('c_hours', 'completeness', 'oeffnungszeiten',
  !!f.oeffnungszeiten,
  'major', !f.oeffnungszeiten ? 'Öffnungszeiten fehlen in A2' : '');

// c_offer
const speisekarte = Array.isArray(f.speisekarte) ? f.speisekarte : [];
const angebot     = Array.isArray(it.angebot)    ? it.angebot    : [];
const offerCount  = speisekarte.length + angebot.length;
check('c_offer', 'completeness', 'angebot_speisekarte',
  offerCount >= 2,
  'blocker', offerCount < 2 ? `Zu wenig Angebot: nur ${offerCount} Einträge` : '');

// c_logo
const hasUsableLogo = a3.logo?.qualitaet && a3.logo.qualitaet !== 'keins';
check('c_logo', 'completeness', 'logo',
  hasUsableLogo,
  'major', !hasUsableLogo ? 'Kein nutzbares Logo — Ersatzstrategie erforderlich' : '');

// c_hero
const hasHero = !!(a3.hero?.url);
check('c_hero', 'completeness', 'hero',
  hasHero,
  'major', !hasHero ? 'Kein Hero-Bild — Ersatzstrategie erforderlich' : '');

// c_usable_assets
check('c_usable_assets', 'completeness', 'assets_verwendbar',
  usableAssets.length >= 2,
  'major', usableAssets.length < 2 ? `Nur ${usableAssets.length} verwendbare Bilder` : '');

// c_about
check('c_about', 'completeness', 'ueber_uns',
  !!it.ueber_uns,
  'minor', !it.ueber_uns ? 'Kein Über-uns-Text in A2' : '');

// ================================================================
// 5b. KONSISTENZ (Cross-Source)
// ================================================================

function addrConflict(a, b2) {
  if (!a || !b2) return false;
  const na = normAddr(a), nb = normAddr(b2);
  if (!na || !nb) return false;
  // PLZ vergleichen — sicherste Methode
  const plzA = (na.match(/\b\d{5}\b/) || [])[0];
  const plzB = (nb.match(/\b\d{5}\b/) || [])[0];
  if (plzA && plzB && plzA !== plzB) return true;
  return false;
}

// k_address
const addrConfl = addrConflict(b.address, f.adresse);
if (addrConfl) {
  conflicts.push({ field: 'adresse', source_a: 'google_a1', value_a: b.address,
    source_b: 'website_a2', value_b: f.adresse,
    resolution: 'Website-Adresse bevorzugt (aktueller)', severity: 'major' });
}
check('k_address', 'consistency', 'adresse', !addrConfl, 'major',
  addrConfl ? `PLZ-Konflikt: Google="${b.address}" vs Website="${f.adresse}"` : '');

// k_phone
const phone_a1 = String(b.phone  || '').replace(/\D/g,'');
const phone_a2 = String(f.telefon|| '').replace(/\D/g,'');
const phoneConfl = phone_a1 && phone_a2 && phone_a1 !== phone_a2
  && phone_a1.slice(-6) !== phone_a2.slice(-6); // letzte 6 Ziffern als Fingerprint
if (phoneConfl) conflicts.push({ field: 'telefon', source_a: 'google_a1', value_a: b.phone,
  source_b: 'website_a2', value_b: f.telefon,
  resolution: 'Beide vermerkt, Website hat Vorrang', severity: 'minor' });
check('k_phone', 'consistency', 'telefon', !phoneConfl, 'minor',
  phoneConfl ? `Telefon-Konflikt: A1="${b.phone}" vs A2="${f.telefon}"` : '');

// k_name
const nameConfl = b.name && f.name
  && b.name.toLowerCase().trim() !== f.name.toLowerCase().trim()
  && !b.name.toLowerCase().includes(f.name.toLowerCase().replace(/[^a-zäöüß]/g,'').slice(0,6));
if (nameConfl) conflicts.push({ field: 'name', source_a: 'google_a1', value_a: b.name,
  source_b: 'website_a2', value_b: f.name,
  resolution: 'Google-Name bevorzugt (registrierter Markenname)', severity: 'minor' });
check('k_name', 'consistency', 'name', !nameConfl, 'minor',
  nameConfl ? `Name-Konflikt: A1="${b.name}" vs A2="${f.name}"` : '');

// ================================================================
// 5c. VALIDITÄT
// ================================================================

// v_url
const urlValid = /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(websiteUrl);
check('v_url', 'validity', 'website_url', urlValid, 'blocker',
  !urlValid ? `URL nicht wohlgeformt: "${websiteUrl}"` : '');

// v_email
const emailVal = !f.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
check('v_email', 'validity', 'email', emailVal, 'minor',
  !emailVal ? `E-Mail-Format ungültig: "${f.email}"` : '');

// v_phone
const phone    = f.telefon || b.phone || '';
const phoneVal = !phone || /[\d]{6,}/.test(String(phone).replace(/[\s\-\/\(\)\+]/g,''));
check('v_phone', 'validity', 'telefon', phoneVal, 'minor',
  !phoneVal ? `Telefonnummer unplausibel: "${phone}"` : '');

// v_score
const scoreVal = typeof a1.score === 'number' && a1.score >= 0 && a1.score <= 100;
check('v_score', 'validity', 'a1_score', scoreVal, 'minor',
  !scoreVal ? `A1-Score außerhalb 0–100: ${a1.score}` : '');

// ================================================================
// Dimensionen-Scores (gewichtet)
// ================================================================
function dimScore(dim) {
  const dimChecks = checks.filter(c => c.dimension === dim);
  if (!dimChecks.length) return 100;
  const weights = { blocker: 3, major: 2, minor: 1 };
  const total  = dimChecks.reduce((s,c) => s + (weights[c.severity] || 1), 0);
  const passed = dimChecks.filter(c => c.passed).reduce((s,c) => s + (weights[c.severity] || 1), 0);
  return Math.round(passed / total * 100);
}

const dimensions = {
  completeness: dimScore('completeness'),
  consistency:  dimScore('consistency'),
  validity:     dimScore('validity'),
};
const dataQualityScore = Math.round(
  dimensions.completeness * 0.5 + dimensions.consistency * 0.25 + dimensions.validity * 0.25
);

// ================================================================
// 6. Build-Risiko
// ================================================================
const riskReasons = [];
let   riskLevel   = 'low';

if (!hasHero)               riskReasons.push('Kein Hero-Bild vorhanden');
if (usableAssets.length < 3)riskReasons.push(`Nur ${usableAssets.length} verwendbare Bilder (< 3)`);
if (!it.ueber_uns)          riskReasons.push('Kein Über-uns-Text');
if (speisekarte.length === 0 && angebot.length < 2) riskReasons.push('Kein Angebot/Speisekarte');
if (!f.oeffnungszeiten)     riskReasons.push('Keine Öffnungszeiten');
if ((it.spezialitaeten || []).length === 0 && (it.kueche || []).length === 0)
  riskReasons.push('Keine Spezialitäten/Küche erkannt');

if (riskReasons.length >= 4)      riskLevel = 'high';
else if (riskReasons.length >= 2) riskLevel = 'medium';

const buildRisk = {
  level:           riskLevel,
  would_be_generic: riskLevel === 'high',
  reasons:         riskReasons,
};

// ================================================================
// Missing (kritisch vs. optional)
// ================================================================
const missingCritical = [];
const missingOptional = [];

checks.filter(c => !c.passed).forEach(c => {
  const entry = `${c.id}: ${c.detail}`;
  if (c.severity === 'blocker') missingCritical.push(entry);
  else missingOptional.push(entry);
});

// ================================================================
// Ersatzstrategie-Katalog
// ================================================================
const ersatzstrategie = [];
if (!hasUsableLogo) ersatzstrategie.push('Kein Logo → Wortmarke aus Betriebsname (Typografie), oder Favicon hochskaliert');
if (!hasHero)       ersatzstrategie.push('Kein Hero → Vollflächen-Farbverlauf in Markenfarben + Logo + Claim-Text');
if (usableAssets.length < 2) ersatzstrategie.push('Zu wenig Bilder → Farbblöcke + Icon-Stil + Textschwerpunkt');
if (!f.oeffnungszeiten)      ersatzstrategie.push('Keine Öffnungszeiten → Demo zeigt Platzhalter + Hinweis im Übergabegespräch');

// ================================================================
// Confidence
// ================================================================
let conf = 1.0;
if (warnings.includes('source_missing_lead'))    conf -= 0.40;
if (warnings.includes('source_missing_content')) conf -= 0.30;
if (warnings.includes('source_missing_images'))  conf -= 0.20;
conf = Math.round(Math.max(0.1, Math.min(1.0, conf)) * 100) / 100;

return [{
  json: {
    lead_id:         leadId,
    dimensions,
    data_quality_score: dataQualityScore,
    checks,
    conflicts,
    missing_critical: missingCritical,
    missing_optional: missingOptional,
    build_risk:      buildRisk,
    ersatzstrategie,
    confidence:      conf,
    warnings,
    logs,
    // Quell-Daten für Gate-Node durchreichen
    _sources: { a1, a2, a3 },
  }
}];
