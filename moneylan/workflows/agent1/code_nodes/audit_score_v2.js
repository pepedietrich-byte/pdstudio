/**
 * Audit & Score v2
 * Kombiniert: technisches HTML-Audit + visuelle Bewertung (Vision-LLM) + Scoring (5a+5b+5c)
 * Output: vollständiges Schema v2.0 Lead-Objekt
 *
 * Input:
 *   $json                              = Poe-Vision HTTP-Response (kann Fehler sein)
 *   $('PSI + Vision-Prep').first().json   = { business, html, final_url, fetch_ok, http_status, psi, warnings, screenshot_* }
 */

const prep     = $('PSI + Vision-Prep').first().json;
const business = prep.business || {};
const html     = prep.html || '';
const finalUrl = prep.final_url || '';
const fetchOk  = prep.fetch_ok !== false;
const httpStatus = prep.http_status ?? null;
const psi      = prep.psi || {};
const warnings = Array.isArray(prep.warnings) ? [...prep.warnings] : [];

// ---- Parse Vision-Response ----
let av = null;
const visionContent = $json?.choices?.[0]?.message?.content
  || $json?.choices?.[0]?.message?.text
  || '';

if (visionContent) {
  try {
    const cleaned  = String(visionContent).replace(/```json?/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) av = JSON.parse(jsonMatch[0]);
  } catch (_) {
    warnings.push('vision_parse_failed');
  }
}
if (!av || typeof av !== 'object') {
  warnings.push('vision_parse_failed');
  av = {};
}

const auditVisual = {
  screenshot_desktop_url:  prep.screenshot_desktop_b64 ? 'psi_base64' : null,
  screenshot_mobile_url:   prep.screenshot_mobile_b64  ? 'psi_base64' : null,
  above_the_fold_score:    av.above_the_fold_score    ?? null,
  hero_present:            av.hero_present             ?? null,
  hero_quality:            av.hero_quality             ?? null,
  cta_above_fold:          av.cta_above_fold           ?? null,
  cta_text_found:          av.cta_text_found           || [],
  visual_modernity_score:  av.visual_modernity_score   ?? null,
  vs_modern_benchmark:     av.vs_modern_benchmark      || null,
  visual_findings:         av.visual_findings          || [],
};

// ---- Helpers ----
function norm(v) {
  if (v == null || isNaN(v)) return null;
  const n = Number(v);
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function slugify(name, address) {
  const plz  = (String(address || '').match(/\b(\d{5})\b/) || [])[1] || '';
  const base = String(name || 'lead')
    .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0, 50);
  return plz ? `${base}-${plz}` : base;
}

// ---- Technisches HTML-Audit ----
const h = String(html);
const at = {};

at.final_url    = finalUrl;
at.fetch_ok     = fetchOk;
at.http_status  = httpStatus != null ? Number(httpStatus) : null;
at.https        = /^https:/i.test(String(finalUrl || ''));
at.has_viewport_meta = /<meta[^>]+name=["']?viewport["']?[^>]*>/i.test(h);

const psiPerfNorm = norm(psi.performance);
const psiAvail    = psiPerfNorm !== null;
at.psi_performance_mobile = psiPerfNorm;
at.psi_seo            = norm(psi.seo);
at.psi_accessibility  = norm(psi.accessibility);
at.psi_best_practices = norm(psi.best_practices);
at.psi_lcp_ms = psi.lcp_ms != null ? Number(psi.lcp_ms) : null;
at.psi_cls    = psi.cls    != null ? Number(psi.cls)    : null;
at.mobile_friendly = at.has_viewport_meta && (!psiAvail || psiPerfNorm >= 50);

const titleM = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
at.has_title           = !!(titleM && titleM[1].trim());
at.title_text          = titleM ? titleM[1].trim().slice(0, 200) : null;
at.has_meta_description = /<meta[^>]+name=["']?description["']?[^>]*content=["'][^"']{10,}/i.test(h);
at.has_h1              = /<h1[\s>]/i.test(h);
at.has_schema_jsonld   = /<script[^>]+type=["']application\/ld\+json["']/i.test(h);
at.has_impressum       = /impressum/i.test(h);
at.has_datenschutz     = /(datenschutz|privacy)/i.test(h);
at.has_phone_link      = /href=["']tel:/i.test(h);
at.has_contact_form    = /<form[\s>]/i.test(h) && /(kontakt|contact|schreib|message)/i.test(h.toLowerCase());
at.has_reservation_link = /(reserv|booking|tisch\s*reserv)/i.test(h.toLowerCase());

const tech = [], age = [];
if (!at.has_viewport_meta)                                         age.push('no-viewport');
if (/wp-content|wp-includes|wordpress/i.test(h))                   tech.push('WordPress');
if (/wix\.com|wixsite/i.test(h))                                   tech.push('Wix');
if (/jimdo/i.test(h))                                              tech.push('Jimdo');
if (/<font[\s>]/i.test(h))                                         age.push('font-tag');
const jq = h.match(/jquery[.-](\d+\.\d+)/i);
if (jq) { tech.push('jQuery ' + jq[1]); if (parseInt(jq[1]) < 3) age.push('old-jquery'); }
if (/<frameset|<frame[\s>]/i.test(h))                              age.push('frames');
if (/\.swf\b|shockwave-flash/i.test(h))                           { age.push('flash'); tech.push('Flash'); }
if (/<table[^>]*width=["']?\d{3,}/i.test(h) && !at.has_viewport_meta) age.push('table-layout');
if (/<marquee/i.test(h))                                           age.push('marquee');
at.tech_stack          = [...new Set(tech)];
at.design_age_signals  = [...new Set(age)];

// ---- Scoring 5a: Technische Mängel ----
const bd = {};
let techPts = 0;

if (!at.https)
  { bd.no_https = 12; techPts += 12; }
if (!at.has_viewport_meta || (psiAvail && psiPerfNorm < 50))
  { bd.not_mobile = 14; techPts += 14; }
if (psiAvail && psiPerfNorm !== null && psiPerfNorm < 50) {
  const sp = Math.round((50 - psiPerfNorm) / 50 * 10);
  if (sp > 0) { bd.slow_pagespeed = sp; techPts += sp; }
}
{
  const lm = (!at.has_impressum ? 0.6 : 0) + (!at.has_datenschutz ? 0.4 : 0);
  if (lm > 0) { bd.missing_legal = Math.round(10 * lm); techPts += bd.missing_legal; }
}
{
  let seoMiss = 0;
  if (!at.has_title)            seoMiss += 0.25;
  if (!at.has_meta_description) seoMiss += 0.25;
  if (!at.has_h1)               seoMiss += 0.25;
  if (!at.has_schema_jsonld)    seoMiss += 0.25;
  if (seoMiss > 0) { bd.weak_seo = Math.round(8 * seoMiss); techPts += bd.weak_seo; }
}
if (age.length > 0) { bd.outdated_design = Math.min(8, age.length * 4); techPts += bd.outdated_design; }
{
  let cm = (!at.has_phone_link ? 0.5 : 0) + (!at.has_contact_form ? 0.5 : 0);
  if (cm > 0) { bd.weak_contact = Math.round(6 * cm); techPts += bd.weak_contact; }
}

// ---- Scoring 5b: Visuelle Mängel ----
let visualPts = 0;
const hq = auditVisual.hero_quality;
const hp = auditVisual.hero_present;

if (hq === 'none' || hq === 'weak' || hp === false)
  { bd.weak_hero = 12; visualPts += 12; }
else if (hp === null)
  { bd.no_visual_hero = 6; visualPts += 6; }

if (auditVisual.cta_above_fold === false)
  { bd.no_cta = 8; visualPts += 8; }
else if (auditVisual.cta_above_fold === null)
  { bd.no_cta_data = 4; visualPts += 4; }

if (auditVisual.visual_modernity_score !== null) {
  const vp = Math.round((100 - auditVisual.visual_modernity_score) / 100 * 12);
  bd.visual_outdated = vp; visualPts += vp;
} else {
  bd.visual_no_data = 6; visualPts += 6;
}

// ---- Scoring 5c: Potenzial-Dämpfer ----
let dampener = 0;
const reviews = Number(business.google_reviews_count || 0);
const rating  = Number(business.google_rating       || 0);
const substance = Math.min(1, reviews / 50) * Math.min(1, rating / 4.0);
const businessSubstance = Math.round(substance * 100);
if (substance < 0.3) { bd.low_substance = -8; dampener += 8; }

const contactBits = (business.phone ? 1 : 0) + (business.maps_url ? 1 : 0) + (at.has_phone_link ? 1 : 0);
const contactability = Math.round(contactBits / 3 * 100);

// ---- Endscore ----
const score = Math.max(0, Math.min(100, Math.round(techPts + visualPts - dampener)));

// ---- Confidence ----
let conf = 1.0;
if (!fetchOk)                               conf -= 0.30;
if (!psiAvail)                              conf -= 0.15;
if (warnings.includes('screenshot_failed')) conf -= 0.10;
if (warnings.includes('vision_parse_failed')) conf -= 0.20;
conf = Math.round(Math.max(0, Math.min(1, conf)) * 100) / 100;

// ---- Verkaufsargumente ----
const args = [];
if (bd.no_https)         args.push('Keine HTTPS-Verschlüsselung — schadet Vertrauen und Google-Ranking');
if (bd.not_mobile)       args.push('Seite nicht mobiloptimiert — über 60% der Nutzer kommen per Handy');
if (bd.slow_pagespeed)   args.push(`Schlechte Ladegeschwindigkeit (PSI mobil: ${psiPerfNorm}/100)`);
if (bd.missing_legal)    args.push('Impressum/Datenschutz fehlt — rechtliches Risiko für den Betreiber');
if (bd.weak_seo)         args.push('SEO-Grundlagen fehlen (Title, Meta-Description, H1, Schema.org)');
if (bd.outdated_design)  args.push('Veraltete Design-/Tech-Signale erkannt: ' + age.join(', '));
if (bd.weak_contact)     args.push('Kein klickbarer Anruf-Button / kein Kontaktformular auffindbar');
if (bd.weak_hero || bd.no_visual_hero) args.push('Kein ansprechender Hero-Bereich above-the-fold');
if (bd.no_cta || bd.no_cta_data) args.push('Kein sichtbarer Handlungsaufruf above-the-fold (Reservierung, Anruf)');
if (auditVisual.vs_modern_benchmark) args.push(auditVisual.vs_modern_benchmark);

// ---- Lead-ID ----
const leadId = slugify(business.name, business.address);

// ---- Schema v2.0 ----
const lead = {
  schema_version: '2.0',
  agent:          'lead_scanner',
  lead_id:        leadId,
  generated_at:   new Date().toISOString(),
  business: {
    name:                business.name                 || null,
    address:             business.address              || null,
    phone:               business.phone                || null,
    website:             business.website              || null,
    email_guess:         null,
    google_rating:       business.google_rating        != null ? Number(business.google_rating)       : null,
    google_reviews_count: business.google_reviews_count != null ? Number(business.google_reviews_count) : null,
    place_id:            business.place_id             || null,
    maps_url:            business.maps_url             || null,
    branche:             business.branche              || null,
    ort:                 business.ort                  || null,
    stadtteil:           null,
    social:              [],
    opening_hours:       null,
  },
  audit_technical: at,
  audit_visual:    auditVisual,
  score,
  score_breakdown: bd,
  potential: {
    business_substance: businessSubstance,
    contactability,
    local_relevance:    Math.min(100, reviews * 2),
    conversion_potential: score > 75 ? 85 : score > 50 ? 60 : 40,
  },
  verkaufsargumente: args,
  confidence: conf,
  warnings,
  logs: [{ ts: new Date().toISOString(), step: 'audit_score_complete', status: 'ok' }],
};

// ---- Datei schreiben (/files/runs/{lead_id}/lead.json) ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${leadId}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/lead.json`, JSON.stringify(lead, null, 2), 'utf8');
  lead.logs.push({ ts: new Date().toISOString(), step: 'file_write', status: 'ok', path: `${dir}/lead.json` });
} catch (e) {
  lead.warnings.push('file_write_failed');
}

return [{ json: lead }];
