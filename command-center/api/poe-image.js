// ─── Poe Image Generation API ──────────────────────────────────────────────
// Category-aware Hero + Asset Generation für PDSTUDIO Builds.
//
// POST body:
//   {
//     category_id: 'burger' | 'pizza' | ...,
//     business_name: 'Ricks Burger',
//     atmosphere: 'Urban street food joint',
//     role: 'hero' | 'food' | 'interior' | 'atmosphere',
//     style_id: 'neon' | 'cinnabar' | ...,  (optional, beeinflusst mood)
//     count: 1-3
//   }
// Returns: { images: [{url, prompt, model, role}], usage: { model, points, ... }, log_id }

const POE_API = 'https://api.poe.com/v1/chat/completions'

const MODELS = {
  flux:        'FLUX-pro',           // High-quality, ~500 points
  nano_banana: 'Nano-Banana',        // Fast, cheap, ~50 points
  fallback:    'Gemini-2.5-Flash-Image',
}

// ─── Per-Kategorie Prompt-Recipes ──────────────────────────────────────────
const RECIPES = {
  burger: {
    hero:       'Hero shot of a perfect smashburger, melted cheese, sesame brioche bun, crispy bacon, dark moody food photography, side lit, steam rising, dramatic shadows, restaurant-grade plating',
    food:       'Close-up macro of a signature smashburger with truffle fries, professional food photography, urban casual aesthetic, dark wood background, restaurant kitchen lighting',
    interior:   'Modern burger joint interior, exposed brick walls, neon sign, leather booths, urban street food atmosphere, intimate dim lighting, cinematic',
    atmosphere: 'Friends enjoying burgers and craft beer at a casual burger restaurant, candid lifestyle photography, golden hour, authentic moment',
  },
  pizza: {
    hero:       'Neapolitan pizza with melted mozzarella, fresh basil, in front of wood-fire oven, flames visible, professional Italian food photography, drenched warm tones',
    food:       'Margherita pizza close-up, charred crust, San Marzano tomatoes, buffalo mozzarella, rustic wood board, editorial food shot',
    interior:   'Authentic Italian pizzeria interior, wood-fire oven glowing, marble counter, hanging copper pots, warm intimate lighting',
    atmosphere: 'Pizzaiolo working with dough at marble counter, flour-dusted hands, authentic craft, documentary photography',
  },
  asian: {
    hero:       'Premium ramen bowl with rich tonkotsu broth, soft-boiled egg, chashu, scallions, steam rising, dark moody shot, traditional Japanese plating',
    food:       'Sushi platter with omakase selection, perfect nigiri, fresh sashimi, soy sauce, ginger, minimalist black slate',
    interior:   'Minimalist Japanese restaurant interior, wooden counter, paper lantern lighting, intimate sushi bar atmosphere',
    atmosphere: 'Sushi chef preparing nigiri at counter, focused craft, soft warm lighting, documentary style',
  },
  cafe: {
    hero:       'Specialty coffee flat lay, pour-over setup, croissants, fresh pastries, natural morning light, magazine-style food photography',
    food:       'Avocado toast with poached egg, microgreens, on artisan sourdough, brunch food photography, light and airy',
    interior:   'Indie coffee shop interior, exposed wood, plants, large windows with natural light, warm minimalist aesthetic',
    atmosphere: 'Barista pouring latte art, focused craft, steam from espresso machine, candid moment',
  },
  bar: {
    hero:       'Premium cocktail with bourbon, smoked glass, single large ice cube, citrus garnish, dim bar lighting, moody dark atmosphere',
    food:       'Old Fashioned cocktail close-up, amber whiskey, smoked, premium glassware, dark wood bar',
    interior:   'Speakeasy bar interior, leather booths, dim warm lighting, vintage glassware shelf, premium nightlife atmosphere',
    atmosphere: 'Bartender shaking cocktail, focused craft, low light, dramatic, professional service',
  },
  doener: {
    hero:       'Authentic döner kebab on freshly baked fladenbrot, vertical spit in background, vibrant vegetables, garlic sauce, urban street food photography',
    food:       'Döner dürüm wrap close-up, perfectly grilled meat, fresh vegetables, herb sauce drizzle, casual food shot',
    interior:   'Modern döner shop interior, kebab spit visible, casual seating, Turkish design elements',
    atmosphere: 'Döner master slicing fresh kebab from spit, traditional craft, action shot',
  },
  sushi: {
    hero:       'Premium omakase sushi presentation, perfect nigiri selection on black slate, minimalist Japanese plating, intimate counter lighting',
    food:       'Fresh tuna sashimi close-up, perfect knife work, soy ginger garnish, minimalist black background',
    interior:   'Premium sushi bar with cypress wood counter, single hanging lantern, minimalist Japanese aesthetic',
    atmosphere: 'Itamae preparing nigiri with focused precision, traditional craft, soft warm lighting',
  },
  indian: {
    hero:       'Butter chicken in copper bowl with naan and basmati rice, rich tomato cream sauce, fresh cilantro, drenched warm Indian lighting',
    food:       'Tandoori chicken hot from tandoor oven, charred edges, lemon wedges, mint chutney, dramatic moody food shot',
    interior:   'Elegant Indian restaurant interior, intricate woodwork, brass details, warm amber lighting, refined atmosphere',
    atmosphere: 'Tandoor master cooking naan in clay oven, flames visible, traditional craft, documentary style',
  },
  bakery: {
    hero:       'Fresh sourdough loaves on wooden counter, perfect crust scoring, flour dusted, morning bakery atmosphere, soft natural light',
    food:       'Buttery croissant macro, perfect lamination layers, golden flaky crust, marble surface, magazine food photography',
    interior:   'Artisan bakery interior, wooden shelves with bread loaves, stone oven, morning light through large windows',
    atmosphere: 'Baker shaping dough by hand, flour-dusted apron, early morning light, craft documentary',
  },
  general: {
    hero:       'Beautifully plated signature dish at upscale casual restaurant, professional food photography, warm intimate restaurant lighting',
    food:       'Restaurant signature dish close-up, professional plating, dramatic lighting, magazine-quality food shot',
    interior:   'Inviting restaurant interior, warm lighting, modern casual elegance, intimate atmosphere',
    atmosphere: 'Chef plating dish at pass, focused craft, restaurant kitchen documentary',
  },
}

// ─── Style-Mood-Modifier ───────────────────────────────────────────────────
const STYLE_MODIFIERS = {
  cinnabar: 'drenched warm earthy tones, mediterranean clay palette, cinematic',
  obsidian: 'dark luxury aesthetic, deep blacks with gold accents, premium fine dining feel',
  atelier:  'editorial minimalism, off-white background, magazine-style, generous whitespace',
  terrain:  'warm earthy indie vibe, sand and terracotta tones, lifestyle aesthetic',
  neon:     'high contrast urban energy, deep blacks with pop color accent, bold modern',
}

function buildPrompt(categoryId, role, styleId, businessName, atmosphere) {
  const recipes = RECIPES[categoryId] || RECIPES.general
  const base = recipes[role] || recipes.hero
  const styleMod = STYLE_MODIFIERS[styleId] || ''
  const nameContext = businessName ? ` for "${businessName}"` : ''
  const atmosphereNote = atmosphere ? ` Atmosphere: ${atmosphere}.` : ''

  // Universal pflicht-clauses
  const guard = 'No text, no watermarks, no logos, no people if hero shot, high resolution, photorealistic, editorial quality, no AI artifacts, no plastic look'

  return `${base}${nameContext}.${atmosphereNote} ${styleMod}. ${guard}.`
}

async function callPoe(model, prompt, apiKey) {
  const r = await fetch(POE_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    }),
  })
  if (!r.ok) throw new Error(`Poe HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

function extractImageUrl(responseBody) {
  const content = responseBody?.choices?.[0]?.message?.content || ''
  // FLUX returns markdown image ![alt](url)
  const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)\s]+)\)/)
  if (mdMatch) return mdMatch[1]
  // Raw URL
  const urlMatch = content.match(/https?:\/\/[^\s\n"'<>]+\.(jpg|jpeg|png|webp|gif)/i)
  if (urlMatch) return urlMatch[0]
  return null
}

// ─── Logger ────────────────────────────────────────────────────────────────
// In Production: schreib in BUILD-Sheet via webhook oder eigene Poe-Usage-Sheet
async function logUsage(entry) {
  // Future: POST zu Sheet-Write webhook
  console.log('[POE-USAGE]', JSON.stringify(entry))
  return entry
}

// ─── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' })

  const POE_KEY = process.env.POE_API_KEY
  if (!POE_KEY) return res.status(500).json({ error: 'POE_API_KEY not configured' })

  const {
    category_id = 'general',
    role = 'hero',
    business_name = '',
    atmosphere = '',
    style_id = 'cinnabar',
    count = 1,
    model_preference = 'flux',  // 'flux' (premium) | 'nano_banana' (cheap)
    budget_points = 100000,     // per call max
  } = req.body || {}

  const log = {
    timestamp: new Date().toISOString(),
    category_id, role, business_name, style_id,
    requested_count: count,
    model_used: '',
    prompts: [],
    urls: [],
    estimated_points: 0,
    success: false,
    errors: [],
  }

  try {
    const prompts = []
    for (let i = 0; i < Math.min(count, 3); i++) {
      prompts.push(buildPrompt(category_id, role, style_id, business_name, atmosphere))
    }
    log.prompts = prompts

    // Wahl: flux für hero, nano_banana für secondary
    let useModel
    if (role === 'hero' || model_preference === 'flux') {
      useModel = MODELS.flux
    } else {
      useModel = MODELS.nano_banana
    }
    log.model_used = useModel

    // Estimate points per call (rough): FLUX ~500, Nano ~50
    const perCallPoints = useModel === MODELS.flux ? 500 : 50
    log.estimated_points = perCallPoints * prompts.length

    if (log.estimated_points > budget_points) {
      return res.status(400).json({
        error: 'budget_exceeded',
        estimated_points: log.estimated_points,
        budget_points,
      })
    }

    const images = []
    for (const prompt of prompts) {
      try {
        const response = await callPoe(useModel, prompt, POE_KEY)
        const url = extractImageUrl(response)
        if (url) {
          images.push({
            url,
            prompt,
            model: useModel,
            role,
            category_id,
            ai_generated: true,
            ai_model: useModel,
            description: `AI-generated ${category_id} ${role}: ${prompt.slice(0, 80)}`,
            // Default score-hints für assetScore
            width: 1920,   // FLUX default
            height: 1080,
          })
          log.urls.push(url)
        } else {
          log.errors.push('no_url_in_response')
        }
      } catch (e) {
        log.errors.push(e.message)
      }
    }

    log.success = images.length > 0
    await logUsage(log)

    return res.json({
      images,
      usage: {
        model: useModel,
        prompts_sent: prompts.length,
        images_returned: images.length,
        estimated_points: log.estimated_points,
        log_id: log.timestamp,
      },
      success: log.success,
    })
  } catch (err) {
    log.errors.push(err.message)
    await logUsage(log)
    return res.status(500).json({ error: 'poe_call_failed', detail: err.message, log })
  }
}

// ─── Server-side helper für direct usage (z.B. von preBuildGate node script) ─
export async function generateForRole(opts) {
  const fakeReq = { method: 'POST', body: opts }
  const fakeRes = {
    _statusCode: 200,
    _payload: null,
    setHeader() {},
    status(c) { this._statusCode = c; return this },
    json(p) { this._payload = p; return this },
    end() { return this },
  }
  await handler(fakeReq, fakeRes)
  return { statusCode: fakeRes._statusCode, ...(fakeRes._payload || {}) }
}
