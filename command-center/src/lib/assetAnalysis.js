// ─── A3 Asset Analysis ──────────────────────────────────────────────────────
// Wrapper um assetScore.scoreAssetBatch() — produziert das vom User
// geforderte JSON-Schema für A3 Output:
//   sourceAssets[], selectedHeroAsset, selectedSideAssets[],
//   rejectedAssets[], poeGenerationNeeded, poePromptSuggestion,
//   assetGatePassed, assetGateReasons[]

import { scoreAssetBatch, pickBestForRole } from './assetScore'
import { detectCategory, getCategory } from './categoryIntelligence'

function inferType(asset) {
  const r = (asset.role || '').toLowerCase()
  if (r.includes('hero')) return 'hero'
  if (r.includes('food') || r.includes('dish')) return 'food'
  if (r.includes('interior') || r.includes('innen')) return 'interior'
  if (r.includes('logo')) return 'logo'
  if (r.includes('menu') || r.includes('karte')) return 'menu'
  return 'unknown'
}

function inferSource(asset) {
  if (asset.source) return asset.source
  const url = String(asset.url || '').toLowerCase()
  if (url.includes('lieferando') || url.includes('wolt') || url.includes('ubereats')) return 'delivery'
  if (url.includes('instagram')) return 'instagram'
  if (url.includes('googleusercontent') || url.includes('google')) return 'google'
  if (asset.ai_generated) return 'poe'
  if (asset.manual) return 'manual'
  return 'website'
}

function buildPoePromptSuggestion(lead, category) {
  const name = lead.business_name || lead.name || 'restaurant'
  const cat = category?.label || category?.id || 'restaurant'
  const products = (category?.signature_products || []).slice(0, 3).join(', ')
  const atmosphere = lead.atmosphere || 'warm, inviting'
  return `Award-winning food photography for "${name}" — a ${cat.toLowerCase()} restaurant. Hero composition showing ${products || 'signature dishes'}, ${atmosphere} atmosphere, dramatic side lighting, shallow depth of field, premium editorial style. Sharp focus on food. 16:9 aspect ratio. No text overlay. Photorealistic, magazine quality.`
}

// ── Hauptanalyse ──────────────────────────────────────────────────────────
export function analyzeAssets(lead, assets = []) {
  if (!lead) throw new Error('analyzeAssets: lead required')
  const det = detectCategory(lead)
  const category = lead.category_override || det.category
  const categoryData = category ? getCategory(category) : null
  const subcategory = det.subcategory || null

  const ctx = {
    category_id: category,
    atmosphere: lead.atmosphere,
    signature_products: categoryData?.signature_products || [],
  }

  // Score all assets
  const batch = scoreAssetBatch(assets, ctx)
  const bestHero = pickBestForRole(batch.scored, 'hero')

  // Build sourceAssets[] in user-schema shape
  const sourceAssets = batch.scored.map(s => ({
    url: s.asset.url,
    source: inferSource(s.asset),
    type: inferType(s.asset),
    description: s.asset.description || '',
    detectedObjects: s.asset.detected_objects || [],
    categoryFit: s.score.breakdown.category_fit,
    productFit: s.score.breakdown.product_fit,
    imageQuality: s.score.breakdown.image_quality,
    salesImpact: s.score.breakdown.sales_impact,
    brandAtmosphereFit: s.score.breakdown.atmosphere,
    technicalUsability: s.score.breakdown.technical,
    totalScore: s.score.total,
    status: s.score.verdict,
    rejectionReasons: (s.score.reasons || []).filter(r => r.blocking).map(r => r.why),
    approvedForHero: s.score.verdict === 'hero_ready',
    approvedForWebsite: ['hero_ready', 'usable', 'secondary_only'].includes(s.score.verdict),
    aiGenerated: !!s.asset.ai_generated,
  }))

  const heroAssets = sourceAssets.filter(a => a.approvedForHero).sort((a, b) => b.totalScore - a.totalScore)
  const sideAssets = sourceAssets.filter(a => !a.approvedForHero && a.approvedForWebsite)
  const rejectedAssets = sourceAssets.filter(a => a.status === 'reject')

  const selectedHeroAsset = heroAssets[0] || (bestHero ? sourceAssets.find(a => a.url === bestHero.asset.url) : null)

  // Asset Gate Logic
  const reasons = []
  let gatePassed = true
  if (sourceAssets.length === 0) {
    gatePassed = false
    reasons.push('Keine Asset-Quellen vorhanden')
  }
  if (!selectedHeroAsset) {
    gatePassed = false
    reasons.push('Kein Hero-Asset mit Score ≥ 90 verfügbar')
  }
  if (sideAssets.length === 0 && selectedHeroAsset) {
    reasons.push('Warnung: Keine Side-Assets — Build wird hero-lastig')
  }
  if (rejectedAssets.length > 0 && sourceAssets.length <= 3) {
    reasons.push(`${rejectedAssets.length} von ${sourceAssets.length} Assets abgelehnt — Datenbasis zu dünn`)
  }
  // Wrong-category check: hat das Hero die richtige Kategorie?
  if (selectedHeroAsset && selectedHeroAsset.categoryFit < 15) {
    gatePassed = false
    reasons.push(`Hero hat schwachen Kategorie-Fit (${selectedHeroAsset.categoryFit}/25) — Verdacht auf falsches Motiv`)
  }

  const poeGenerationNeeded = !selectedHeroAsset || (selectedHeroAsset.totalScore < 90)
  const poePromptSuggestion = poeGenerationNeeded ? buildPoePromptSuggestion(lead, categoryData) : null

  return {
    leadId: lead.lead_id || lead.id || null,
    businessName: lead.business_name || lead.name || null,
    category,
    subcategory,
    assetSearchStatus: sourceAssets.length === 0 ? 'failed' : (gatePassed ? 'success' : 'partial'),
    sourceAssets,
    selectedHeroAsset,
    selectedSideAssets: sideAssets,
    rejectedAssets,
    poeGenerationNeeded,
    poePromptSuggestion,
    assetGatePassed: gatePassed,
    assetGateReasons: reasons,
    summary: {
      total: sourceAssets.length,
      heroReady: heroAssets.length,
      usable: sideAssets.length,
      rejected: rejectedAssets.length,
    },
    analyzedAt: new Date().toISOString(),
    analyzerVersion: 'v1',
  }
}
