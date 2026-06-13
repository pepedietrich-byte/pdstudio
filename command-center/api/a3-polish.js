// A3 Polish Agent — Poe FLUX image generation
// POST body: { lead_name, cuisine_type, color_mood, count }
// Returns: { images: [{url, prompt}], status }

const POE_MODELS = {
  flux: 'Flux-Pro-1.1',
  fallback: 'Gemini-2.5-Flash',
}

function buildImagePrompts(leadName, cuisineType, colorMood, count = 5) {
  const cuisine = cuisineType || 'Indian'
  const mood = colorMood || 'warm, dark, premium'
  const base = `Professional restaurant food photography, ${cuisine} cuisine, ${mood} lighting, editorial quality, no text, no watermarks, high resolution, atmospheric`

  return [
    { slot: 'hero',    prompt: `${base}, wide shot of ${cuisine} restaurant interior, elegant dining atmosphere, candle light, luxury ambiance, cinematic` },
    { slot: 'food1',   prompt: `${base}, hero shot of signature ${cuisine} dish, close up, steam rising, saffron and spices, dark background` },
    { slot: 'food2',   prompt: `${base}, overhead flat lay of ${cuisine} feast, multiple dishes, authentic tableware, warm tones` },
    { slot: 'food3',   prompt: `${base}, dramatic side-lit portrait of ${cuisine} curry in bowl, rich sauce, garnished, dark moody backdrop` },
    { slot: 'ambiance',prompt: `${base}, ${cuisine} restaurant ambiance, bokeh lights, intimate corner table, elegant decor, warm golden hour` },
    { slot: 'spices',  prompt: `${base}, colorful ${cuisine} spices and herbs arranged artfully, turmeric, coriander, cardamom, rustic backdrop` },
  ].slice(0, count)
}

async function generateWithPoe(prompt, apiKey) {
  const r = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: POE_MODELS.flux,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    }),
  })
  if (!r.ok) throw new Error(`Poe HTTP ${r.status}`)
  const data = await r.json()

  // Image model returns content array with image_url type
  const content = data?.choices?.[0]?.message?.content
  if (Array.isArray(content)) {
    const img = content.find(c => c.type === 'image_url')
    if (img?.image_url?.url) return img.image_url.url
  }
  // Some models return plain text URL
  if (typeof content === 'string' && content.startsWith('http')) return content
  throw new Error('No image in response: ' + JSON.stringify(content).slice(0, 200))
}

// Fallback: curated Unsplash search queries per slot
const UNSPLASH_FALLBACKS = {
  hero:    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85&auto=format&fit=crop',
  food1:   'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85&auto=format&fit=crop',
  food2:   'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=85&auto=format&fit=crop',
  food3:   'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=85&auto=format&fit=crop',
  ambiance:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85&auto=format&fit=crop',
  spices:  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=85&auto=format&fit=crop',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const POE_KEY = process.env.POE_API_KEY
  const { lead_name = '', cuisine_type = 'Indian', color_mood = 'warm dark premium', count = 5 } = req.body || {}

  const prompts = buildImagePrompts(lead_name, cuisine_type, color_mood, count)
  const results = []

  for (const { slot, prompt } of prompts) {
    let url = null
    let source = 'poe_flux'

    if (POE_KEY) {
      try {
        url = await generateWithPoe(prompt, POE_KEY)
      } catch (e) {
        console.error(`Poe failed for ${slot}:`, e.message)
        url = null
      }
    }

    // Fallback to Unsplash
    if (!url) {
      url = UNSPLASH_FALLBACKS[slot] || UNSPLASH_FALLBACKS.food1
      source = 'unsplash_fallback'
    }

    results.push({ slot, url, prompt, source })
  }

  return res.status(200).json({
    images: results,
    lead_name,
    cuisine_type,
    generated_at: new Date().toISOString(),
    poe_available: !!POE_KEY,
  })
}
