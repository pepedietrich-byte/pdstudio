/**
 * buildLeadInsights — generates lead-specific score, confidence, and
 * build-readiness analysis from all available sheet data.
 * Every sentence references the actual data — never generic text.
 */

import { getConfidence, getScoreBreakdown } from './sheets'

// ── Score breakdown labels ──────────────────────────────────────────────────
const BREAKDOWN_META = {
  no_https:        { label: 'Keine HTTPS-Verschlüsselung',         hint: 'schadet Google-Ranking und Nutzertrust', group: 'Technisch' },
  not_mobile:      { label: 'Nicht mobiloptimiert',                hint: 'über 60 % der Nutzer kommen per Smartphone', group: 'Technisch' },
  slow_pagespeed:  { label: 'Schlechte Ladegeschwindigkeit',        hint: 'Google PageSpeed unter 50 / 100', group: 'Technisch' },
  missing_legal:   { label: 'Impressum / Datenschutz fehlt',        hint: 'rechtliches Risiko für den Betreiber', group: 'Technisch' },
  weak_seo:        { label: 'SEO-Basics fehlen',                    hint: 'kein Title-Tag, keine Meta-Description, kein H1 oder Schema.org', group: 'Technisch' },
  outdated_design: { label: 'Veraltetes Design / Tech-Stack',       hint: 'WordPress < 5, jQuery-Altlast, Flash, Frames oder keine Viewport-Meta', group: 'Technisch' },
  weak_contact:    { label: 'Kein klickbarer Anruf-Button / Kontaktformular', hint: 'Nutzer können nicht direkt anfragen', group: 'Technisch' },
  weak_hero:       { label: 'Schwacher oder fehlender Hero-Bereich',hint: 'erster Eindruck wirkt amateurhaft oder leer', group: 'Visuell' },
  no_visual_hero:  { label: 'Kein visueller Hero erkannt',          hint: 'Screenshot-Analyse ergab keine ansprechende Eröffnung', group: 'Visuell' },
  no_cta:          { label: 'Kein Call-to-Action above the fold',   hint: 'kein Reservierungs- oder Anruf-Button sichtbar', group: 'Visuell' },
  no_cta_data:     { label: 'CTA-Daten nicht auswertbar',           hint: 'Screenshot-Analyse nicht verfügbar', group: 'Visuell' },
  visual_outdated: { label: 'Visuell veraltet vs. 2026',            hint: 'Benchmark-Vergleich: Modularität und Frische fehlen', group: 'Visuell' },
  visual_no_data:  { label: 'Visuelle Analyse nicht verfügbar',     hint: 'kein Screenshot vom PageSpeed-Service', group: 'Visuell' },
  low_substance:   { label: 'Geringe Google-Substanz',              hint: 'wenig Bewertungen oder Rating unter 4.0 — Reichweite begrenzt', group: 'Potenzial' },
}

const MISSING_FIELD_LABELS = {
  keine_oeffnungszeiten: 'Öffnungszeiten',
  keine_speisekarte:     'Speisekarte / Angebot',
  keine_email:           'E-Mail-Adresse',
  kein_ueber_uns:        'Über-uns-Text',
  keine_adresse:         'Postanschrift',
  kein_telefon:          'Telefonnummer',
  keine_socials:         'Social-Media-Links',
  kein_angebot:          'Leistungsübersicht',
}

// ── Main function ─────────────────────────────────────────────────────────
export function buildLeadInsights(lead) {
  if (!lead) return null

  const score      = +lead.score || 0
  const content    = lead.content    ?? {}
  const validation = lead.validation ?? {}
  const images     = lead.images     ?? {}

  const breakdown    = getScoreBreakdown(lead)
  const hasBreakdown = Object.keys(breakdown).length > 0
  const args         = lead.verkaufsargumente || []

  // ── Score level ──────────────────────────────────────────────────────────
  let scoreLevel, scoreColor, scorePitch
  if (score >= 70) {
    scoreLevel = 'Sehr guter Lead';  scoreColor = '#2ddb72'
    scorePitch = 'Website hat schwere Mängel — Verkaufspitch besonders überzeugend'
  } else if (score >= 50) {
    scoreLevel = 'Guter Lead';       scoreColor = '#2ddb72'
    scorePitch = 'Klare Verbesserungspotenziale erkennbar — guter Gesprächseinstieg'
  } else if (score >= 30) {
    scoreLevel = 'Mittlerer Lead';   scoreColor = '#f5a623'
    scorePitch = 'Moderate Mängel — Pitch möglich, aber Aufwand höher'
  } else {
    scoreLevel = 'Schwacher Lead';   scoreColor = '#ff3b3b'
    scorePitch = 'Website bereits akzeptabel — wenig Verkaufsargument'
  }

  // ── Score narrative ──────────────────────────────────────────────────────
  // Build a lead-specific explanation sentence
  const scoreSentenceParts = []
  if (hasBreakdown) {
    const techPts   = Object.entries(breakdown).filter(([k]) => BREAKDOWN_META[k]?.group === 'Technisch').reduce((s, [,v]) => s + +v, 0)
    const vizPts    = Object.entries(breakdown).filter(([k]) => BREAKDOWN_META[k]?.group === 'Visuell').reduce((s, [,v]) => s + +v, 0)
    const potPts    = Object.entries(breakdown).filter(([k]) => BREAKDOWN_META[k]?.group === 'Potenzial').reduce((s, [,v]) => s + +v, 0)
    if (techPts  > 0) scoreSentenceParts.push(`${techPts} Punkte aus technischen Mängeln`)
    if (vizPts   > 0) scoreSentenceParts.push(`${vizPts} Punkte aus visuellen Schwächen`)
    if (potPts   > 0) scoreSentenceParts.push(`${potPts} Punkte Potenzial-Dämpfer`)
  } else if (args.length > 0) {
    scoreSentenceParts.push(`${args.length} Mängel-Kategorien erkannt`)
  }

  let scoreSummary = `Score ${score}`
  if (scoreSentenceParts.length) scoreSummary += `: ${scoreSentenceParts.join(', ')}.`
  if (lead.google_rating) {
    scoreSummary += ` Google-Rating ${lead.google_rating}★ (${lead.google_reviews || 0} Bew.) bestätigt aktiven Betrieb.`
  }
  scoreSummary += ` ${scorePitch}.`

  // ── Positive factors ─────────────────────────────────────────────────────
  const positives = []
  if (hasBreakdown) {
    if (!breakdown.no_https)       positives.push('HTTPS-Verschlüsselung vorhanden')
    if (!breakdown.not_mobile)     positives.push('Mobile-Darstellung erkannt')
    if (!breakdown.weak_seo)       positives.push('Grundlegende SEO-Tags gesetzt')
    if (!breakdown.missing_legal)  positives.push('Impressum & Datenschutz vorhanden')
    if (!breakdown.weak_contact)   positives.push('Kontaktoptionen auffindbar')
  }
  if (+lead.google_rating >= 4.5) positives.push(`Sehr gutes Rating ${lead.google_rating}★`)
  else if (+lead.google_rating >= 4.0) positives.push(`Solides Rating ${lead.google_rating}★`)
  if (+lead.google_reviews >= 100) positives.push(`Viele Bewertungen (${lead.google_reviews}) → etabliertes Geschäft`)
  if (content.claim_slogan) positives.push('Klar formulierter Claim vorhanden')
  if (content.ueber_uns)    positives.push('Über-uns-Inhalt gefunden')

  // ── Negative factors (from breakdown + args) ─────────────────────────────
  const negatives = hasBreakdown
    ? Object.entries(breakdown).filter(([k, v]) => +v > 0).map(([k, pts]) => ({
        key: k,
        label: BREAKDOWN_META[k]?.label || k,
        hint:  BREAKDOWN_META[k]?.hint  || '',
        pts:   +pts,
        group: BREAKDOWN_META[k]?.group || '?',
      }))
    : args.map((a, i) => ({ key: `arg_${i}`, label: a, hint: '', pts: 0, group: 'Allgemein' }))

  // ── Confidence analysis ──────────────────────────────────────────────────
  const confA1 = getConfidence(lead)        // from LEADS sheet
  const confA2 = Math.min(1, Math.max(0, parseFloat(content.confidence  || 0)))
  const confA4 = Math.min(1, Math.max(0, parseFloat(validation.confidence || 0)))
  const warnings  = lead.warnings   || []
  const warnA2    = Array.isArray(content.warnings) ? content.warnings : (content.warnings || '').split(',').map(s => s.trim()).filter(Boolean)
  const warnA4    = Array.isArray(validation.warnings) ? validation.warnings : (validation.warnings || '').split(',').map(s => s.trim()).filter(Boolean)

  let bestConf, confSource
  if (confA1 > 0)       { bestConf = confA1; confSource = 'A1 Technischer Audit' }
  else if (confA4 > 0.1){ bestConf = confA4; confSource = 'A4 Qualitäts-Validator' }
  else if (confA2 > 0)  { bestConf = confA2; confSource = 'A2 Content-Extraktion' }
  else                  { bestConf = 0;       confSource = 'Keine Audit-Daten' }

  // What reduced confidence
  const confReducers = []
  if (warnings.includes('psi_unavailable'))       confReducers.push('PageSpeed-Daten nicht verfügbar (-15 %)')
  if (warnings.includes('screenshot_failed'))     confReducers.push('Screenshot-Analyse fehlgeschlagen (-10 %)')
  if (warnings.includes('vision_parse_failed'))   confReducers.push('Vision-Auswertung fehlgeschlagen (-20 %)')
  if (warnings.includes('fetch_failed') || warnings.includes('scrape_failed')) confReducers.push('Website nicht erreichbar (-30 %)')
  if (warnA4.includes('source_missing_manual_url')) confReducers.push('Manueller URL-Input — kein technischer Audit')
  if (warnA4.includes('source_missing_lead'))     confReducers.push('Kein vollständiger A1-Lead vorhanden')
  if (warnA4.includes('source_missing_content'))  confReducers.push('Kein vollständiger A2-Content vorhanden')
  if (warnA4.includes('source_missing_images'))   confReducers.push('Kein vollständiger A3-Bildsatz vorhanden')
  if (warnA2.includes('llm_json_failed'))         confReducers.push('LLM-Extraktion teilweise fehlgeschlagen')

  // Secure data
  const secureData = []
  if (lead.website)          secureData.push(`Website erreichbar: ${lead.website}`)
  if (lead.address || content.adresse) secureData.push(`Adresse bekannt: ${lead.address || content.adresse}`)
  if (lead.google_rating)    secureData.push(`Google-Eintrag verifiziert: ${lead.google_rating}★, ${lead.google_reviews || 0} Bew.`)
  if (content.telefon || lead.phone) secureData.push(`Telefon gefunden: ${content.telefon || lead.phone}`)
  if (content.email)         secureData.push(`E-Mail gefunden: ${content.email}`)
  if (hasBreakdown)          secureData.push('Technischer Audit vollständig (PageSpeed, HTTPS, Mobile, SEO)')

  // Missing data — from A2 content missing_fields
  const rawMissing = Array.isArray(content.missing_fields)
    ? content.missing_fields
    : (content.missing_fields || '').split(',').map(s => s.trim()).filter(Boolean)
  const missingData = rawMissing.map(m => MISSING_FIELD_LABELS[m] || m)

  // Uncertain data (what we estimated)
  const uncertainData = []
  if (warnA4.includes('source_missing_manual_url')) uncertainData.push('Score ist Schätzwert — kein vollständiger Technik-Audit gemacht')
  if (!confA1 && bestConf < 0.8)                   uncertainData.push('Visuelle Qualität nur teilweise bewertet')
  if (missingData.includes('Speisekarte / Angebot')) uncertainData.push('Angebots-Vollständigkeit unbekannt')

  // ── Build readiness ──────────────────────────────────────────────────────
  const dqs        = +validation.data_quality_score || 0
  const completeness = +validation.completeness || 0
  const consistency  = +validation.consistency  || 0
  const validity     = +validation.validity     || 0
  const riskLevel    = validation.build_risk_level || ''
  const readyForConcept = validation.ready_for_concept === 'ja' || validation.ready_for_concept === true

  const missingCritical = Array.isArray(validation.missing_critical)
    ? validation.missing_critical
    : (validation.missing_critical || '').split('|').map(s => s.trim()).filter(Boolean)

  const missingOptional = Array.isArray(validation.missing_optional)
    ? validation.missing_optional
    : (validation.missing_optional || '').split('|').map(s => s.trim()).filter(Boolean)

  const ersatzstrategie = Array.isArray(validation.ersatzstrategie)
    ? validation.ersatzstrategie
    : (validation.ersatzstrategie || '').split('|').map(s => s.trim()).filter(Boolean)

  const rueckabeAn = Array.isArray(validation.rueckabe_an)
    ? validation.rueckabe_an
    : (validation.rueckabe_an || '').split('|').map(s => s.trim()).filter(Boolean)

  // ── Business potential ──────────────────────────────────────────────────
  const reviews    = +lead.google_reviews || 0
  const rating     = +lead.google_rating  || 0
  const substance  = Math.round(Math.min(100, reviews * 2))
  const websiteScore = score
  const demoPotential = score >= 60 ? 'Hoch' : score >= 40 ? 'Mittel' : 'Gering'
  const conversionPct = score >= 75 ? 85 : score >= 50 ? 65 : score >= 30 ? 40 : 20

  // ── Next step recommendation ─────────────────────────────────────────────
  let nextStep
  if (readyForConcept) {
    nextStep = 'Daten vollständig → Konzept (A5) erstellen und Website bauen (A6/A7)'
  } else if (missingCritical.length > 0) {
    nextStep = `${missingCritical.length} kritische Lücken schließen (telefonisch nachrecherchieren), dann Konzept erstellen`
  } else if (score >= 60) {
    const phone = content.telefon || lead.phone
    nextStep = phone
      ? `Direkt per Telefon kontaktieren: ${phone}`
      : 'Website-Demo erstellen und persönlich pitchen'
  } else {
    nextStep = 'Lead prüfen — möglicherweise nicht prioritär für sofortigen Kontakt'
  }

  // ── Confidence summary sentence ──────────────────────────────────────────
  let confSummary = `Confidence ${Math.round(bestConf * 100)}% (Quelle: ${confSource}).`
  if (secureData.length >= 3) {
    confSummary += ` Adresse, Website und Google-Eintrag sicher verifiziert.`
  }
  if (missingData.length > 0) {
    confSummary += ` Fehlend: ${missingData.slice(0, 3).join(', ')}${missingData.length > 3 ? ` und ${missingData.length - 3} weitere` : ''}.`
  }
  if (confReducers.length > 0) {
    confSummary += ` Reduziert wegen: ${confReducers[0]}.`
  }

  // ── isManualLead flag ────────────────────────────────────────────────────
  const isManualLead = !hasBreakdown && score === 80 && (
    warnA4.includes('source_missing_manual_url') || !confA1
  )

  return {
    // Score
    scoreLevel, scoreColor, scorePitch, scoreSummary,
    positives, negatives,
    // Confidence
    bestConf, confSource, confA1, confA2, confA4,
    confSummary, confReducers,
    secureData, uncertainData, missingData,
    // Build
    dqs, completeness, consistency, validity,
    riskLevel, readyForConcept,
    missingCritical, missingOptional, ersatzstrategie, rueckabeAn,
    // Business
    substance, demoPotential, conversionPct,
    // Recommendation
    nextStep,
    // Flags
    isManualLead,
    hasBreakdown,
    hasValidation: !!dqs,
    hasContent: !!(content.ueber_uns || content.claim_slogan),
  }
}
