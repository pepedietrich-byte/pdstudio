// ─── A1 SIGN ──────────────────────────────────────────────────────
// Reine Client-seitige Lead-Bewertung gemäß PDSTUDIO Sales-Kriterien.
//
// Bewertet ob ein Lead für PDSTUDIO Restaurant-Demo verkaufbar ist.
// Nimmt das Lead-Objekt aus dem Google Sheet, gibt strukturiertes JSON zurück.
//
// Kein API-Call nötig — deterministisch und sofort lieferbar.
// Optional: assistedReasons() reichert die Reasons via Poe an (nicht hier).

import { detectCategory } from './categoryIntelligence'

const DELIVERY_HOSTS = [
  'lieferando.de', 'wolt.com', 'uber.com', 'ubereats',
  'takeaway.com', 'delivery-hero', 'foodora',
]

const SUITABLE_CATEGORIES = new Set([
  'restaurant', 'pizzeria', 'burger', 'asian', 'sushi', 'italian',
  'cafe', 'bakery', 'bistro', 'steakhouse', 'mexican', 'greek',
  'turkish', 'vietnamese', 'thai', 'indian',
])

const UNSUITABLE_CATEGORIES = new Set([
  'kiosk', 'tankstelle', 'getraenkemarkt',
])

// ── Helper ────────────────────────────────────────────────────────────────
function toStr(v) { return (v == null ? '' : String(v)).trim() }
function isPresent(v) { return toStr(v).length > 0 }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

// ── Kriterien-Checks ──────────────────────────────────────────────────────
// Jeder Check liefert { weight, score, reason, signals }
// score ∈ [0, 1]  → 1 = positiv für Verkauf, 0 = negativ

function checkWebsiteQuality(lead) {
  const url = toStr(lead.website || lead.website_url)
  if (!isPresent(url)) {
    return { weight: 10, score: 1.0, reason: 'Keine eigene Website — maximaler Bedarf für Demo', signals: ['no_website'] }
  }
  const isHttps = url.startsWith('https://')
  const isDelivery = DELIVERY_HOSTS.some(d => url.toLowerCase().includes(d))
  if (isDelivery) {
    return { weight: 10, score: 0.9, reason: 'Nur Lieferplattform-Profil (Lieferando/Wolt) — keine echte Website', signals: ['delivery_only'] }
  }
  if (!isHttps) {
    return { weight: 10, score: 0.8, reason: 'Website ohne HTTPS — veraltet, Sicherheitsproblem', signals: ['no_https'] }
  }
  // Mit Website: weiches Signal, eigentliche Qualität bewertet A3
  return { weight: 10, score: 0.4, reason: 'Bestehende Website mit HTTPS — Bedarf nur bei sichtbarer Schwäche', signals: ['has_website'] }
}

function checkDeliveryPlatforms(lead) {
  const platforms = []
  const sources = [
    toStr(lead.website),
    toStr(lead.delivery_platforms),
    toStr(lead.lieferando_url),
    toStr(lead.wolt_url),
  ].join(' ').toLowerCase()
  for (const host of DELIVERY_HOSTS) {
    if (sources.includes(host)) platforms.push(host.split('.')[0])
  }
  if (platforms.length > 0) {
    return {
      weight: 4, score: 0.7,
      reason: `Aktiv auf ${platforms.join(', ')} — zahlt Provision, hat Interesse an Online-Präsenz`,
      signals: ['uses_delivery_platforms'],
      platforms,
    }
  }
  return { weight: 4, score: 0.3, reason: 'Keine Lieferplattform erkannt', signals: [], platforms: [] }
}

function checkGoogleReviews(lead) {
  const rating = parseFloat(lead.google_rating || lead.googleRating || 0)
  const count = parseInt(lead.google_reviews || lead.googleReviews || lead.review_count || 0, 10)
  if (!rating && !count) {
    return { weight: 8, score: 0.2, reason: 'Keine Google-Reviews-Daten — schwache Datenlage', signals: ['no_google_data'] }
  }
  // Aktiv mit guten Reviews → starker Beweis dass Betrieb läuft = bezahlt
  if (rating >= 4.2 && count >= 50) {
    return { weight: 8, score: 1.0, reason: `Starke Google-Präsenz (${rating}★ bei ${count} Bewertungen) — Betrieb läuft, kann sich Investition leisten`, signals: ['strong_reviews'] }
  }
  if (rating >= 4.0 && count >= 20) {
    return { weight: 8, score: 0.85, reason: `Solide Google-Präsenz (${rating}★ bei ${count} Bewertungen)`, signals: ['solid_reviews'] }
  }
  if (rating >= 3.5 && count >= 10) {
    return { weight: 8, score: 0.6, reason: `Brauchbare Google-Präsenz (${rating}★ bei ${count} Bewertungen) — Lead möglich`, signals: ['weak_reviews'] }
  }
  if (rating < 3.5 && count >= 10) {
    return { weight: 8, score: 0.3, reason: `Schwache Google-Bewertung (${rating}★) — Konversionsrisiko`, signals: ['bad_rating'] }
  }
  return { weight: 8, score: 0.4, reason: `Wenig Daten (${count} Bewertungen) — neuer Betrieb oder unentdeckt`, signals: ['few_reviews'] }
}

function checkCategoryFit(lead) {
  const det = detectCategory(lead || {})
  const cat = (lead.category_override || det.category || '').toLowerCase()
  const conf = lead.category_override ? 1.0 : (det.confidence || 0)
  if (!cat) {
    return { weight: 7, score: 0.2, reason: 'Kategorie nicht erkennbar', signals: ['no_category'], detectedCategory: null, subcategory: det.subcategory || null }
  }
  if (UNSUITABLE_CATEGORIES.has(cat)) {
    return { weight: 7, score: 0.1, reason: `Branche "${cat}" für PDSTUDIO Demo ungeeignet`, signals: ['unsuitable_category'], detectedCategory: cat, subcategory: det.subcategory || null }
  }
  if (SUITABLE_CATEGORIES.has(cat)) {
    return {
      weight: 7, score: 0.7 + clamp(conf * 0.3, 0, 0.3),
      reason: `Branche "${cat}" passt zum PDSTUDIO Portfolio (Confidence ${(conf * 100).toFixed(0)}%)`,
      signals: ['suitable_category'],
      detectedCategory: cat,
      subcategory: det.subcategory || null,
    }
  }
  return { weight: 7, score: 0.5, reason: `Branche "${cat}" möglich, aber kein Standard-Use-Case`, signals: ['neutral_category'], detectedCategory: cat, subcategory: det.subcategory || null }
}

function checkDataConfidence(lead) {
  const fields = {
    business_name: isPresent(lead.business_name || lead.name),
    website_or_delivery: isPresent(lead.website),
    address: isPresent(lead.address) || isPresent(lead.content?.adresse),
    phone: isPresent(lead.phone) || isPresent(lead.content?.telefon),
    email: isPresent(lead.email) || isPresent(lead.content?.email),
    google_rating: !!parseFloat(lead.google_rating || 0),
  }
  const present = Object.entries(fields).filter(([, v]) => v).map(([k]) => k)
  const missing = Object.entries(fields).filter(([, v]) => !v).map(([k]) => k)
  const score = present.length / Object.keys(fields).length
  return {
    weight: 6,
    score,
    reason: `${present.length}/${Object.keys(fields).length} Pflichtfelder vorhanden${missing.length ? ' — fehlen: ' + missing.join(', ') : ''}`,
    signals: missing.length ? ['missing_data'] : ['complete_data'],
    fields_present: present,
    fields_missing: missing,
  }
}

function checkMenuPricing(lead) {
  const menuHints = [
    lead.menu_url, lead.menu, lead.speisekarte, lead.content?.menu,
    lead.content?.specials, lead.content?.preise, lead.specials,
  ].some(isPresent)
  if (menuHints) {
    return { weight: 5, score: 0.9, reason: 'Speisekarte/Preise online auffindbar — solide Datenbasis für Demo', signals: ['menu_present'] }
  }
  return { weight: 5, score: 0.3, reason: 'Speisekarte/Preise nicht extrahiert — A2 Content-Extraktion nötig', signals: ['no_menu'] }
}

function checkSocialMedia(lead) {
  const sm = [
    lead.instagram, lead.instagram_url, lead.facebook, lead.facebook_url,
    lead.content?.instagram, lead.content?.facebook,
  ].some(isPresent)
  if (sm) {
    return { weight: 3, score: 0.85, reason: 'Social-Media-Präsenz vorhanden — zusätzliche Asset-Quelle für A3', signals: ['has_social'] }
  }
  return { weight: 3, score: 0.4, reason: 'Keine Social-Media-Profile erkannt', signals: ['no_social'] }
}

function checkContactability(lead) {
  const phone = toStr(lead.phone || lead.content?.telefon)
  const email = toStr(lead.email || lead.content?.email)
  const hasPhone = phone && /[\d]{6,}/.test(phone.replace(/[^\d]/g, ''))
  const hasEmail = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  if (hasPhone && hasEmail) {
    return { weight: 5, score: 1.0, reason: 'Telefon + E-Mail verifizierbar — Outreach möglich', signals: ['full_contact'] }
  }
  if (hasPhone || hasEmail) {
    return { weight: 5, score: 0.6, reason: hasPhone ? 'Nur Telefon — E-Mail recherchieren' : 'Nur E-Mail — Telefon recherchieren', signals: ['partial_contact'] }
  }
  return { weight: 5, score: 0.1, reason: 'Kein verlässlicher Kontaktweg — Outreach blockiert', signals: ['no_contact'] }
}

function checkDemoBuildPotential(lead, categoryCheck, dataCheck) {
  // Heuristik: Demo-Build möglich wenn Kategorie passt + genug Daten + Name vorhanden
  const hasName = isPresent(lead.business_name || lead.name)
  const dataOk = dataCheck.score >= 0.5
  const catOk = categoryCheck.score >= 0.5
  if (hasName && dataOk && catOk) {
    return { weight: 6, score: 0.9, reason: 'Sofortiger Demo-Build technisch machbar', signals: ['build_ready'] }
  }
  if (hasName && (dataOk || catOk)) {
    return { weight: 6, score: 0.6, reason: 'Demo-Build möglich, aber Datenanreicherung nötig', signals: ['build_needs_enrichment'] }
  }
  return { weight: 6, score: 0.2, reason: 'Datengrundlage zu schwach für sofortigen Demo-Build', signals: ['build_blocked'] }
}

function checkSalesPotential(lead, reviewsCheck) {
  // Heuristik: laufender Betrieb mit Reviews → bezahlt
  const rating = parseFloat(lead.google_rating || 0)
  const count = parseInt(lead.google_reviews || 0, 10)
  if (rating >= 4.0 && count >= 50) {
    return { weight: 4, score: 0.95, reason: 'Etablierter Betrieb mit gutem Ruf — hohe Zahlungsbereitschaft erwartbar', signals: ['high_sales_potential'] }
  }
  if (count >= 20) {
    return { weight: 4, score: 0.7, reason: 'Aktiver Betrieb — realistische Zahlungsbereitschaft', signals: ['medium_sales_potential'] }
  }
  return { weight: 4, score: 0.4, reason: 'Unklare wirtschaftliche Lage — Zahlungsbereitschaft offen', signals: ['unclear_sales_potential'], reviewsScore: reviewsCheck.score }
}

// ── Haupt-Qualifier ───────────────────────────────────────────────────────
export function qualifyLead(lead) {
  if (!lead) throw new Error('qualifyLead: lead required')

  const website = checkWebsiteQuality(lead)
  const delivery = checkDeliveryPlatforms(lead)
  const reviews = checkGoogleReviews(lead)
  const category = checkCategoryFit(lead)
  const dataConf = checkDataConfidence(lead)
  const menu = checkMenuPricing(lead)
  const social = checkSocialMedia(lead)
  const contact = checkContactability(lead)
  const demoBuild = checkDemoBuildPotential(lead, category, dataConf)
  const salesPot = checkSalesPotential(lead, reviews)

  const checks = [website, delivery, reviews, category, dataConf, menu, social, contact, demoBuild, salesPot]
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const weightedScore = checks.reduce((s, c) => s + c.weight * c.score, 0)
  let leadScore = Math.round((weightedScore / totalWeight) * 100)

  // ── Verkaufs-Bonus: etablierter Betrieb OHNE eigene Website = Goldstandard ─
  // (das ist DAS PDSTUDIO Verkaufsargument)
  const isEstablished = reviews.signals.includes('strong_reviews') || reviews.signals.includes('solid_reviews')
  const needsWebsite = website.signals.includes('no_website') || website.signals.includes('delivery_only') || website.signals.includes('no_https')
  const bonusReasons = []
  if (isEstablished && needsWebsite && category.score >= 0.6) {
    const bonus = 15
    leadScore = Math.min(100, leadScore + bonus)
    bonusReasons.push({ weight: 0, score: 1, impact: bonus, reason: `Goldstandard-Bonus: etablierter Betrieb (${reviews.signals.join(',')}) ohne adäquate Website`, signals: ['gold_bonus'] })
  } else if (isEstablished && needsWebsite) {
    const bonus = 8
    leadScore = Math.min(100, leadScore + bonus)
    bonusReasons.push({ weight: 0, score: 1, impact: bonus, reason: 'Sales-Bonus: etablierter Betrieb mit Website-Bedarf', signals: ['sales_bonus'] })
  }
  // ── Reject-Penalty: ungeeignete Branche ─────────────────────────────────
  if (category.signals.includes('unsuitable_category')) {
    leadScore = Math.min(leadScore, 40)
    bonusReasons.push({ weight: 0, score: 0, impact: -20, reason: 'Branchen-Penalty: für PDSTUDIO Portfolio ungeeignet', signals: ['category_penalty'] })
  }

  // Weaknesses + opportunities derivation
  const weaknesses = []
  const opportunities = []
  if (website.signals.includes('no_website')) weaknesses.push('Keine eigene Website')
  if (website.signals.includes('delivery_only')) weaknesses.push('Nur Lieferplattform-Profil')
  if (website.signals.includes('no_https')) weaknesses.push('Veraltete Website (kein HTTPS)')
  if (reviews.signals.includes('bad_rating')) weaknesses.push('Schwache Google-Bewertung')
  if (contact.signals.includes('no_contact')) weaknesses.push('Kein Kontaktweg verifiziert')
  if (menu.signals.includes('no_menu')) weaknesses.push('Speisekarte nicht online auffindbar')
  if (social.signals.includes('no_social')) weaknesses.push('Keine Social-Media-Präsenz')

  if (reviews.signals.includes('strong_reviews')) opportunities.push('Reputation vorhanden — Demo verdient kein Aufwand für Trust-Aufbau, fokus auf Conversion')
  if (delivery.signals.includes('uses_delivery_platforms')) opportunities.push('Zahlt bereits Plattform-Provision — Wechsel zu eigener Site spart Geld')
  if (website.signals.includes('no_website') || website.signals.includes('delivery_only')) opportunities.push('Maximaler Verbesserungssprung möglich (von 0 auf Premium)')

  const availableSources = []
  if (isPresent(lead.website)) availableSources.push('website')
  if (delivery.platforms?.length) availableSources.push(...delivery.platforms)
  if (parseFloat(lead.google_rating)) availableSources.push('google_reviews')
  if (isPresent(lead.instagram) || isPresent(lead.instagram_url)) availableSources.push('instagram')
  if (isPresent(lead.facebook) || isPresent(lead.facebook_url)) availableSources.push('facebook')

  // Recommended next action
  let recommendedNextAction
  if (leadScore < 50) {
    recommendedNextAction = 'Nicht bauen — Datenlage oder Branchen-Fit unzureichend. Lead archivieren oder enrichen.'
  } else if (leadScore < 70) {
    recommendedNextAction = 'Schwach — nur speichern. Wenn Zeit: A2 Content-Extraktion + A6 FactCheck zur Datenanreicherung.'
  } else if (leadScore < 80) {
    recommendedNextAction = 'Möglich — erst A2/A3 zur Anreicherung, dann erneut prüfen.'
  } else if (leadScore < 90) {
    recommendedNextAction = 'Guter Lead — Demo-Build (A2) und A4 Mail vorbereiten.'
  } else {
    recommendedNextAction = 'Top Lead — sofort A2 Build + A4 Mail-Sequenz starten.'
  }

  // Score reasons in user-requested format
  const scoreReasons = checks.map(c => ({
    weight: c.weight,
    score: Math.round(c.score * 100) / 100,
    impact: Math.round(c.weight * c.score * 10) / 10,
    reason: c.reason,
    signals: c.signals,
  })).concat(bonusReasons)

  return {
    leadId: lead.lead_id || lead.id || null,
    businessName: lead.business_name || lead.name || null,
    category: category.detectedCategory,
    subcategory: category.subcategory,
    city: toStr(lead.city) || extractCityFromAddress(lead.address || lead.content?.adresse) || null,
    currentWebsite: toStr(lead.website) || null,
    deliveryPlatforms: delivery.platforms,
    googleRating: parseFloat(lead.google_rating) || null,
    reviewCount: parseInt(lead.google_reviews, 10) || null,
    weaknesses,
    opportunities,
    availableSources,
    demoBuildPotential: Math.round(demoBuild.score * 100),
    salesPotential: Math.round(salesPot.score * 100),
    dataConfidence: Math.round(dataConf.score * 100),
    recommendedNextAction,
    leadScore,
    scoreReasons,
    scoreBand: getScoreBand(leadScore),
    qualifiedAt: new Date().toISOString(),
    qualifierVersion: 'v1',
  }
}

function extractCityFromAddress(address) {
  if (!isPresent(address)) return null
  const parts = toStr(address).split(',').map(s => s.trim())
  if (parts.length < 2) return null
  const last = parts[parts.length - 1].replace(/, Deutschland$/, '')
  const m = last.match(/\d{4,5}\s+([A-Za-zÄÖÜäöüß\s-]+)/)
  if (m) return m[1].trim()
  return last.replace(/^\d{4,5}\s*/, '').trim() || null
}

export function getScoreBand(score) {
  if (score >= 90) return { id: 'top', label: 'Top Lead', color: '#2ddb72', action: 'sofort A2 + A4' }
  if (score >= 80) return { id: 'good', label: 'Guter Lead', color: '#39ff88', action: 'A2 + A4 vorbereiten' }
  if (score >= 70) return { id: 'check', label: 'Möglich, prüfen', color: '#f5a623', action: 'A2/A3 zur Anreicherung' }
  if (score >= 50) return { id: 'weak', label: 'Schwach, nur speichern', color: '#9ca3b5', action: 'enrichen' }
  return { id: 'reject', label: 'Nicht bauen', color: '#ef4444', action: 'archivieren' }
}

// ── Bulk-Helfer ───────────────────────────────────────────────────────────
export function qualifyLeads(leads) {
  return (leads || []).map(l => {
    try { return qualifyLead(l) }
    catch (e) { return { leadId: l?.lead_id, error: e.message, leadScore: 0 } }
  })
}
