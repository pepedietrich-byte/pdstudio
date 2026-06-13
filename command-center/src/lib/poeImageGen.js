// ─── Poe Image Generation Client ────────────────────────────────────────────
// Frontend-Helper für AI-Bild-Generierung via /api/poe-image
import { scoreAsset } from './assetScore'

const POE_PROXY = '/api/poe-image'

/**
 * Generiert AI-Bild für eine Rolle + Kategorie.
 * Wird automatisch von preBuildGate aufgerufen wenn assetScore < 90 für Hero.
 */
export async function generateAIImage({
  category_id,
  role = 'hero',
  business_name,
  atmosphere,
  style_id = 'cinnabar',
  count = 1,
  context = {},
}) {
  if (!category_id) throw new Error('category_id is required')

  const body = {
    category_id, role, business_name, atmosphere, style_id, count,
    model_preference: role === 'hero' ? 'flux' : 'nano_banana',
    budget_points: 50000,   // generous, but capped
  }

  const r = await fetch(POE_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!r.ok) {
    const t = await r.text()
    throw new Error(`Poe-Gen HTTP ${r.status}: ${t}`)
  }

  const data = await r.json()

  // Auto-score generated images
  const scored = (data.images || []).map(img => ({
    ...img,
    score: scoreAsset(img, {
      category_id,
      atmosphere,
      signature_products: context.signature_products,
    }),
  }))

  return {
    images: scored,
    usage: data.usage,
    success: data.success,
  }
}

/**
 * Try to fill missing Hero by generating AI images.
 * Returns the best AI hero (score 90+) or null if all attempts failed.
 */
export async function ensureHeroAvailable(opts) {
  const { existing_assets = [], ...genOpts } = opts

  // Check if existing already has 90+ hero
  const existingHero = existing_assets.find(a => {
    const s = a.score?.total ?? scoreAsset(a, {
      category_id: genOpts.category_id,
      atmosphere: genOpts.atmosphere,
      signature_products: opts.context?.signature_products,
    }).total
    return s >= 90 && (!a.role || a.role.toLowerCase().includes('hero'))
  })
  if (existingHero) {
    return { hero: existingHero, source: 'existing', generated: false }
  }

  // Generate 2 candidates and pick best
  const result = await generateAIImage({ ...genOpts, role: 'hero', count: 2 })
  if (!result.success || !result.images.length) {
    return { hero: null, source: 'failed', generated: false, usage: result.usage }
  }
  const sorted = result.images.sort((a, b) => b.score.total - a.score.total)
  const best = sorted[0]
  if (best.score.total < 90) {
    return { hero: best, source: 'ai_generated_below_90', generated: true, usage: result.usage }
  }
  return { hero: best, source: 'ai_generated', generated: true, usage: result.usage }
}
