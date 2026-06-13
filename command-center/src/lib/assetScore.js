// ─── Asset Scoring ──────────────────────────────────────────────────────────
// Bewertet ein Bild auf 6 Dimensionen (Summe 0-100).
// Schwellen:
//   < 70  → ablehnen
//   70-79 → nur Nebenbild
//   80-89 → verwendbar
//   90+   → Hero-tauglich
//
// Genutzt von:
//   - lib/preBuildGate.js          → blockiert Build wenn Hero < 90 ohne Replace-Plan
//   - components/AssetQualityPanel → UI-Visualisierung
//   - api/poe-image.js             → triggert Re-Gen wenn score zu niedrig

import { CATEGORIES, getCategory, validateImageForCategory } from './categoryIntelligence'

// ─── Kriterien-Definition ──────────────────────────────────────────────────
export const SCORE_CRITERIA = {
  category_fit:   { max: 25, label: 'Kategorie-Fit',         desc: 'Passt das Bild zur erkannten Kategorie?' },
  product_fit:    { max: 20, label: 'Produkt-Fit',           desc: 'Zeigt das Bild Signature-Produkte?' },
  image_quality:  { max: 20, label: 'Bildqualität',          desc: 'Auflösung, Schärfe, Komposition' },
  sales_impact:   { max: 15, label: 'Verkaufswirkung',       desc: 'Würde ein Kunde "wow" sagen?' },
  atmosphere:     { max: 10, label: 'Atmosphären-Fit',       desc: 'Stimmung passend zur Marke?' },
  technical:      { max: 10, label: 'Technische Nutzbarkeit', desc: 'Aspekt, Größe, Format' },
}

// ─── Score-Function (pure, deterministic) ──────────────────────────────────

/**
 * scoreAsset(asset, context)
 *
 * @param {Object} asset
 *   {
 *     url: 'https://...',
 *     role: 'hero' | 'interior' | 'food' | ...,
 *     description: 'string keywords describing image',
 *     width: number, height: number,
 *     ai_generated: boolean,
 *   }
 * @param {Object} context
 *   {
 *     category_id: 'burger' | 'pizza' | ...,
 *     atmosphere: 'string',
 *     signature_products: ['Burger', 'Fries'],
 *   }
 * @returns {Object} score breakdown + verdict
 */
export function scoreAsset(asset = {}, context = {}) {
  const reasons = []

  // ── 1. Category-Fit (0-25) ──────────────────────────────────────────────
  const catCheck = validateImageForCategory(context.category_id, asset.description || '')
  let category_fit = 0
  if (catCheck.ok && catCheck.signal_strength >= 1) {
    category_fit = 25
    reasons.push({ criterion: 'category_fit', score: 25, why: catCheck.reason })
  } else if (catCheck.ok && catCheck.warning) {
    category_fit = 8  // neutral — kein positive signal
    reasons.push({ criterion: 'category_fit', score: 8, why: 'no positive category signal (neutral)' })
  } else if (!catCheck.ok) {
    category_fit = 0
    reasons.push({ criterion: 'category_fit', score: 0, why: catCheck.reason, blocking: true })
  }

  // ── 2. Product-Fit (0-20) — passt zu signature_products? ────────────────
  let product_fit = 0
  const desc = (asset.description || '').toLowerCase()
  const products = (context.signature_products || []).map(p => p.toLowerCase())
  const matchedProducts = products.filter(p =>
    p.split(/\s+/).some(token => token.length > 3 && desc.includes(token))
  )
  if (matchedProducts.length >= 2) {
    product_fit = 20
    reasons.push({ criterion: 'product_fit', score: 20, why: `matched ${matchedProducts.length} signature products` })
  } else if (matchedProducts.length === 1) {
    product_fit = 14
    reasons.push({ criterion: 'product_fit', score: 14, why: `matched 1 signature product` })
  } else {
    // Falls allgemeines "Essen"-Bild ohne spezifisches Produkt
    if (/dish|plate|food|meal/.test(desc)) {
      product_fit = 8
      reasons.push({ criterion: 'product_fit', score: 8, why: 'generic food image — no signature' })
    } else {
      product_fit = 4
      reasons.push({ criterion: 'product_fit', score: 4, why: 'no product signal' })
    }
  }

  // ── 3. Image-Quality (0-20) — Auflösung + Komposition ───────────────────
  let image_quality = 0
  const w = asset.width || 0
  const h = asset.height || 0
  if (w >= 1600 && h >= 900) {
    image_quality = 20
    reasons.push({ criterion: 'image_quality', score: 20, why: `${w}x${h} — premium resolution` })
  } else if (w >= 1200 && h >= 700) {
    image_quality = 14
    reasons.push({ criterion: 'image_quality', score: 14, why: `${w}x${h} — good resolution` })
  } else if (w >= 800) {
    image_quality = 8
    reasons.push({ criterion: 'image_quality', score: 8, why: `${w}x${h} — acceptable` })
  } else if (w > 0) {
    image_quality = 3
    reasons.push({ criterion: 'image_quality', score: 3, why: `${w}x${h} — low quality` })
  } else {
    image_quality = 10   // default wenn unbekannt — vermutlich Unsplash 1920+
    reasons.push({ criterion: 'image_quality', score: 10, why: 'resolution unknown — assumed adequate' })
  }
  // AI-Generated bonus oder malus
  if (asset.ai_generated) {
    // FLUX-pro / Nano Banana sind typ. premium
    if (asset.ai_model === 'FLUX-pro' || asset.ai_model === 'flux-pro') {
      image_quality = Math.min(20, image_quality + 2)
      reasons.push({ criterion: 'image_quality', score: 2, why: 'FLUX-pro bonus' })
    }
  }

  // ── 4. Sales-Impact (0-15) ──────────────────────────────────────────────
  let sales_impact = 0
  const isHeroRole = (asset.role || '').toLowerCase().includes('hero')
  // Heroes brauchen verkaufsstarke Motive
  if (isHeroRole) {
    if (/signature|hero|premium|cinematic|wow|stunning/.test(desc)) {
      sales_impact = 15
      reasons.push({ criterion: 'sales_impact', score: 15, why: 'hero with sales language' })
    } else if (catCheck.ok && catCheck.signal_strength >= 1) {
      sales_impact = 10
      reasons.push({ criterion: 'sales_impact', score: 10, why: 'hero with category-positive match' })
    } else {
      sales_impact = 4
      reasons.push({ criterion: 'sales_impact', score: 4, why: 'hero but no sales language' })
    }
  } else {
    // Non-hero — sales-impact niedriger gewichtet
    sales_impact = catCheck.ok ? 8 : 0
    reasons.push({ criterion: 'sales_impact', score: sales_impact, why: 'non-hero supporting asset' })
  }

  // ── 5. Atmosphere-Fit (0-10) ────────────────────────────────────────────
  let atmosphere = 0
  const atm = (context.atmosphere || '').toLowerCase()
  const atmKeywords = atm.split(/[\s,]+/).filter(w => w.length > 4)
  const atmMatches = atmKeywords.filter(k => desc.includes(k)).length
  if (atmMatches >= 2) {
    atmosphere = 10
    reasons.push({ criterion: 'atmosphere', score: 10, why: `matched ${atmMatches} atmosphere keywords` })
  } else if (atmMatches === 1) {
    atmosphere = 6
    reasons.push({ criterion: 'atmosphere', score: 6, why: 'matched 1 atmosphere keyword' })
  } else {
    atmosphere = 3
    reasons.push({ criterion: 'atmosphere', score: 3, why: 'no atmosphere signal — neutral' })
  }

  // ── 6. Technical (0-10) — aspect, mime, accessibility ───────────────────
  let technical = 0
  const aspectOk = w > 0 && h > 0 && (w / h >= 1.3 && w / h <= 2.5)   // landscape range
  if (aspectOk) {
    technical += 5
    reasons.push({ criterion: 'technical', score: 5, why: `aspect ${(w / h).toFixed(2)} (landscape ok)` })
  } else if (w === 0) {
    technical += 3   // unknown
    reasons.push({ criterion: 'technical', score: 3, why: 'aspect unknown — assumed ok' })
  } else if (w > 0 && Math.abs(w / h - 1) < 0.1) {
    // Square — ok für non-hero
    if (!isHeroRole) {
      technical += 5
      reasons.push({ criterion: 'technical', score: 5, why: 'square ok for non-hero' })
    } else {
      technical += 1
      reasons.push({ criterion: 'technical', score: 1, why: 'square — suboptimal for hero' })
    }
  }
  // URL valid?
  if (asset.url && /^https?:\/\//.test(asset.url)) {
    technical += 5
    reasons.push({ criterion: 'technical', score: 5, why: 'valid URL' })
  }

  // ── Sum ────────────────────────────────────────────────────────────────
  const total = category_fit + product_fit + image_quality + sales_impact + atmosphere + technical

  // ── Verdict ─────────────────────────────────────────────────────────────
  let verdict, role_allowed
  if (total >= 90) {
    verdict = 'hero_ready'
    role_allowed = ['hero', 'showcase', 'signature_dish', 'any']
  } else if (total >= 80) {
    verdict = 'usable'
    role_allowed = ['interior', 'atmosphere', 'food', 'showcase', 'signature_dish']
  } else if (total >= 70) {
    verdict = 'secondary_only'
    role_allowed = ['atmosphere', 'environment', 'gallery']
  } else {
    verdict = 'reject'
    role_allowed = []
  }

  // Force reject auf jegliche role wenn category_fit blocking
  const hasBlocking = reasons.some(r => r.blocking)
  if (hasBlocking) {
    verdict = 'reject'
    role_allowed = []
  }

  return {
    total,
    breakdown: {
      category_fit,
      product_fit,
      image_quality,
      sales_impact,
      atmosphere,
      technical,
    },
    verdict,
    role_allowed,
    role_requested: asset.role || null,
    role_match:     role_allowed.includes('any') || role_allowed.includes(asset.role || ''),
    reasons,
    asset_url:      asset.url,
    blocking:       hasBlocking,
  }
}

// ─── Batch-Score für eine Asset-Liste ──────────────────────────────────────
export function scoreAssetBatch(assets = [], context = {}) {
  const scored = assets.map(a => ({
    asset: a,
    score: scoreAsset(a, context),
  }))

  const summary = {
    total: scored.length,
    hero_ready:     scored.filter(s => s.score.verdict === 'hero_ready').length,
    usable:         scored.filter(s => s.score.verdict === 'usable').length,
    secondary_only: scored.filter(s => s.score.verdict === 'secondary_only').length,
    rejected:       scored.filter(s => s.score.verdict === 'reject').length,
    has_hero:       scored.some(s => s.score.verdict === 'hero_ready'),
    has_any_usable: scored.some(s => ['hero_ready', 'usable'].includes(s.score.verdict)),
  }

  return { scored, summary }
}

// ─── Pick best for role ────────────────────────────────────────────────────
export function pickBestForRole(scoredAssets = [], role) {
  const isHero = (role || '').toLowerCase().includes('hero')
  const minTotal = isHero ? 90 : 80

  const candidates = scoredAssets
    .filter(s => s.score.total >= minTotal)
    .filter(s => s.score.role_allowed.includes('any') || s.score.role_allowed.includes(role))
    .sort((a, b) => b.score.total - a.score.total)

  return candidates[0] || null
}

// ─── Erkenne ob Build geblockt werden muss ─────────────────────────────────
export function shouldBlockBuild(scoredAssets = [], context = {}) {
  const sum = scoreAssetBatch(scoredAssets, context).summary
  const problems = []

  // Block 1: kein Hero
  if (!sum.has_hero) {
    problems.push({
      severity: 'blocking',
      code: 'no_hero_ready',
      message: 'Kein Bild ≥90 für Hero. Build blockiert.',
      repair: 'a3_or_poe',
    })
  }

  // Block 2: rejected mehr als half der Assets
  if (sum.rejected > sum.total / 2) {
    problems.push({
      severity: 'blocking',
      code: 'too_many_rejected',
      message: `${sum.rejected}/${sum.total} Bilder rejected (kategorie- oder qualitäts-mismatch)`,
      repair: 'a3_or_poe',
    })
  }

  return {
    block: problems.some(p => p.severity === 'blocking'),
    problems,
    summary: sum,
  }
}
