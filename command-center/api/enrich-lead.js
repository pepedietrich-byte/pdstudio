// ─── Lead-Enrichment API ───────────────────────────────────────────────────
// Pepe gibt am Handy eine URL ein. Wir holen alles was wir kriegen können:
//   1. Domain-Fetch (Title, Meta, Schema.org, Plain Text)
//   2. Strukturierte Extraktion via Claude/Poe
//   3. Output: lead-ready Object mit allen Feldern
//
// POST { url: "https://www.spizz.de" }
// Returns: { lead: {...}, confidence, sources }

const POE_API = 'https://api.poe.com/v1/chat/completions'

async function fetchWebsite(url) {
  const r = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 PDSTUDIO-Enrich/1.0' },
    signal: AbortSignal.timeout(15000),
  })
  const html = await r.text()
  return { status: r.status, html, finalUrl: r.url }
}

function extractFromHtml(html, sourceUrl) {
  const extracted = {
    title:       (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || '',
    description: (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i) || [])[1] || '',
    og_title:    (html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/i) || [])[1] || '',
    og_desc:     (html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)/i) || [])[1] || '',
  }

  // Schema.org JSON-LD
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  const schemas = []
  for (const m of ldMatches) {
    try { schemas.push(JSON.parse(m[1].trim())) } catch {}
  }
  extracted.schemas = schemas

  // Plain text (rough)
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
  extracted.plain = plain

  // Phone-Regex (DE formats)
  const phoneMatches = plain.match(/(?:\+49|0)\s?\d{2,4}[\s\/\-]?\d{2,4}[\s\/\-]?\d{2,4}/g) || []
  extracted.phones = [...new Set(phoneMatches)].slice(0, 3)

  // Email-Regex
  const emailMatches = plain.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  extracted.emails = [...new Set(emailMatches)].slice(0, 3)

  // Address heuristik (PLZ-Pattern)
  const addrMatches = plain.match(/[A-ZÄÖÜ][a-zäöüß\-]+(?:\s?str\.?|straße|weg|platz|allee|gasse)\s?\d+[^,]*\,?\s*\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/g) || []
  extracted.addresses = [...new Set(addrMatches)].slice(0, 3)

  // Lieferando/Wolt/Uber Eats links
  const deliveryPatterns = {
    lieferando: /lieferando\.de\/[^\s"'<>]+/gi,
    wolt:       /wolt\.com\/[^\s"'<>]+/gi,
    ubereats:   /ubereats\.com\/[^\s"'<>]+/gi,
    instagram:  /instagram\.com\/([a-zA-Z0-9._-]+)/gi,
  }
  extracted.delivery = {}
  for (const [k, pat] of Object.entries(deliveryPatterns)) {
    const matches = html.match(pat) || []
    if (matches.length > 0) extracted.delivery[k] = matches[0]
  }

  return extracted
}

async function structureWithPoe(extracted, sourceUrl, poeKey) {
  const restaurantSchema = extracted.schemas.find(s =>
    /restaurant|cafe|bar|bakery|foodEstablishment/i.test(JSON.stringify(s)))

  // Wenn Schema.org Restaurant da → nutze direkt
  if (restaurantSchema) {
    const r = restaurantSchema
    return {
      business_name: r.name || extracted.title,
      address:       r.address?.streetAddress
        ? `${r.address.streetAddress}, ${r.address.postalCode || ''} ${r.address.addressLocality || ''}`.trim()
        : extracted.addresses[0] || '',
      phone:         r.telephone || extracted.phones[0] || '',
      email:         extracted.emails[0] || '',
      cuisine:       (Array.isArray(r.servesCuisine) ? r.servesCuisine : [r.servesCuisine]).filter(Boolean).join(', '),
      website_url:   sourceUrl,
      price_range:   r.priceRange || '',
      google_rating: r.aggregateRating?.ratingValue || '',
      google_reviews_count: r.aggregateRating?.reviewCount || '',
      atmosphere:    r.description || extracted.description || '',
      opening_hours: (r.openingHoursSpecification || [])
        .map(s => `${s.dayOfWeek}: ${s.opens}-${s.closes}`).join(', '),
      specials:      '',
      sources_used:  ['schema.org', 'meta-tags'],
    }
  }

  // Sonst Poe Sonnet zum Strukturieren nutzen
  const prompt = `Du bist ein Restaurant-Daten-Extractor. Analysiere folgenden Website-Inhalt und gib STRUKTURIERTES JSON zurück.

URL: ${sourceUrl}
Titel: ${extracted.title}
Beschreibung: ${extracted.description}
OG-Title: ${extracted.og_title}
OG-Desc: ${extracted.og_desc}
Gefundene Telefone: ${extracted.phones.join(', ') || 'keine'}
Gefundene E-Mails: ${extracted.emails.join(', ') || 'keine'}
Gefundene Adressen: ${extracted.addresses.join(', ') || 'keine'}
Delivery-Links: ${JSON.stringify(extracted.delivery)}

CONTENT (8000 char max):
${extracted.plain}

Gib NUR JSON in diesem Schema zurück, keine Erklärung:
{
  "business_name": "...",
  "address": "...",
  "phone": "...",
  "email": "...",
  "cuisine": "z.B. Italienisch, Pizza, Pasta",
  "atmosphere": "Beschreibung der Atmosphäre / Stil",
  "opening_hours": "Mo-Fr 12-22 etc.",
  "specials": "Signature-Gerichte / USPs",
  "price_range": "€/€€/€€€",
  "google_rating": "",
  "google_reviews_count": "",
  "delivery_partners": ["lieferando", "wolt"],
  "instagram_handle": "@...",
  "confidence_per_field": { "business_name": 0.95, "address": 0.8, ... },
  "uncertain_fields": ["phone", "..."],
  "sources_used": ["title", "og:description", "plain_text", "phone_regex"]
}

Wichtig:
- WENN Daten unsicher sind: leer lassen ODER in uncertain_fields aufnehmen
- KEINE erfundenen Daten
- Konfidenzwerte realistisch
- Cuisine spezifisch (nicht "Restaurant" sondern "Italienisch, Pizza")`

  const r = await fetch(POE_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${poeKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Claude-Sonnet-4.6',
      temperature: 0.2,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!r.ok) throw new Error(`Poe extract HTTP ${r.status}`)
  const data = await r.json()
  const content = data.choices?.[0]?.message?.content || '{}'

  // Strip markdown if present
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { error: 'no JSON in Poe response', raw: content }
  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    return { error: 'JSON parse failed', raw: content }
  }
}

function slugify(s) {
  return String(s || 'site').toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' })

  const POE_KEY = process.env.POE_API_KEY
  if (!POE_KEY) return res.status(500).json({ error: 'POE_API_KEY missing' })

  let { url } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url required' })
  if (!/^https?:\/\//.test(url)) url = 'https://' + url

  try {
    // 1. Fetch HTML
    const fetched = await fetchWebsite(url)
    if (fetched.status >= 400) {
      return res.status(200).json({
        success: false,
        error: `Website HTTP ${fetched.status}`,
        lead: { website_url: url },
      })
    }

    // 2. Extract from HTML
    const extracted = extractFromHtml(fetched.html, fetched.finalUrl)

    // 3. Structure with Poe (or Schema.org)
    const structured = await structureWithPoe(extracted, fetched.finalUrl, POE_KEY)

    if (structured.error) {
      return res.status(200).json({
        success: false,
        error: structured.error,
        extracted,
      })
    }

    // 4. Build lead object
    const businessName = structured.business_name || extracted.title || 'Unknown'
    const lead = {
      lead_id:       slugify(businessName),
      business_name: businessName,
      address:       structured.address || '',
      phone:         structured.phone || '',
      email:         structured.email || '',
      website_url:   url,
      cuisine:       structured.cuisine || '',
      atmosphere:    structured.atmosphere || '',
      opening_hours: structured.opening_hours || '',
      specials:      structured.specials || '',
      price_range:   structured.price_range || '€€',
      google_rating: structured.google_rating || '',
      google_reviews_count: structured.google_reviews_count || '',
      delivery_partners:    structured.delivery_partners || [],
      instagram_handle:     structured.instagram_handle || '',
      uncertain_fields:     structured.uncertain_fields || [],
      confidence_per_field: structured.confidence_per_field || {},
      sources_used:         structured.sources_used || [],
      enriched_at:          new Date().toISOString(),
      source:               'enrich-lead-v1',
    }

    return res.json({
      success:    true,
      lead,
      raw_extracted: extracted,
      poe_structured: structured,
    })
  } catch (err) {
    return res.status(500).json({ error: 'enrich_failed', detail: err.message })
  }
}
