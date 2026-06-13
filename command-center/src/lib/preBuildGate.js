// ─── PreBuild Gate ──────────────────────────────────────────────────────────
// Läuft VOR Agent 2 Build. Entscheidet: bauen / blockieren / review.
//
// Gates in dieser Reihenfolge:
//   1. Pflichtdaten (Name, Adresse mindestens grob, irgendein Kontaktweg)
//   2. Kategorie eindeutig erkannt (confidence ≥ 0.25 ODER User-Override)
//   3. Bild-Kategorie-Fit (mind. 1 Hero ≥90)
//   4. Style nicht verboten für Kategorie
//   5. Keine erfundenen Preise (wenn unsicher → markieren statt erfinden)

import { detectCategory, getCategory, isStyleForbiddenForCategory } from './categoryIntelligence'
import { scoreAssetBatch, shouldBlockBuild } from './assetScore'

// ─── Pflichtdaten-Check ────────────────────────────────────────────────────
function checkRequiredData(lead) {
  const checks = []
  const required = {
    business_name: 'Firmenname',
    address:       'Adresse (Stadt mindestens)',
  }
  const recommended = {
    phone:         'Telefon',
    cuisine:       'Küchen-Typ',
    opening_hours: 'Öffnungszeiten',
  }

  for (const [k, label] of Object.entries(required)) {
    if (!lead[k] || String(lead[k]).trim() === '' || lead[k] === '—') {
      checks.push({ field: k, label, status: 'missing', severity: 'blocking' })
    } else {
      checks.push({ field: k, label, status: 'present', severity: 'ok' })
    }
  }
  for (const [k, label] of Object.entries(recommended)) {
    if (!lead[k] || String(lead[k]).trim() === '' || lead[k] === '—') {
      checks.push({ field: k, label, status: 'missing', severity: 'warning' })
    } else {
      checks.push({ field: k, label, status: 'present', severity: 'ok' })
    }
  }
  return checks
}

// ─── Unsichere-Daten-Detektor ──────────────────────────────────────────────
// Markiert was als "nicht-fakten-tauglich" → darf nicht als hard fact in Build
function detectUncertainFields(lead) {
  const uncertain = []

  // Telefon ohne klares Format
  if (lead.phone && !/[\d]{6,}/.test(lead.phone.replace(/[^\d]/g, ''))) {
    uncertain.push({ field: 'phone', reason: 'Format suspekt — vor Versand prüfen' })
  }

  // Adresse ohne Hausnummer
  if (lead.address && !/\d+/.test(lead.address)) {
    uncertain.push({ field: 'address', reason: 'Keine Hausnummer erkannt' })
  }

  // Preise nicht hardcoded — kein konkreter € erlaubt wenn aus unsicherer Quelle
  if (lead.specials && /€\s?\d+|EUR\s?\d+/.test(lead.specials) && !lead.menu_source_verified) {
    uncertain.push({ field: 'prices', reason: 'Konkrete Preise gefunden aber Quelle nicht verifiziert' })
  }

  // Öffnungszeiten: müssen plausibel sein (Format hh:mm)
  if (lead.opening_hours && !/\d{1,2}[:.]\d{2}/.test(lead.opening_hours)) {
    uncertain.push({ field: 'opening_hours', reason: 'Kein Zeitformat erkannt' })
  }

  return uncertain
}

// ─── Pricing-Sanitizer ─────────────────────────────────────────────────────
// Erzeugt safe-to-display Texte: keine erfundenen Konkretpreise.
export function sanitizePricesForDisplay(lead, uncertain) {
  const priceUncertain = uncertain.some(u => u.field === 'prices')
  if (priceUncertain) {
    return {
      price_display: lead.price_range || '€€',
      menu_display:  'Auswahl aus der Karte — aktuelle Preise auf Anfrage',
      use_concrete_prices: false,
    }
  }
  return {
    price_display: lead.price_range || '€€',
    menu_display:  null,
    use_concrete_prices: true,
  }
}

// ─── Style-Validation ──────────────────────────────────────────────────────
function checkStyleForCategory(lead, requestedStyle, categoryId) {
  if (!requestedStyle) return { ok: true, override_required: false }

  if (isStyleForbiddenForCategory(categoryId, requestedStyle)) {
    const cat = getCategory(categoryId)
    return {
      ok: false,
      severity: 'blocking',
      reason: `Style "${requestedStyle}" ist für Kategorie "${categoryId}" verboten. Empfehlung: ${cat.design_recommendation}`,
      recommended: cat.design_recommendation,
      override_required: true,
    }
  }
  return { ok: true }
}

// ─── Hauptfunktion: runPreBuildGate ────────────────────────────────────────
export function runPreBuildGate({ lead = {}, assets = [], requestedStyle = null, forceOverride = false } = {}) {
  const report = {
    started_at: new Date().toISOString(),
    lead_id:    lead.lead_id,
    verdict:    'unknown',   // proceed | review | block
    gates: {},
    problems: [],
    repair_tasks: [],
    summary: {},
  }

  // Gate 1: Required data
  const dataChecks = checkRequiredData(lead)
  const missingRequired = dataChecks.filter(c => c.severity === 'blocking' && c.status === 'missing')
  report.gates.required_data = {
    passed: missingRequired.length === 0,
    checks: dataChecks,
  }
  if (missingRequired.length > 0) {
    report.problems.push({
      gate: 'required_data',
      severity: 'blocking',
      message: `Pflichtdaten fehlen: ${missingRequired.map(c => c.label).join(', ')}`,
    })
    report.repair_tasks.push({ agent: 'A2_text_extractor', task: 'Pflichtdaten neu extrahieren', fields: missingRequired.map(c => c.field) })
  }

  // Gate 2: Category detection
  const detected = detectCategory(lead)
  const category = lead.category_override || detected.category
  const categoryConfidence = lead.category_override ? 1.0 : detected.confidence
  report.gates.category = {
    detected: detected.category,
    final:    category,
    confidence: categoryConfidence,
    runner_up: detected.runner_up,
    user_override: !!lead.category_override,
    passed:   categoryConfidence >= 0.25 || !!lead.category_override,
  }
  if (categoryConfidence < 0.25 && !lead.category_override) {
    report.problems.push({
      gate: 'category',
      severity: 'review',
      message: `Kategorie nicht eindeutig (confidence ${(categoryConfidence * 100).toFixed(0)}%). User muss override setzen.`,
    })
    report.repair_tasks.push({ agent: 'user', task: 'category_override setzen', options: Object.keys(detected.all_scores) })
  }

  // Gate 3: Assets quality + category-fit
  const categoryData = getCategory(category)
  const assetContext = {
    category_id:        category,
    atmosphere:         lead.atmosphere,
    signature_products: categoryData.signature_products,
  }
  const batch = scoreAssetBatch(assets, assetContext)
  const blockCheck = shouldBlockBuild(assets, assetContext)
  report.gates.assets = {
    total:          batch.summary.total,
    hero_ready:     batch.summary.hero_ready,
    usable:         batch.summary.usable,
    secondary_only: batch.summary.secondary_only,
    rejected:       batch.summary.rejected,
    has_hero:       batch.summary.has_hero,
    block:          blockCheck.block,
    problems:       blockCheck.problems,
    passed:         !blockCheck.block,
  }
  if (blockCheck.block) {
    for (const p of blockCheck.problems) {
      report.problems.push({ gate: 'assets', ...p })
      report.repair_tasks.push({ agent: 'A3_asset_collector', task: p.repair || 'replace_asset', detail: p.message })
    }
  }

  // Gate 4: Style for category
  const styleCheck = checkStyleForCategory(lead, requestedStyle, category)
  report.gates.style = {
    requested: requestedStyle,
    ok: styleCheck.ok,
    recommended: styleCheck.recommended || categoryData.design_recommendation,
  }
  if (!styleCheck.ok) {
    report.problems.push({
      gate: 'style',
      severity: 'blocking',
      message: styleCheck.reason,
    })
    report.repair_tasks.push({ agent: 'user', task: `Style auf "${styleCheck.recommended}" wechseln` })
  }

  // Gate 5: Uncertain data
  const uncertain = detectUncertainFields(lead)
  const pricingSafe = sanitizePricesForDisplay(lead, uncertain)
  report.gates.uncertain_data = {
    uncertain_fields: uncertain,
    safe_display_strategy: pricingSafe,
    passed: true,  // niemals blockierend, nur markieren
  }
  if (uncertain.length > 0) {
    report.problems.push({
      gate: 'uncertain_data',
      severity: 'warning',
      message: `${uncertain.length} unsichere Felder gefunden — werden im Build sicher behandelt`,
    })
  }

  // ── Verdict ────────────────────────────────────────────────────────────
  const blockingProblems = report.problems.filter(p => p.severity === 'blocking')
  const reviewProblems   = report.problems.filter(p => p.severity === 'review')

  if (forceOverride) {
    report.verdict = 'proceed_forced'
    report.summary.note = 'User forced override despite gates'
  } else if (blockingProblems.length > 0) {
    report.verdict = 'block'
  } else if (reviewProblems.length > 0) {
    report.verdict = 'review'
  } else {
    report.verdict = 'proceed'
  }

  report.summary.blocking = blockingProblems.length
  report.summary.warnings = report.problems.filter(p => p.severity === 'warning').length
  report.summary.review   = reviewProblems.length
  report.summary.category = category
  report.summary.category_confidence = categoryConfidence
  report.summary.repair_tasks_count = report.repair_tasks.length

  // Carry the resolved context for build prompt
  report.build_context = {
    category_id:       category,
    category_data:     categoryData,
    style_recommended: styleCheck.recommended || categoryData.design_recommendation,
    style_final:       styleCheck.ok ? requestedStyle : (styleCheck.recommended || categoryData.design_recommendation),
    pricing_safe:      pricingSafe,
    uncertain_fields:  uncertain,
    asset_batch:       batch,
  }

  return report
}
