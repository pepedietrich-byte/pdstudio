// A3 Website Quality Scorer
// POST { demo_url, lead_name, lead_data }
// Uses Gemini 2.5 Flash (cheap + accurate for structured output)
// Fetches HTML, strips noise, scores across 12 criteria

const MODEL = 'Gemini-2.5-Flash'

const SYSTEM_PROMPT = `Du bist ein extrem strenger Website-Qualitäts-Bewerter.
Du bewertest gleichzeitig als:
- Senior UI/UX Designer mit 15 Jahren Agenturerfahrung
- Senior Frontend-Developer
- Potenzieller zahlender Kunde

REGELN:
- Bewerte NIEMALS wohlwollend. Lieber zu streng als zu locker.
- Eine "normale" React-Website mit Tailwind bekommt maximal 65 Punkte.
- 80+ nur bei echter visueller Exzellenz, starken Animationen und perfektem Content.
- 90+ nur bei Weltklasse-Qualität die Agenturen für 10.000€+ berechnen würden.
- Confidence wird DIREKT aus dem Score abgeleitet — nie zufällig.
- Schlechte/fehlende Bilder: -15 bis -25 Punkte.
- Generische KI-Texte: -10 bis -15 Punkte.
- Fehlende Animationen: -10 Punkte.
- Keine echten Restaurant-spezifischen Inhalte: -20 Punkte.

SCORING-TABELLE:
Score 95-100 → confidence 92-100, value 15.000-25.000€
Score 90-94  → confidence 85-91,  value 8.000-15.000€
Score 80-89  → confidence 72-84,  value 4.000-8.000€
Score 70-79  → confidence 55-71,  value 2.000-4.000€
Score 60-69  → confidence 38-54,  value 800-2.000€
Score 50-59  → confidence 22-37,  value 300-800€
Score <50    → confidence <22,     value <300€

Antworte NUR mit JSON. Kein Markdown, kein Text davor oder danach.`

function buildUserPrompt(url, leadName, html, leadData) {
  const tech = 'React 18 + Vite + Tailwind CSS + Framer Motion'
  const truncated = (html || '').slice(0, 40000)

  return `Bewerte diese Restaurant-Website:

URL: ${url}
Name: ${leadName || '—'}
Tech-Stack: ${tech}
Google Rating: ${leadData?.google_rating || '—'}★ (${leadData?.google_reviews || 0} Bewertungen)
Adresse: ${leadData?.address || '—'}

HTML-Inhalt (gekürzt auf 40.000 Zeichen):
\`\`\`
${truncated}
\`\`\`

Bewerte nach diesen 12 Kriterien (je 0-100) und berechne einen gewichteten Gesamt-Score:

1. Designqualität (Gewicht 15%)
2. Modernität / Zeitgeist 2026 (10%)
3. Mobile Experience (10%)
4. UX/UI Klarheit (10%)
5. Animationsqualität (8%)
6. Content-Qualität und Authentizität (12%)
7. Bildqualität und -relevanz (12%)
8. Conversion-Potenzial (8%)
9. Ladeperformance (Einschätzung aus Code) (5%)
10. Markenwirkung / Branding (8%)
11. Vertrauen / Professionalität (7%)
12. Vergleich mit Top-Agenturen (5%)

Gib folgendes JSON zurück:
{
  "overall_score": 0-100,
  "confidence_score": 0-100,
  "estimated_value_eur": 0,
  "grade": "A/B/C/D/F",
  "criteria": {
    "design_quality": 0-100,
    "modernity": 0-100,
    "mobile_experience": 0-100,
    "ux_ui": 0-100,
    "animation_quality": 0-100,
    "content_quality": 0-100,
    "image_quality": 0-100,
    "conversion_potential": 0-100,
    "load_performance": 0-100,
    "brand_impact": 0-100,
    "trust_professionalism": 0-100,
    "agency_comparison": 0-100
  },
  "strengths": ["max 4 konkrete Stärken"],
  "weaknesses": ["max 5 konkrete Schwächen, direkt und ehrlich"],
  "improvement_actions": ["max 5 priorisierte Verbesserungsmaßnahmen"],
  "a5_price_adjustment": "increase/decrease/neutral",
  "a6_trust_factor": 0-100,
  "verdict": "Ein Satz maximale Ehrlichkeit über die Seite"
}`
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]+>/gi, '')
    .replace(/<meta[^>]+>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30000)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const POE_KEY = process.env.POE_API_KEY
  if (!POE_KEY) return res.status(200).json({ error: 'POE_API_KEY nicht konfiguriert' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const { demo_url, lead_name, lead_data = {} } = body || {}
  if (!demo_url) return res.status(400).json({ error: 'demo_url ist erforderlich' })

  // Fetch HTML
  let html = ''
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 12000)
    const r = await fetch(demo_url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 PDSTUDIO-A3-Scorer/1.0' },
    })
    const raw = await r.text()
    html = stripHtml(raw)
  } catch (e) {
    html = `[HTML-Fetch fehlgeschlagen: ${e.message}. Bewerte basierend auf URL und Lead-Daten.]`
  }

  const userPrompt = buildUserPrompt(demo_url, lead_name, html, lead_data)

  try {
    const poeRes = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${POE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!poeRes.ok) {
      const err = await poeRes.text()
      return res.status(200).json({ error: `Poe API Fehler ${poeRes.status}: ${err.slice(0, 200)}` })
    }

    const poeData = await poeRes.json()
    const content = poeData?.choices?.[0]?.message?.content || ''

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(200).json({ error: 'Kein JSON in Antwort', raw: content.slice(0, 500) })

    const score = JSON.parse(jsonMatch[0])
    return res.status(200).json({
      ...score,
      demo_url,
      lead_name,
      model: MODEL,
      scored_at: new Date().toISOString(),
    })
  } catch (e) {
    return res.status(200).json({ error: 'Scoring fehlgeschlagen: ' + e.message })
  }
}
