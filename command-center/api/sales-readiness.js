// ─── Sales Readiness Audit ──────────────────────────────────────────────────
// Post-deploy audit: fetcht die deployte URL und prüft systematisch.
// Score 0-100:  <70 failed · 70-84 needs polish · 85-92 sellable · 93-100 premium sellable
//
// POST { url, business_name, category_id }
// Returns { score, verdict, checks, problems, recommendations }

const PLACEHOLDER_STRINGS = [
  'lorem ipsum', 'TODO', 'undefined', 'null', '[placeholder]', 'placeholder',
  'test restaurant', 'beispieladresse', 'beispiel restaurant',
  'Restaurant Name', 'Your Restaurant', 'restaurantname',
  'temp text', 'sample text', 'dummy text',
]

const CRITERIA = {
  url_reachable:       { weight: 10, label: 'URL erreichbar' },
  http_status_ok:      { weight: 8,  label: 'HTTP 200' },
  has_hero_image:      { weight: 10, label: 'Hero-Bild vorhanden' },
  has_mobile_meta:     { weight: 5,  label: 'Mobile viewport meta' },
  no_placeholders:     { weight: 12, label: 'Keine Placeholder' },
  has_legal_footer:    { weight: 6,  label: 'Footer + Rechtstexte' },
  cta_present:         { weight: 8,  label: 'CTA klickbar erkennbar' },
  business_name_present: { weight: 8, label: 'Firmenname auf Seite' },
  has_schema_org:      { weight: 6,  label: 'Schema.org Markup' },
  no_broken_images:    { weight: 8,  label: 'Keine kaputten Bilder' },
  unique_content:      { weight: 7,  label: 'Individueller Content (kein Generic)' },
  pdstudio_footer:     { weight: 3,  label: 'Erstellt von PDSTUDIO Markenzeichen' },
  noindex_meta:        { weight: 4,  label: 'noindex Meta gesetzt' },
  category_indicators: { weight: 5,  label: 'Kategorie-spezifische Wörter' },
}

function findInHtml(html, term) {
  return html.toLowerCase().includes(term.toLowerCase())
}

function countMatches(html, pattern) {
  const matches = html.match(pattern) || []
  return matches.length
}

async function fetchUrl(url) {
  const r = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'PDSTUDIO-Audit/1.0' } })
  const text = await r.text()
  return { status: r.status, ok: r.ok, text, finalUrl: r.url }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' })

  const { url, business_name = '', category_id = '' } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url required' })

  const audit = {
    url, business_name, category_id,
    audited_at: new Date().toISOString(),
    checks: {},
    problems: [],
    score: 0,
    verdict: 'unknown',
  }

  // Check 1: URL reachable
  let fetchResult
  try {
    fetchResult = await fetchUrl(url)
    audit.checks.url_reachable = { passed: true, detail: `HTTP ${fetchResult.status}` }
  } catch (e) {
    audit.checks.url_reachable = { passed: false, detail: e.message }
    audit.problems.push({ severity: 'critical', code: 'url_unreachable', message: e.message })
    audit.score = 0; audit.verdict = 'failed'
    return res.json(audit)
  }

  audit.checks.http_status_ok = { passed: fetchResult.ok, detail: `HTTP ${fetchResult.status}` }
  if (!fetchResult.ok) {
    audit.problems.push({ severity: 'critical', code: 'http_error', message: `HTTP ${fetchResult.status}` })
  }

  const html = fetchResult.text

  // Check 2: Hero-Bild vorhanden (mind. 1 <img> Tag mit echter URL)
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || []
  const realImages = imgMatches.filter(m => /https?:\/\//.test(m))
  audit.checks.has_hero_image = { passed: realImages.length > 0, detail: `${realImages.length} <img> tags with real URLs` }
  if (realImages.length === 0) {
    audit.problems.push({ severity: 'major', code: 'no_images', message: 'Keine echten <img> tags gefunden' })
  }

  // Check 3: Mobile viewport meta
  audit.checks.has_mobile_meta = { passed: /viewport[^>]+width=device-width/.test(html), detail: '' }
  if (!audit.checks.has_mobile_meta.passed) {
    audit.problems.push({ severity: 'major', code: 'no_mobile_meta', message: 'Mobile viewport meta fehlt' })
  }

  // Check 4: No placeholders
  const foundPlaceholders = PLACEHOLDER_STRINGS.filter(p => findInHtml(html, p))
  audit.checks.no_placeholders = { passed: foundPlaceholders.length === 0, detail: foundPlaceholders.length ? `Found: ${foundPlaceholders.join(', ')}` : 'clean' }
  if (foundPlaceholders.length > 0) {
    audit.problems.push({ severity: 'critical', code: 'placeholders_found', message: `Placeholder-Strings im HTML: ${foundPlaceholders.join(', ')}` })
  }

  // Check 5: Footer + Rechtstexte
  const hasFooter = /<footer/i.test(html)
  const hasImpressum = findInHtml(html, 'impressum')
  const hasDatenschutz = findInHtml(html, 'datenschutz')
  audit.checks.has_legal_footer = { passed: hasFooter && hasImpressum && hasDatenschutz, detail: `footer:${hasFooter} impressum:${hasImpressum} datenschutz:${hasDatenschutz}` }
  if (!hasFooter || !hasImpressum || !hasDatenschutz) {
    audit.problems.push({ severity: 'major', code: 'missing_legal', message: 'Footer/Impressum/Datenschutz unvollständig' })
  }

  // Check 6: CTA klickbar
  const ctaPatterns = [
    /<a[^>]*>(.*?)reservier/i,
    /<a[^>]*>(.*?)bestell/i,
    /<a[^>]*>(.*?)anfrag/i,
    /<a[^>]*href=["']tel:/i,
    /<button[^>]*>(.*?)(reservier|bestell|anfrag)/i,
  ]
  const ctaFound = ctaPatterns.some(p => p.test(html))
  audit.checks.cta_present = { passed: ctaFound, detail: ctaFound ? 'CTA pattern matched' : 'no clear CTA' }
  if (!ctaFound) {
    audit.problems.push({ severity: 'major', code: 'no_cta', message: 'Keine klare CTA erkannt' })
  }

  // Check 7: Business name on page
  if (business_name) {
    const nameOnPage = findInHtml(html, business_name)
    audit.checks.business_name_present = { passed: nameOnPage, detail: nameOnPage ? `"${business_name}" found` : `"${business_name}" missing!` }
    if (!nameOnPage) {
      audit.problems.push({ severity: 'critical', code: 'business_name_missing', message: `Firmenname "${business_name}" nicht auf Seite` })
    }
  } else {
    audit.checks.business_name_present = { passed: true, detail: 'no name to check', skipped: true }
  }

  // Check 8: Schema.org markup
  audit.checks.has_schema_org = { passed: /application\/ld\+json/.test(html), detail: '' }
  if (!audit.checks.has_schema_org.passed) {
    audit.problems.push({ severity: 'minor', code: 'no_schema', message: 'Schema.org JSON-LD fehlt' })
  }

  // Check 9: No broken images (heuristic: alle img-src ist URL und nicht "/placeholder")
  const brokenImgPatterns = [/src=["']\/?placeholder/i, /src=["']data:/i, /src=["']#["']/i, /src=["'][/]*["']/]
  const brokenImg = brokenImgPatterns.some(p => p.test(html))
  audit.checks.no_broken_images = { passed: !brokenImg, detail: brokenImg ? 'placeholder src detected' : 'clean' }
  if (brokenImg) {
    audit.problems.push({ severity: 'major', code: 'broken_image_src', message: 'Bilder mit placeholder/empty src' })
  }

  // Check 10: Unique content (heuristic: 5+ unique sentences mit Restaurant-name)
  const sentences = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').split('. ').filter(s => s.length > 30)
  audit.checks.unique_content = { passed: sentences.length > 5, detail: `${sentences.length} substantial sentences` }
  if (sentences.length <= 5) {
    audit.problems.push({ severity: 'minor', code: 'thin_content', message: 'Content sehr dünn' })
  }

  // Check 11: PDSTUDIO footer
  audit.checks.pdstudio_footer = { passed: findInHtml(html, 'PDSTUDIO') || findInHtml(html, 'pdstudio'), detail: '' }

  // Check 12: noindex meta
  audit.checks.noindex_meta = { passed: /robots[^>]+noindex/i.test(html), detail: '' }
  if (!audit.checks.noindex_meta.passed) {
    audit.problems.push({ severity: 'major', code: 'no_noindex', message: 'noindex Meta fehlt — wird in Google indexiert!' })
  }

  // Check 13: Kategorie-Indikatoren auf Seite
  if (category_id) {
    const categoryKeywords = {
      burger: ['burger', 'patty', 'fries', 'beef', 'craft beer'],
      pizza:  ['pizza', 'mozzarella', 'basilikum', 'forno', 'italienisch'],
      asian:  ['sushi', 'ramen', 'pho', 'wok', 'dumpling', 'asiat'],
      cafe:   ['kaffee', 'brunch', 'kuchen', 'espresso', 'patisserie', 'café'],
      bar:    ['cocktail', 'drinks', 'wein', 'whisky', 'bar'],
      doener: ['döner', 'kebab', 'dürüm', 'türkisch'],
      sushi:  ['sushi', 'sashimi', 'omakase'],
      indian: ['curry', 'tandoor', 'naan', 'biryani', 'masala'],
      bakery: ['bäckerei', 'sourdough', 'croissant', 'patisserie'],
    }
    const kws = categoryKeywords[category_id] || []
    const matched = kws.filter(k => findInHtml(html, k))
    audit.checks.category_indicators = { passed: matched.length >= 2, detail: `${matched.length}/${kws.length} category keywords` }
    if (matched.length < 2) {
      audit.problems.push({ severity: 'major', code: 'category_indicators_low', message: `Nur ${matched.length} Kategorie-Wörter gefunden — Seite wirkt nicht ${category_id}-spezifisch` })
    }
  } else {
    audit.checks.category_indicators = { passed: true, detail: 'no category to check', skipped: true }
  }

  // ─── Score berechnen ──────────────────────────────────────────────────
  let score = 0
  let maxScore = 0
  for (const [key, crit] of Object.entries(CRITERIA)) {
    const check = audit.checks[key]
    if (!check) continue
    maxScore += crit.weight
    if (check.passed) score += crit.weight
  }
  // Normalize to 0-100
  audit.score = Math.round((score / maxScore) * 100)

  // Verdict
  if (audit.score < 70)       audit.verdict = 'failed'
  else if (audit.score < 85)  audit.verdict = 'needs_polish'
  else if (audit.score < 93)  audit.verdict = 'sellable'
  else                        audit.verdict = 'premium_sellable'

  audit.summary = {
    score: audit.score,
    verdict: audit.verdict,
    critical_problems: audit.problems.filter(p => p.severity === 'critical').length,
    major_problems:    audit.problems.filter(p => p.severity === 'major').length,
    minor_problems:    audit.problems.filter(p => p.severity === 'minor').length,
    checks_passed:     Object.values(audit.checks).filter(c => c.passed).length,
    checks_total:      Object.keys(audit.checks).length,
  }
  audit.criteria = CRITERIA

  return res.json(audit)
}
