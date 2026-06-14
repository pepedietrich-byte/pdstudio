// ─── A6 Fact Checker ────────────────────────────────────────────────────────
// Verifiziert Lead-Daten für Versand-Freigabe.
// Output-Schema gemäß PDSTUDIO Spec:
//   { leadId, businessName, verifiedFacts, uncertainFacts, conflicts,
//     missingCriticalData, priceConfidence, menuConfidence, contactConfidence,
//     factGatePassed, reasons }
//
// Client-side: Format-Validation, Conflict-Detection
// Server-side: api/fact-check.js für HEAD/MX-Validation (optional)

function toStr(v) { return (v == null ? '' : String(v)).trim() }
function isPresent(v) { return toStr(v).length > 0 }

// ── Validators ────────────────────────────────────────────────────────────
function validatePhone(phone) {
  const cleaned = toStr(phone).replace(/[^\d+]/g, '')
  const digitsOnly = cleaned.replace(/^\+/, '')
  if (!cleaned) return { ok: false, reason: 'leer' }
  if (digitsOnly.length < 6) return { ok: false, reason: `nur ${digitsOnly.length} Ziffern` }
  if (digitsOnly.length > 16) return { ok: false, reason: 'zu lang — Format suspekt' }
  // DE-Heuristik: beginnt mit 0 oder +49
  if (!/^(0|\+49|49)/.test(cleaned)) return { ok: 'uncertain', reason: 'kein erkennbares DE-Format' }
  return { ok: true, normalized: cleaned }
}

function validateEmail(email) {
  const e = toStr(email).toLowerCase()
  if (!e) return { ok: false, reason: 'leer' }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) return { ok: false, reason: 'kein valides Format' }
  // Common typos / disposable hints
  if (/(test|temp|fake|example|invalid)/.test(e.split('@')[0])) return { ok: 'uncertain', reason: 'Test-/Wegwerf-Verdacht' }
  if (e.endsWith('.test') || e.endsWith('.invalid') || e.endsWith('.example')) return { ok: false, reason: 'reservierte TLD' }
  return { ok: true, normalized: e }
}

function validateWebsite(url) {
  const u = toStr(url)
  if (!u) return { ok: false, reason: 'leer' }
  if (!/^https?:\/\//i.test(u)) return { ok: 'uncertain', reason: 'kein http(s)-Protokoll' }
  try { new URL(u); return { ok: true, normalized: u, secure: u.toLowerCase().startsWith('https://') } }
  catch { return { ok: false, reason: 'unparsbare URL' } }
}

function validateAddress(address) {
  const a = toStr(address)
  if (!a) return { ok: false, reason: 'leer' }
  const hasStreet = /\d+/.test(a)
  const hasPlz = /\b\d{4,5}\b/.test(a)
  if (!hasStreet && !hasPlz) return { ok: 'uncertain', reason: 'keine Hausnummer und keine PLZ' }
  if (!hasStreet) return { ok: 'uncertain', reason: 'keine Hausnummer erkannt' }
  return { ok: true, normalized: a }
}

function validateOpeningHours(hours) {
  const h = toStr(hours)
  if (!h) return { ok: false, reason: 'leer' }
  if (!/\d{1,2}[:.]\d{2}/.test(h)) return { ok: 'uncertain', reason: 'kein Zeitformat erkannt' }
  return { ok: true, normalized: h }
}

// ── Conflict Detection ────────────────────────────────────────────────────
// Findet Widersprüche zwischen verschiedenen Daten-Quellen
function detectConflicts(lead) {
  const conflicts = []
  const content = lead.content || {}

  // Phone: Sheet vs Content
  if (lead.phone && content.telefon && toStr(lead.phone) !== toStr(content.telefon)) {
    const cleanA = toStr(lead.phone).replace(/[^\d]/g, '')
    const cleanB = toStr(content.telefon).replace(/[^\d]/g, '')
    if (cleanA !== cleanB) {
      conflicts.push({
        field: 'phone',
        values: [lead.phone, content.telefon],
        sources: ['sheet.phone', 'content.telefon'],
        severity: 'review',
      })
    }
  }

  // Address: Sheet vs Content
  if (lead.address && content.adresse && toStr(lead.address) !== toStr(content.adresse)) {
    conflicts.push({
      field: 'address',
      values: [lead.address, content.adresse],
      sources: ['sheet.address', 'content.adresse'],
      severity: 'review',
    })
  }

  // Email duplicate domains check
  if (lead.email && lead.website) {
    const emailDomain = toStr(lead.email).split('@')[1]?.toLowerCase()
    const siteDomain = (() => {
      try { return new URL(lead.website).hostname.replace(/^www\./, '') }
      catch { return null }
    })()
    if (emailDomain && siteDomain && !emailDomain.includes(siteDomain.split('.')[0]) && !siteDomain.includes(emailDomain.split('.')[0])) {
      conflicts.push({
        field: 'email_domain',
        values: [emailDomain, siteDomain],
        sources: ['email.domain', 'website.domain'],
        severity: 'warning',
        reason: 'E-Mail-Domain stimmt nicht mit Website-Domain überein',
      })
    }
  }

  return conflicts
}

// ── Critical Data Check ───────────────────────────────────────────────────
function checkCriticalData(lead) {
  const missing = []
  const critical = {
    business_name: lead.business_name || lead.name,
    address: lead.address || lead.content?.adresse,
    contact: lead.phone || lead.content?.telefon || lead.email,
  }
  for (const [k, v] of Object.entries(critical)) {
    if (!isPresent(v)) missing.push(k)
  }
  return missing
}

// ── Confidence Calculators ────────────────────────────────────────────────
function computeContactConfidence(phoneCheck, emailCheck) {
  let score = 0
  if (phoneCheck.ok === true) score += 50
  else if (phoneCheck.ok === 'uncertain') score += 25
  if (emailCheck.ok === true) score += 50
  else if (emailCheck.ok === 'uncertain') score += 25
  return score
}

function computeMenuConfidence(lead) {
  const sources = []
  if (isPresent(lead.menu_url)) sources.push('menu_url')
  if (isPresent(lead.specials) || isPresent(lead.content?.specials)) sources.push('specials_text')
  if (isPresent(lead.content?.menu) || isPresent(lead.menu)) sources.push('menu_field')
  if (sources.length >= 2) return { score: 90, sources }
  if (sources.length === 1) return { score: 60, sources }
  return { score: 20, sources: [] }
}

function computePriceConfidence(lead) {
  const specials = toStr(lead.specials) + ' ' + toStr(lead.content?.specials)
  const hasPriceMarkers = /€\s?\d|EUR\s?\d|\bab\s?\d|\bvon\s?\d/i.test(specials)
  const hasRange = isPresent(lead.price_range)
  if (lead.menu_source_verified && hasPriceMarkers) return { score: 90, source: 'verified_menu' }
  if (hasPriceMarkers && !lead.menu_source_verified) return { score: 40, source: 'unverified_text' }
  if (hasRange) return { score: 50, source: 'price_range_only' }
  return { score: 20, source: 'no_data' }
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────
export function runFactCheck(lead) {
  if (!lead) throw new Error('runFactCheck: lead required')
  const content = lead.content || {}

  const phoneCheck = validatePhone(lead.phone || content.telefon)
  const emailCheck = validateEmail(lead.email || content.email)
  const websiteCheck = validateWebsite(lead.website)
  const addressCheck = validateAddress(lead.address || content.adresse)
  const hoursCheck = validateOpeningHours(lead.opening_hours || content.oeffnungszeiten)

  const verifiedFacts = {}
  const uncertainFacts = {}
  const reasons = []

  // Resolve each field
  const fieldResolvers = {
    business_name: { value: lead.business_name || lead.name, check: { ok: isPresent(lead.business_name || lead.name) } },
    phone: { value: lead.phone || content.telefon, check: phoneCheck },
    email: { value: lead.email || content.email, check: emailCheck },
    website: { value: lead.website, check: websiteCheck },
    address: { value: lead.address || content.adresse, check: addressCheck },
    opening_hours: { value: lead.opening_hours || content.oeffnungszeiten, check: hoursCheck },
  }

  for (const [field, { value, check }] of Object.entries(fieldResolvers)) {
    if (check.ok === true) {
      verifiedFacts[field] = check.normalized || value
    } else if (check.ok === 'uncertain') {
      uncertainFacts[field] = { value, reason: check.reason }
      reasons.push(`${field}: ${check.reason}`)
    } else if (check.ok === false && value) {
      uncertainFacts[field] = { value, reason: check.reason }
      reasons.push(`${field}: ${check.reason}`)
    }
  }

  const conflicts = detectConflicts(lead)
  const missingCriticalData = checkCriticalData(lead)

  const contactConfidence = computeContactConfidence(phoneCheck, emailCheck)
  const menuConfidenceObj = computeMenuConfidence(lead)
  const priceConfidenceObj = computePriceConfidence(lead)

  // Gate verdict
  let factGatePassed = true
  const blockingReasons = []
  if (missingCriticalData.includes('business_name')) {
    factGatePassed = false
    blockingReasons.push('business_name fehlt')
  }
  if (missingCriticalData.includes('contact')) {
    factGatePassed = false
    blockingReasons.push('Kein Kontaktweg (Telefon oder E-Mail)')
  }
  if (contactConfidence < 25) {
    factGatePassed = false
    blockingReasons.push('Kontakt-Confidence zu niedrig')
  }
  if (conflicts.some(c => c.severity === 'review')) {
    factGatePassed = false
    blockingReasons.push(`${conflicts.filter(c => c.severity === 'review').length} Daten-Konflikt(e) müssen geprüft werden`)
  }

  // Send readiness — stricter than fact gate
  const sendReady = factGatePassed
    && (phoneCheck.ok === true || emailCheck.ok === true)
    && missingCriticalData.length === 0
    && conflicts.filter(c => c.severity === 'review').length === 0

  return {
    leadId: lead.lead_id || lead.id || null,
    businessName: lead.business_name || lead.name || null,
    verifiedFacts,
    uncertainFacts,
    conflicts,
    missingCriticalData,
    priceConfidence: priceConfidenceObj.score,
    priceConfidenceSource: priceConfidenceObj.source,
    menuConfidence: menuConfidenceObj.score,
    menuConfidenceSources: menuConfidenceObj.sources,
    contactConfidence,
    factGatePassed,
    blockingReasons,
    sendReady,
    reasons,
    checks: {
      phone: phoneCheck,
      email: emailCheck,
      website: websiteCheck,
      address: addressCheck,
      opening_hours: hoursCheck,
    },
    checkedAt: new Date().toISOString(),
    factCheckerVersion: 'v1',
  }
}

// ── Async-Erweiterung: Server-side Web-Reachability + MX ──────────────────
// Ruft /api/fact-check für HEAD-Request auf Website + optional MX-Lookup
export async function runFactCheckAsync(lead, { skipNetwork = false } = {}) {
  const localResult = runFactCheck(lead)
  if (skipNetwork || !lead.website) return localResult

  try {
    const r = await fetch('/api/fact-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        website: lead.website,
        email: lead.email || lead.content?.email,
      }),
    })
    if (!r.ok) return { ...localResult, networkCheckFailed: r.status }
    const network = await r.json()

    // Merge network results
    const merged = { ...localResult }
    if (network.website?.reachable === false) {
      merged.uncertainFacts.website = { value: lead.website, reason: `nicht erreichbar (${network.website.reason})` }
      merged.reasons.push('website: nicht erreichbar')
      delete merged.verifiedFacts.website
      merged.factGatePassed = false
      merged.blockingReasons = [...(merged.blockingReasons || []), 'Website nicht erreichbar']
      merged.sendReady = false
    } else if (network.website?.reachable === true) {
      merged.verifiedFacts.website_reachable = true
      merged.verifiedFacts.website_final_url = network.website.finalUrl
    }
    if (network.email?.mx_ok === false) {
      merged.uncertainFacts.email_mx = { value: lead.email, reason: 'kein MX-Record für E-Mail-Domain' }
      merged.reasons.push('email: MX fehlt')
    } else if (network.email?.mx_ok === true) {
      merged.verifiedFacts.email_mx = true
    }
    merged.networkChecked = true
    return merged
  } catch (e) {
    return { ...localResult, networkCheckFailed: e.message }
  }
}
