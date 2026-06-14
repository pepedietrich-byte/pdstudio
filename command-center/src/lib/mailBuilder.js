// ─── A4 Human Writer — Mail Builder ─────────────────────────────────────────
// Generiert 3 Verkaufs-Mail-Varianten aus validierten Lead-Daten.
// Nutzt Poe API via /api/pepe-ask (verfügbarer Proxy).
//
// Voraussetzung: A6 FactCheck factGatePassed === true.
// Output gemäß PDSTUDIO Spec:
//   { subject, previewText, emailBody, personalizationPoints[],
//     riskFlags[], confidence, sendReady, reasonIfNotSendReady[] }

const VARIANT_PROMPTS = {
  short: {
    label: 'Kurz & Direkt',
    tone: 'kurz, direkt, sachlich. Maximal 90 Wörter Body. Keine Floskeln. Klarer CTA.',
    audience: 'beschäftigter Restaurant-Inhaber, hat keine Zeit, will sofort den Punkt sehen.',
  },
  consultative: {
    label: 'Freundlich & Beratend',
    tone: 'persönlich, beratend, freundlich. 120-160 Wörter Body. Anerkennung des Bestehenden, dann Verbesserungsidee. Soft-CTA.',
    audience: 'Inhaber der stolz auf seinen Betrieb ist und nicht aggressiv verkauft werden will.',
  },
  premium: {
    label: 'Premium-Agentur',
    tone: 'selbstbewusst, professionell, knapp aber hochwertig. 100-140 Wörter Body. Konkret was du baust, nicht warum. Klarer Mehrwert-Hook.',
    audience: 'gehobenes Restaurant, Inhaber mit Designsinn, erwartet Agentur-Niveau.',
  },
}

const SYSTEM_BASE = `Du bist Pepe Dietrich von PDSTUDIO — schreibst persönliche, ehrliche Verkaufs-E-Mails an Restaurant-Inhaber in Deutschland.

ABSOLUTE NO-GOS:
- KEINE Angstmacherei ("Sie verlieren Kunden", "Ihre Konkurrenz ist Ihnen voraus")
- KEINE übertriebenen KI-Floskeln ("In der heutigen digitalen Welt…")
- KEINE erfundenen Fakten oder Statistiken
- KEINE Preise nennen die nicht verifiziert sind
- KEINE generischen Templates — jeder Satz muss auf DIESEN Lead passen
- KEIN Druck, keine Dringlichkeitstricks ("Nur heute!")
- KEINE Demo-Bewertung ohne dass du sie wirklich gesehen hast

PFLICHT:
- Anrede mit echtem Namen wenn vorhanden, sonst "Guten Tag,"
- Bezug auf den konkreten Betrieb (Name + ein konkretes Detail)
- 1 klarer Mehrwert
- 1 sichtbares Problem (nur wenn echt vorhanden) — ohne herabwürdigen
- Demo-Link als Soft-Show ("Hier ein erster Entwurf:")
- Signatur: "Pepe — PDSTUDIO"
- Sprache: Deutsch, sieze konsequent

OUTPUT:
NUR valides JSON ohne Markdown-Codeblöcke. Schema:
{
  "subject": "Betreff max 60 Zeichen",
  "previewText": "Preview-Text 80-110 Zeichen",
  "emailBody": "Body in Plain Text mit \\n\\n als Absätzen",
  "personalizationPoints": ["konkretes Detail 1", "Detail 2"],
  "riskFlags": ["falls ein riskanter Satz drin ist, hier nennen"]
}`

function buildUserPrompt(lead, factCheck, variant) {
  const v = VARIANT_PROMPTS[variant]
  const f = factCheck?.verifiedFacts || {}
  const businessName = f.business_name || lead.business_name || lead.name || ''
  const phone = f.phone || ''
  const website = f.website || lead.website || ''
  const address = f.address || ''
  const reviewsLine = lead.google_rating
    ? `${lead.google_rating}★ bei ${lead.google_reviews || lead.google_reviews_count || 0} Bewertungen`
    : 'keine Google-Daten'
  const cuisine = lead.cuisine || ''
  const ownerName = lead.owner_name || lead.contact_person || ''
  const demoUrl = lead.demo_url || lead.preview_url || '[DEMO_URL_AFTER_BUILD]'
  const concreteDetail = lead.specials || lead.content?.specials || lead.signature_dish || ''

  return `Schreibe Variante "${v.label}".

TON: ${v.tone}
ZIELPERSON: ${v.audience}

VERIFIZIERTE FAKTEN (NUR DIESE nutzen):
- Betrieb: ${businessName}
- Inhaber: ${ownerName || '(unbekannt — generisch ansprechen)'}
- Standort: ${address || '—'}
- Telefon: ${phone || '—'}
- Website (Ist-Zustand): ${website || 'keine eigene Website'}
- Google: ${reviewsLine}
- Branche: ${cuisine || '—'}
- Konkretes Detail: ${concreteDetail || '(keins extrahiert — fokus auf Standort/Reviews)'}
- Demo-Link: ${demoUrl}

UNSICHERE DATEN (NICHT benutzen):
${Object.keys(factCheck?.uncertainFacts || {}).map(k => `- ${k}: ${factCheck.uncertainFacts[k].reason}`).join('\n') || '(keine)'}

KONTEXT-AUFHÄNGER (frei wählen, max 1 nutzen):
${factCheck?.contactConfidence >= 75 ? '- starker Online-Auftritt' : ''}
${(lead.google_rating || 0) >= 4.3 ? `- Top-Reputation (${lead.google_rating}★) — Website sollte das spiegeln` : ''}
${(lead.website || '').includes('lieferando') ? '- nur Lieferando-Profil — Sie zahlen Provision für Sichtbarkeit die Sie auch direkt haben könnten' : ''}
${!lead.website ? '- keine eigene Website — Sichtbarkeit komplett bei Google/Bewertungen' : ''}

Antworte mit dem JSON. Kein Vorwort, kein Markdown.`
}

// ── Heuristic Quality Checks ──────────────────────────────────────────────
function detectRiskFlags(emailBody) {
  const flags = []
  const text = String(emailBody || '').toLowerCase()
  const riskyPhrases = [
    { pattern: /sie\s+verlieren\s+kunden/i, flag: 'Angstmacherei: "Sie verlieren Kunden"' },
    { pattern: /ihre\s+konkurrenz/i, flag: 'Konkurrenz-Druck' },
    { pattern: /\bnur\s+heute\b|\bjetzt\s+aktion\b/i, flag: 'Fake-Dringlichkeit' },
    { pattern: /in\s+der\s+heutigen.*digitalen/i, flag: 'KI-Floskel "in der heutigen digitalen Welt"' },
    { pattern: /\b\d+\s*%\s+(mehr|umsatz|gäste)/i, flag: 'Versprochene Statistik — als Fakt riskant' },
    { pattern: /€\s?\d+|EUR\s?\d+/i, flag: 'Konkreter Preis — wenn nicht verifiziert: Risiko' },
    { pattern: /garantiert/i, flag: 'Wort "garantiert" — rechtlich heikel' },
    { pattern: /ki\s+optimiert|ai\s+powered/i, flag: 'KI-Buzzword' },
  ]
  for (const { pattern, flag } of riskyPhrases) {
    if (pattern.test(text)) flags.push(flag)
  }
  return flags
}

function scoreConfidence({ emailBody, personalizationPoints, lead, factCheck, riskFlags }) {
  let score = 50
  // Personalisierung
  if ((personalizationPoints?.length || 0) >= 2) score += 15
  else if ((personalizationPoints?.length || 0) >= 1) score += 8
  // Name in Body
  const name = lead.business_name || lead.name || ''
  if (name && emailBody?.includes(name)) score += 10
  // Demo URL eingebunden
  if (emailBody?.includes('[DEMO_URL_AFTER_BUILD]')) score -= 10  // noch kein echter Link
  else if (/https?:\/\//.test(emailBody || '')) score += 5
  // Risk Flags
  score -= riskFlags.length * 8
  // Body-Länge plausibel
  const bodyLen = (emailBody || '').length
  if (bodyLen < 200 || bodyLen > 1800) score -= 10
  // FactCheck-Zustand
  if (factCheck?.sendReady) score += 10
  else if (factCheck?.factGatePassed) score += 3
  else score -= 15
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ── Haupt-Funktion ────────────────────────────────────────────────────────
export async function generateMailVariant(lead, factCheck, variant) {
  if (!VARIANT_PROMPTS[variant]) throw new Error(`Unknown variant: ${variant}`)
  if (!lead) throw new Error('lead required')

  const userPrompt = buildUserPrompt(lead, factCheck, variant)

  const r = await fetch('/api/pepe-ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: SYSTEM_BASE,
      message: userPrompt,
      model: 'Claude-3.7-Sonnet', // beste deutsche Textqualität
    }),
  })
  if (!r.ok) throw new Error(`Mail API ${r.status}`)
  const data = await r.json()
  const raw = data.answer || data.text || data.message || ''

  // Robust JSON parse — Markdown-Codeblöcke abstreifen falls vorhanden
  let parsed
  try {
    const cleaned = String(raw).replace(/```json\s*|\s*```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match ? match[0] : cleaned)
  } catch {
    return {
      variant,
      variantLabel: VARIANT_PROMPTS[variant].label,
      subject: '',
      previewText: '',
      emailBody: raw,
      personalizationPoints: [],
      riskFlags: ['JSON-Parse fehlgeschlagen — Modell-Output unstrukturiert'],
      confidence: 0,
      sendReady: false,
      reasonIfNotSendReady: ['JSON parse failed'],
      rawOutput: raw,
    }
  }

  const riskFlags = [...(parsed.riskFlags || []), ...detectRiskFlags(parsed.emailBody)]
  const confidence = scoreConfidence({
    emailBody: parsed.emailBody,
    personalizationPoints: parsed.personalizationPoints,
    lead,
    factCheck,
    riskFlags,
  })

  const reasonIfNotSendReady = []
  if (!factCheck?.sendReady) reasonIfNotSendReady.push('FactCheck nicht send-ready')
  if (riskFlags.length > 0) reasonIfNotSendReady.push(`${riskFlags.length} Risk-Flags im Body`)
  if (confidence < 60) reasonIfNotSendReady.push(`Confidence ${confidence}% unter 60%`)

  return {
    variant,
    variantLabel: VARIANT_PROMPTS[variant].label,
    subject: parsed.subject || '',
    previewText: parsed.previewText || '',
    emailBody: parsed.emailBody || '',
    personalizationPoints: parsed.personalizationPoints || [],
    riskFlags,
    confidence,
    sendReady: reasonIfNotSendReady.length === 0,
    reasonIfNotSendReady,
    generatedAt: new Date().toISOString(),
    mailBuilderVersion: 'v1',
  }
}

export async function generateAllMailVariants(lead, factCheck) {
  if (!factCheck?.factGatePassed) {
    return {
      blocked: true,
      reason: 'FactCheck nicht bestanden — Mails sind nicht versendefähig',
      blockingReasons: factCheck?.blockingReasons || [],
    }
  }
  const variants = Object.keys(VARIANT_PROMPTS)
  // Parallel — schneller, 3 Poe Calls
  const results = await Promise.all(variants.map(async v => {
    try { return await generateMailVariant(lead, factCheck, v) }
    catch (e) {
      return {
        variant: v,
        variantLabel: VARIANT_PROMPTS[v].label,
        error: e.message,
        confidence: 0,
        sendReady: false,
      }
    }
  }))
  return { blocked: false, variants: results, generatedAt: new Date().toISOString() }
}

export const MAIL_VARIANTS = VARIANT_PROMPTS
