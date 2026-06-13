/**
 * PSI + Vision-Prep
 * Läuft nach PageSpeed (desktop) — nimmt beide PSI-Ergebnisse und baut den Vision-Payload.
 *
 * Input:
 *   $json                          = PSI Desktop response (kann Fehler sein)
 *   $('PageSpeed (mobil)').first().json = PSI Mobile response
 *   $('Prep fuer Audit').first().json   = { business, html, final_url, fetch_ok, http_status }
 */

const prep   = $('Prep fuer Audit').first().json;
const psiMob = $('PageSpeed (mobil)').first().json;
const psiDes = $json;

const warnings = Array.isArray(prep.warnings) ? [...prep.warnings] : [];

function norm(v) {
  if (v == null || isNaN(v)) return null;
  const n = Number(v);
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

// --- PSI Mobile ---
const lhrM = psiMob?.lighthouseResult || {};
const hasPSI = !!(lhrM?.categories?.performance?.score != null);
if (!hasPSI) warnings.push('psi_unavailable');

const psi = {
  performance:    norm(lhrM?.categories?.performance?.score),
  seo:            norm(lhrM?.categories?.seo?.score),
  accessibility:  norm(lhrM?.categories?.accessibility?.score),
  best_practices: norm(lhrM?.categories?.['best-practices']?.score),
  lcp_ms:  lhrM?.audits?.['largest-contentful-paint']?.numericValue ?? null,
  cls:     lhrM?.audits?.['cumulative-layout-shift']?.numericValue ?? null,
};

// --- Screenshots aus PSI ---
const screenshotMobile  = lhrM?.audits?.['final-screenshot']?.details?.data ?? null;
const lhrD              = psiDes?.lighthouseResult || {};
const screenshotDesktop = lhrD?.audits?.['final-screenshot']?.details?.data ?? null;

if (!screenshotMobile && !screenshotDesktop) warnings.push('screenshot_failed');

// --- Vision-Prompt ---
const visionPrompt =
  `Du bist ein Conversion- und Webdesign-Experte. Bewerte die Screenshots der Startseite eines ` +
  `lokalen Restaurants/Cafés in Leipzig. Website: ${prep.business?.website || 'unbekannt'}. ` +
  `Vergleiche mit modernen Restaurantseiten 2026 (großflächige Food-Fotografie, klare ` +
  `Reservierungs-CTA, sticky Header, mobile-first). ` +
  `Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown, Code-Blöcke oder Erklärungen: ` +
  `{"above_the_fold_score":0,"hero_present":false,"hero_quality":"none|weak|ok|strong",` +
  `"cta_above_fold":false,"cta_text_found":[],"visual_modernity_score":0,` +
  `"vs_modern_benchmark":"string","visual_findings":[]}`;

const visionContent = [{ type: 'text', text: visionPrompt }];
if (screenshotDesktop) visionContent.push({ type: 'image_url', image_url: { url: screenshotDesktop } });
if (screenshotMobile)  visionContent.push({ type: 'image_url', image_url: { url: screenshotMobile } });

// Immer einen validen Payload bauen (auch ohne Bilder — dann antwortet Claude mit Defaults)
const visionPayload = {
  model:       'Claude-Sonnet-4.6',
  temperature: 0,
  max_tokens:  800,
  messages:    [{ role: 'user', content: visionContent }]
};

return [{
  json: {
    ...prep,
    psi,
    screenshot_mobile_b64:  screenshotMobile,
    screenshot_desktop_b64: screenshotDesktop,
    vision_payload:         visionPayload,
    warnings,
  }
}];
