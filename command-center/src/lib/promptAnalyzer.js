// ─── A6 Premium Prompt Analyzer ─────────────────────────────────────────────
// Erweitert promptBuilder.buildFinalPrompt() um eine Poe-basierte Analyse-Schicht.
//
// Was diese Schicht zusätzlich liefert:
//   - Design-Analyse (Stil-Empfehlung, Farbe, Typo)
//   - Sales-Analyse (Verkaufsargumente, USPs)
//   - Animation-Plan (konkrete Snippets)
//   - Copywriting-Strategie
//   - Prompt-Quality-Score (eigenes Modell)
//   - readyForA7 Verdict + blockingReasons[]

import { buildFinalPrompt } from './promptBuilder'
import { getCategory } from './categoryIntelligence'

const ANALYSIS_SYSTEM = `Du bist ein Senior Web-Designer + Copy-Director.
Du analysierst einen geplanten Restaurant-Website-Build und gibst konkrete strategische Empfehlungen.

REGELN:
- Konkret, nie vage ("modernes Design" ist NICHT akzeptabel — nenne Typo, Spacing, Hierarchie).
- Branche-spezifisch (Pizzeria ≠ Sushi ≠ Burger).
- Keine erfundenen Fakten zum Lead.
- Output: NUR valides JSON. Keine Markdown-Codeblöcke.

OUTPUT-SCHEMA:
{
  "designAnalysis": "2-3 Sätze konkrete Design-Richtung (Typo, Farbe, Layout-Hierarchie)",
  "salesAnalysis": "2-3 Sätze: was diese Site verkaufen muss + warum der Inhaber zahlen wird",
  "animationPlan": "konkrete Animationen mit Triggern (hover, scroll, intersect)",
  "copywritingStrategy": "Tonalität + Schlagworte + emotionale Anker — branchen-spezifisch",
  "noGoRules": ["konkrete Sachen die NICHT in den Build dürfen"]
}`

function buildAnalysisUserPrompt({ lead, gate_report, concept, category_data, approved_assets }) {
  return `Analysiere diesen Build:

RESTAURANT: ${lead.business_name || lead.name}
KATEGORIE: ${gate_report?.summary?.category || '—'} (confidence ${(gate_report?.summary?.category_confidence * 100).toFixed(0)}%)
STADT: ${lead.address || '—'}
GOOGLE: ${lead.google_rating ? `${lead.google_rating}★ bei ${lead.google_reviews || 0} Bewertungen` : '—'}
BESTEHENDE WEBSITE: ${lead.website || 'keine'}

A5 CONCEPT:
- Style ID: ${concept?.style_id || '—'}
- Hero-Composition: ${concept?.hero_composition || '—'}
- Animation-Concept: ${concept?.animation_concept || '—'}

APPROVED ASSETS (${approved_assets?.length || 0}):
${(approved_assets || []).slice(0, 5).map(a => `- ${a.role}: ${a.description || '—'} [Score ${a.score_total || '?'}]`).join('\n')}

CATEGORY DATA:
- Signature Products: ${category_data?.signature_products?.join(', ') || '—'}
- Design Recommendation: ${category_data?.design_recommendation || '—'}
- Forbidden Styles: ${category_data?.forbidden_styles?.join(', ') || 'none'}

Liefere das JSON.`
}

// ── Quality-Score für den finalen Prompt ──────────────────────────────────
function scorePromptQuality(prompt, { concept, approved_assets, analysis } = {}) {
  let score = 50
  const reasons = []

  // Hero-Asset gebunden?
  const hero = (approved_assets || []).find(a => (a.role || '').toLowerCase().includes('hero'))
  if (hero && prompt.includes(hero.url)) {
    score += 10
    reasons.push({ delta: +10, text: 'Hero-Asset explizit gebunden' })
  } else {
    score -= 15
    reasons.push({ delta: -15, text: 'Kein gebundenes Hero-Asset' })
  }

  // A5 Concept eingebunden?
  if (concept?.style_id && prompt.toLowerCase().includes(concept.style_id.toLowerCase())) {
    score += 8
    reasons.push({ delta: +8, text: 'A5 Style-ID gebunden' })
  } else {
    reasons.push({ delta: 0, text: 'A5 Style nicht explizit gebunden' })
  }

  // Animation-Snippets enthalten?
  if (/framer-motion|whileInView|initial=\{|animate=\{|@keyframes/.test(prompt)) {
    score += 8
    reasons.push({ delta: +8, text: 'Animation-Snippets vorhanden' })
  } else {
    score -= 10
    reasons.push({ delta: -10, text: 'Keine Animation-Snippets' })
  }

  // Mobile-Regeln?
  if (/mobile|md:|sm:|lg:/i.test(prompt)) {
    score += 5
    reasons.push({ delta: +5, text: 'Mobile-Regeln vorhanden' })
  } else {
    score -= 5
    reasons.push({ delta: -5, text: 'Keine Mobile-Regeln' })
  }

  // Footer + Rechtstext?
  if (/Impressum|Datenschutz|legal|footer/i.test(prompt)) {
    score += 5
    reasons.push({ delta: +5, text: 'Footer/Rechtstext vorhanden' })
  } else {
    score -= 5
    reasons.push({ delta: -5, text: 'Footer/Rechtstext fehlt' })
  }

  // No-Go-Regeln?
  if (/no_placeholder|NICHT|verboten|niemals/i.test(prompt)) {
    score += 5
    reasons.push({ delta: +5, text: 'No-Go-Regeln explizit' })
  }

  // Schema.org?
  if (/schema\.org|Restaurant.*@type/i.test(prompt)) {
    score += 4
    reasons.push({ delta: +4, text: 'Schema.org gefordert' })
  } else {
    score -= 3
    reasons.push({ delta: -3, text: 'Schema.org nicht explizit' })
  }

  // Vague design words (Penalty)
  const vagueCount = (prompt.match(/\b(modern|sauber|klar|elegant|stylisch|hochwertig)\b/gi) || []).length
  if (vagueCount > 5) {
    score -= 8
    reasons.push({ delta: -8, text: `Zu viele vage Designwörter (${vagueCount})` })
  }

  // Length plausibility
  if (prompt.length < 2000) {
    score -= 15
    reasons.push({ delta: -15, text: 'Prompt zu kurz (<2000 Zeichen)' })
  } else if (prompt.length > 15000) {
    score -= 5
    reasons.push({ delta: -5, text: 'Prompt sehr lang — schwer verdaulich' })
  } else {
    score += 5
    reasons.push({ delta: +5, text: `Prompt-Länge plausibel (${prompt.length})` })
  }

  // Bonus wenn Poe-Analyse erfolgreich eingebaut
  if (analysis && !analysis.error) {
    score += 8
    reasons.push({ delta: +8, text: 'Premium-Analyse eingebaut' })
  }

  // Uncertain data block
  if (/UNSICHER|uncertain|keine\s+konkreten\s+preise/i.test(prompt)) {
    score += 4
    reasons.push({ delta: +4, text: 'Unsichere Daten klar markiert' })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}

// ── Premium Analysis via Poe ──────────────────────────────────────────────
async function callPoeAnalysis(userPrompt) {
  const t0 = Date.now()
  try {
    const r = await fetch('/api/pepe-ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: ANALYSIS_SYSTEM,
        message: userPrompt,
        model: 'Claude-3.7-Sonnet',
      }),
    })
    if (!r.ok) throw new Error(`Poe ${r.status}`)
    const data = await r.json()
    const raw = data.answer || data.text || data.message || ''
    const cleaned = String(raw).replace(/```json\s*|\s*```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match ? match[0] : cleaned)
    return {
      ...parsed,
      poeUsage: [{
        purpose: 'a6_premium_analysis',
        model: 'Claude-3.7-Sonnet',
        durationMs: Date.now() - t0,
        resultStatus: 'ok',
      }],
    }
  } catch (e) {
    return {
      error: e.message,
      poeUsage: [{
        purpose: 'a6_premium_analysis',
        model: 'Claude-3.7-Sonnet',
        durationMs: Date.now() - t0,
        resultStatus: 'error',
      }],
    }
  }
}

// ── Inject analysis into base prompt ──────────────────────────────────────
function augmentPromptWithAnalysis(basePrompt, analysis) {
  if (!analysis || analysis.error) return basePrompt
  const block = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A6 PREMIUM-ANALYSE (Strategie für DIESE Site):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN-RICHTUNG:
${analysis.designAnalysis}

SALES-LOGIK:
${analysis.salesAnalysis}

ANIMATION-PLAN:
${analysis.animationPlan}

COPYWRITING:
${analysis.copywritingStrategy}

NO-GO-REGELN (HARTE PFLICHT):
${(analysis.noGoRules || []).map(r => `  ✗ ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  // Inject vor der "TARGETS" Section in base prompt
  if (basePrompt.includes('TARGETS (NUR diese zwei Dateien anfassen)')) {
    return basePrompt.replace('TARGETS (NUR diese zwei Dateien anfassen)', block + '\nTARGETS (NUR diese zwei Dateien anfassen)')
  }
  return basePrompt + block
}

// ── Hauptfunktion: A6 Premium Build ──────────────────────────────────────
export async function buildPremiumPrompt({
  lead,
  gate_report,
  approved_assets = [],
  concept = null,
  category_data = null,
  usePoeAnalysis = true,
} = {}) {
  if (!lead) throw new Error('buildPremiumPrompt: lead required')
  if (!gate_report) throw new Error('buildPremiumPrompt: gate_report required')
  if (!concept) throw new Error('buildPremiumPrompt: A5 concept required')

  const cat = category_data || (gate_report?.summary?.category ? getCategory(gate_report.summary.category) : null)

  // Step 1: base prompt
  let basePrompt
  try {
    basePrompt = buildFinalPrompt({ lead, gate_report, approved_assets, concept, category_data: cat })
  } catch (e) {
    return {
      leadId: lead.lead_id,
      businessName: lead.business_name,
      category: gate_report?.summary?.category,
      finalBuildPrompt: '',
      promptQualityScore: 0,
      poeUsed: false,
      poeUsage: [],
      readyForA7: false,
      blockingReasons: [`Base-Prompt-Builder Fehler: ${e.message}`],
    }
  }

  // Step 2: Poe analysis (optional)
  let analysis = null
  if (usePoeAnalysis) {
    const analysisPrompt = buildAnalysisUserPrompt({ lead, gate_report, concept, category_data: cat, approved_assets })
    analysis = await callPoeAnalysis(analysisPrompt)
  }

  // Step 3: inject analysis into base prompt
  const finalBuildPrompt = augmentPromptWithAnalysis(basePrompt, analysis)

  // Step 4: quality score
  const quality = scorePromptQuality(finalBuildPrompt, { concept, approved_assets, analysis })

  // Step 5: ready-for-A7 verdict
  const blockingReasons = []
  if (quality.score < 60) blockingReasons.push(`Prompt-Quality-Score ${quality.score} unter 60`)
  if (analysis?.error) blockingReasons.push(`Premium-Analyse fehlgeschlagen: ${analysis.error}`)
  if (gate_report.verdict !== 'proceed' && gate_report.verdict !== 'proceed_forced') {
    blockingReasons.push(`Gate verdict: ${gate_report.verdict}`)
  }
  const hero = (approved_assets || []).find(a => (a.role || '').toLowerCase().includes('hero') && (a.score_total >= 90))
  if (!hero) blockingReasons.push('Kein Hero-Asset mit Score ≥ 90')

  // Validierte vs ausgeschlossene Fakten
  const validatedFactsUsed = {
    business_name: lead.business_name || lead.name,
    address: lead.address,
    phone: lead.phone,
    google_rating: lead.google_rating,
    google_reviews: lead.google_reviews,
    category: gate_report.summary.category,
  }
  const excludedUnsafeFacts = (gate_report.build_context?.uncertain_fields || []).reduce((acc, u) => {
    acc[u.field] = u.reason
    return acc
  }, {})

  return {
    leadId: lead.lead_id,
    businessName: lead.business_name || lead.name,
    category: gate_report.summary.category,
    validatedFactsUsed,
    excludedUnsafeFacts,
    approvedAssetsUsed: (approved_assets || []).map(a => ({ role: a.role, url: a.url, score: a.score_total })),
    conceptSummary: concept?.summary || concept?.style_id || '',
    designAnalysis: analysis?.designAnalysis || null,
    salesAnalysis: analysis?.salesAnalysis || null,
    animationPlan: analysis?.animationPlan || null,
    copywritingStrategy: analysis?.copywritingStrategy || null,
    noGoRules: analysis?.noGoRules || [],
    finalBuildPrompt,
    promptQualityScore: quality.score,
    qualityReasons: quality.reasons,
    poeUsed: usePoeAnalysis && !!analysis && !analysis.error,
    poeUsage: analysis?.poeUsage || [],
    readyForA7: blockingReasons.length === 0,
    blockingReasons,
    builtAt: new Date().toISOString(),
    promptBuilderVersion: 'buildPremiumPrompt-v1',
  }
}
