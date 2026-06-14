// ─── A7 Build Acceptance Gate ───────────────────────────────────────────────
// Läuft NACH A7-Build, VOR "polished"-Markierung.
// Validiert den generierten React-Code (App.jsx) + HTML gegen harte Kriterien.
// Verhindert dass mittelmäßige Builds als "premium" / "sales-ready" markiert werden.
//
// Acceptance-Schwelle: total >= 85 + keine blocking issues.

const CRITERIA = {
  // ── Strukturelle Pflichten (blocking) ─────────────────────────────────
  has_hero: {
    weight: 12, blocking: true, label: 'Hero-Section vorhanden',
    test: (code) => /hero|<h1|first-screen|min-h-screen|h-screen/i.test(code),
  },
  has_cta: {
    weight: 10, blocking: true, label: 'CTA klar erkennbar',
    test: (code) => /(reservierung|reservieren|jetzt\s+(buchen|anrufen|reservieren)|book|kontakt|callcta|tel:)/i.test(code),
  },
  has_footer: {
    weight: 6, blocking: true, label: 'Footer vorhanden',
    test: (code) => /<footer|class=["'][^"']*footer/i.test(code),
  },
  has_legal: {
    weight: 8, blocking: true, label: 'Impressum + Datenschutz',
    test: (code) => /(impressum)/i.test(code) && /(datenschutz)/i.test(code),
  },
  mobile_responsive: {
    weight: 8, blocking: true, label: 'Mobile-Responsive (Tailwind oder CSS)',
    test: (code) => {
      // Mehrere Mobile-Strategien akzeptieren: Tailwind, Media-Queries, clamp(), CSS-Variablen
      const tailwindHits = (code.match(/\b(sm|md|lg|xl):[a-z0-9-]+/g) || []).length
      const mediaQueries = (code.match(/@media[^{]*\(\s*(max|min)-width/gi) || []).length
      const clampUses = (code.match(/\bclamp\s*\(/g) || []).length
      const viewportUnits = (code.match(/\b\d+(vw|vh|vmin|vmax)\b/g) || []).length
      return tailwindHits >= 15 || mediaQueries >= 3 || (clampUses >= 5 && viewportUnits >= 3)
    },
  },

  // ── Qualitäts-Pflichten (severity = critical) ─────────────────────────
  has_animations: {
    weight: 8, blocking: false, label: 'Animationen (framer-motion oder CSS)',
    test: (code) => {
      const jsxHits = (code.match(/framer-motion|whileInView|whileHover|initial=\{|animate=\{|transition=\{/g) || []).length
      const cssHits = (code.match(/@keyframes|animation\s*:|animation-name|animation-delay|transition\s*:/g) || []).length
      return (jsxHits + cssHits) >= 5
    },
  },
  has_schema_org: {
    weight: 6, blocking: false, label: 'Schema.org Restaurant Markup',
    // Schema.org steht meist im index.html — wir prüfen den combined-Code wenn beide übergeben sind
    test: (code, ctx) => {
      const combined = code + ' ' + (ctx?.indexHtmlContent || '')
      return /schema\.org|application\/ld\+json/i.test(combined)
        && /Restaurant|FoodEstablishment|LocalBusiness/i.test(combined)
    },
  },
  has_demo_notice: {
    weight: 4, blocking: false, label: 'Demo-Hinweis (PDSTUDIO Markierung)',
    test: (code, ctx) => {
      const combined = code + ' ' + (ctx?.indexHtmlContent || '')
      return /demo[- ]?(erstellt|version)|by\s*pdstudio|erstellt von pdstudio|pdstudio/i.test(combined)
    },
  },
  has_noindex: {
    weight: 4, blocking: false, label: 'noindex Meta-Tag',
    // noindex steht im HTML — wir prüfen den indexHtmlContent
    test: (code, ctx) => {
      const combined = code + ' ' + (ctx?.indexHtmlContent || '')
      return /name=["']robots["']\s+content=["'][^"']*noindex/i.test(combined)
    },
  },

  // ── Anti-Patterns (negative weights — Penalty wenn gefunden) ──────────
  no_placeholders: {
    weight: 12, blocking: true, label: 'Keine Placeholder',
    test: (code) => {
      const placeholders = [
        /lorem\s+ipsum/i, /\[placeholder\]/i, /\bplaceholder\s+(text|content)/i,
        /restaurant\s+name(?!\s*:)/i, /your\s+restaurant/i, /sample\s+text/i,
        /test\s+restaurant/i, /beispiel\s*restaurant/i, /TODO/,
      ]
      return !placeholders.some(p => p.test(code))
    },
  },
  no_fake_prices: {
    weight: 6, blocking: false, label: 'Keine erfundenen Preise',
    test: (code, ctx) => {
      if (ctx?.pricing_safe?.use_concrete_prices !== false) return true
      // Wenn pricing_safe verbietet → KEIN konkreter Preis darf im Code stehen
      return !/€\s?\d+([.,]\d+)?|EUR\s?\d+/.test(code)
    },
  },
  no_generic_words_overload: {
    weight: 4, blocking: false, label: 'Keine Designwort-Inflation',
    test: (code) => {
      const vague = (code.match(/\b(modern|sauber|stylish|hochwertig|premium|elegant)\b/gi) || []).length
      return vague < 20 // Tailwind-Klassen täuschen, daher höhere Schwelle
    },
  },

  // ── A5/A6 Verwendung verifizieren ─────────────────────────────────────
  uses_concept_style: {
    weight: 6, blocking: false, label: 'A5 Concept-Style verwendet',
    test: (code, ctx) => {
      if (!ctx?.concept?.style_id) return true // wenn kein concept gesetzt: nicht penalisieren
      const styleHints = ctx.concept.style_id.toLowerCase().split('_')
      return styleHints.some(h => h.length > 3 && code.toLowerCase().includes(h))
    },
  },
  uses_approved_hero_url: {
    weight: 6, blocking: true, label: 'Approved Hero-URL eingebunden',
    test: (code, ctx) => {
      const hero = (ctx?.approved_assets || []).find(a => (a.role || '').toLowerCase().includes('hero'))
      if (!hero?.url) return true // kein Hero erwartet
      return code.includes(hero.url)
    },
  },
}

// ── HTML-only Checks ──────────────────────────────────────────────────────
const HTML_CRITERIA = {
  has_title: {
    weight: 4, blocking: true, label: '<title> vorhanden + nicht leer',
    test: (html) => /<title[^>]*>[^<]{3,}<\/title>/i.test(html),
  },
  has_meta_description: {
    weight: 4, blocking: false, label: 'Meta-Description gesetzt',
    test: (html) => /<meta\s+name=["']description["']\s+content=["'][^"']{20,}/i.test(html),
  },
  has_viewport: {
    weight: 4, blocking: true, label: 'Mobile-Viewport Meta',
    test: (html) => /name=["']viewport["']\s+content=["'][^"']*width=device-width/i.test(html),
  },
  has_google_fonts: {
    weight: 3, blocking: false, label: 'Google Fonts geladen',
    test: (html) => /fonts\.googleapis|fonts\.gstatic/i.test(html),
  },
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────
export function evaluateBuild({ appCode = '', indexHtml = '', context = {} }) {
  const reasons = []
  const blockingFails = []

  let totalScore = 0
  let totalWeight = 0
  const checkResults = []

  // Augment context with HTML so combined-checks (schema, noindex, demo-notice) work
  const enrichedCtx = { ...context, indexHtmlContent: indexHtml }

  // Code-Checks
  for (const [key, c] of Object.entries(CRITERIA)) {
    const passed = c.test(appCode, enrichedCtx)
    totalWeight += c.weight
    if (passed) totalScore += c.weight
    else if (c.blocking) blockingFails.push(c.label)
    checkResults.push({ key, label: c.label, passed, blocking: c.blocking, weight: c.weight })
  }

  // HTML-Checks
  for (const [key, c] of Object.entries(HTML_CRITERIA)) {
    const passed = c.test(indexHtml, context)
    totalWeight += c.weight
    if (passed) totalScore += c.weight
    else if (c.blocking) blockingFails.push(c.label)
    checkResults.push({ key, label: c.label, passed, blocking: c.blocking, weight: c.weight, scope: 'html' })
  }

  const normalizedScore = Math.round((totalScore / totalWeight) * 100)

  // Verdict
  let verdict, verdictColor
  if (blockingFails.length > 0) {
    verdict = 'blocked'
    verdictColor = '#ef4444'
    reasons.push(`${blockingFails.length} blocking criteria failed: ${blockingFails.join(', ')}`)
  } else if (normalizedScore >= 85) {
    verdict = 'polished'
    verdictColor = '#39ff88'
    reasons.push('All blocking criteria passed + score ≥ 85')
  } else if (normalizedScore >= 70) {
    verdict = 'needs_polish'
    verdictColor = '#f5a623'
    reasons.push(`Score ${normalizedScore} below 85 — Polish-Pass empfohlen`)
  } else {
    verdict = 'failed'
    verdictColor = '#ef4444'
    reasons.push(`Score ${normalizedScore} below 70 — Build verworfen`)
  }

  // A5/A6 Verwendung Check separat
  const a5Used = checkResults.find(r => r.key === 'uses_concept_style')?.passed
  const a6PromptUsed = !!context?.builtWithPromptBuilder
  const a6PremiumUsed = context?.builtWithPromptBuilder === 'buildPremiumPrompt-v1'

  // Failed checks for repair
  const failedChecks = checkResults.filter(r => !r.passed)
  const repairTasks = failedChecks.map(r => ({
    agent: r.blocking ? 'A2' : 'A3',
    severity: r.blocking ? 'blocking' : 'warning',
    label: r.label,
    weight: r.weight,
  }))

  return {
    verdict,
    verdictColor,
    score: normalizedScore,
    rawScore: totalScore,
    maxScore: totalWeight,
    blockingFails,
    reasons,
    failedChecks: failedChecks.map(r => ({ label: r.label, weight: r.weight, blocking: r.blocking })),
    passedChecks: checkResults.filter(r => r.passed).map(r => r.label),
    checks: checkResults,
    repairTasks,
    metadata: {
      a5_used: !!a5Used,
      a6_prompt_used: a6PromptUsed,
      a6_premium_used: a6PremiumUsed,
      approved_assets_count: (context?.approved_assets || []).length,
      hero_score: context?.approved_assets?.find(a => (a.role || '').toLowerCase().includes('hero'))?.score_total || null,
    },
    evaluatedAt: new Date().toISOString(),
    gateVersion: 'v1',
  }
}

// ── Convenience: fetch site URL + run check ────────────────────────────────
export async function evaluateBuildFromUrl(url, context = {}) {
  if (!url) throw new Error('URL required')
  try {
    const r = await fetch(`/api/sales-readiness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, business_name: context?.lead?.business_name, category_id: context?.gate_report?.summary?.category }),
    })
    if (!r.ok) throw new Error(`sales-readiness ${r.status}`)
    const data = await r.json()
    // sales-readiness gibt schon ein ähnliches Schema — wir nutzen seine checks + augmentieren
    return {
      verdict: data.verdict || (data.score >= 85 ? 'polished' : data.score >= 70 ? 'needs_polish' : 'failed'),
      score: data.score,
      problems: data.problems || [],
      recommendations: data.recommendations || [],
      networkAudit: true,
      auditedUrl: url,
    }
  } catch (e) {
    return { verdict: 'audit_failed', error: e.message, networkAudit: false }
  }
}
