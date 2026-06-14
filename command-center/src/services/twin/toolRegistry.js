// ─── TWIN PEPE Tool Registry ────────────────────────────────────────────────
// Zentrale Registry aller Tools die TWIN PEPE im Command Center ausführen kann.
//
// Permission-Level:
//   safe_action        — direkt ausführbar (reads, scoring, analysis)
//   expensive_action   — Bestätigung nötig (Poe-Calls, Hero-Generation)
//   destructive_action — Bestätigung + Lock (Site löschen, archivieren)
//   external_send_action — Bestätigung + zusätzlicher Warning-Step (Mails versenden)

import { qualifyLead } from '../../lib/leadQualifier'
import { runFactCheck, runFactCheckAsync } from '../../lib/factChecker'
import { generateAllMailVariants, generateMailVariant } from '../../lib/mailBuilder'
import { buildPremiumPrompt } from '../../lib/promptAnalyzer'
import { buildFinalPrompt } from '../../lib/promptBuilder'
import { analyzeAssets } from '../../lib/assetAnalysis'
import { runPreBuildGate } from '../../lib/preBuildGate'
import { generateConcept } from '../../lib/conceptArchitect'
import { triggerWebsiteBuild, triggerAgent } from '../../lib/n8n'

export const PERMISSION_LEVELS = {
  safe_action: { label: 'Safe', color: '#39ff88', confirmRequired: false },
  expensive_action: { label: 'Cost', color: '#f5a623', confirmRequired: true, reason: 'Verbraucht Poe-Punkte' },
  destructive_action: { label: 'Destructive', color: '#ef4444', confirmRequired: true, reason: 'Irreversibel' },
  external_send_action: { label: 'Send', color: '#9b6ef3', confirmRequired: true, reason: 'Externe Empfänger werden kontaktiert' },
}

// ── Tool-Definitionen ──────────────────────────────────────────────────────
// Jedes Tool: name, description, permission, requiredParams, handler(params, ctx)
export const TOOLS = [
  // ── READ / ANALYSIS ─────────────────────────────────────────────────────
  {
    name: 'lead.qualify',
    description: 'Lead-Score + Begründungen berechnen (A1 Qualifier)',
    keywords: ['qualif', 'prüf lead', 'bewert lead', 'lead score', 'lead anschauen'],
    permission: 'safe_action',
    requiredParams: ['lead'],
    async handler({ lead }) {
      return { ok: true, result: qualifyLead(lead) }
    },
  },
  {
    name: 'lead.factCheck',
    description: 'Fakten verifizieren — Telefon/E-Mail/Website/Address (A6)',
    keywords: ['fakten', 'verifizier', 'fact', 'kontakt prüf', 'sendready'],
    permission: 'safe_action',
    requiredParams: ['lead'],
    async handler({ lead, skipNetwork = false }) {
      const result = skipNetwork ? runFactCheck(lead) : await runFactCheckAsync(lead)
      return { ok: true, result }
    },
  },
  {
    name: 'assets.analyze',
    description: 'Asset-Qualität bewerten + Hero auswählen (A3)',
    keywords: ['asset', 'bild prüf', 'hero', 'bilder bewert', 'asset score'],
    permission: 'safe_action',
    requiredParams: ['lead', 'assets'],
    async handler({ lead, assets }) {
      return { ok: true, result: analyzeAssets(lead, assets) }
    },
  },
  {
    name: 'gate.run',
    description: 'PreBuildGate ausführen (alle 5 Gates)',
    keywords: ['gate', 'preBuild', 'check vor build', 'build allowed'],
    permission: 'safe_action',
    requiredParams: ['lead'],
    async handler({ lead, assets = [], requestedStyle = null }) {
      return { ok: true, result: runPreBuildGate({ lead, assets, requestedStyle }) }
    },
  },
  {
    name: 'concept.generate',
    description: 'A5 Concept erzeugen (Style + Composition + Animation)',
    keywords: ['concept', 'konzept', 'a5', 'style id'],
    permission: 'safe_action',
    requiredParams: ['lead'],
    async handler({ lead, gate_report }) {
      return { ok: true, result: generateConcept({ lead, gate_report }) }
    },
  },

  // ── EXPENSIVE (Poe-Calls) ───────────────────────────────────────────────
  {
    name: 'mail.generate3',
    description: '3 Mail-Varianten generieren via Poe (A4)',
    keywords: ['mail', 'mails bauen', 'outreach', 'email schreib', 'a4'],
    permission: 'expensive_action',
    cost: { poeCalls: 3, model: 'Claude-3.7-Sonnet' },
    requiredParams: ['lead'],
    async handler({ lead, factCheck }) {
      const fc = factCheck || runFactCheck(lead)
      return { ok: true, result: await generateAllMailVariants(lead, fc) }
    },
  },
  {
    name: 'mail.generateOne',
    description: 'Eine Mail-Variante generieren (short/consultative/premium)',
    keywords: ['mail variante', 'eine mail', 'mail kurz', 'mail premium'],
    permission: 'expensive_action',
    cost: { poeCalls: 1, model: 'Claude-3.7-Sonnet' },
    requiredParams: ['lead', 'variant'],
    async handler({ lead, variant = 'consultative', factCheck }) {
      const fc = factCheck || runFactCheck(lead)
      return { ok: true, result: await generateMailVariant(lead, fc, variant) }
    },
  },
  {
    name: 'prompt.buildPremium',
    description: 'A6 Premium-Prompt mit Poe-Design+Sales-Analyse',
    keywords: ['premium prompt', 'a6 premium', 'analyse prompt', 'design analyse'],
    permission: 'expensive_action',
    cost: { poeCalls: 1, model: 'Claude-3.7-Sonnet' },
    requiredParams: ['lead', 'gate_report', 'concept'],
    async handler(params) {
      return { ok: true, result: await buildPremiumPrompt(params) }
    },
  },
  {
    name: 'prompt.buildStandard',
    description: 'A6 Standard-Prompt (deterministisch, ohne Poe)',
    keywords: ['standard prompt', 'normaler prompt', 'final prompt'],
    permission: 'safe_action',
    requiredParams: ['lead', 'gate_report', 'concept'],
    async handler(params) {
      return { ok: true, result: { prompt: buildFinalPrompt(params) } }
    },
  },
  {
    name: 'hero.regenerate',
    description: 'Hero-Bild via Poe neu generieren wenn Score < 90',
    keywords: ['hero generier', 'bild generier', 'poe hero', 'nano banana'],
    permission: 'expensive_action',
    cost: { poeCalls: 1, model: 'FLUX-Pro-1.1' },
    requiredParams: ['lead', 'category'],
    async handler({ lead, category, prompt }) {
      const r = await fetch('/api/poe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.lead_id, category, prompt, role: 'hero' }),
      })
      if (!r.ok) return { ok: false, error: `Poe Image API ${r.status}` }
      return { ok: true, result: await r.json() }
    },
  },

  // ── BUILD / DEPLOY ─────────────────────────────────────────────────────
  {
    name: 'build.trigger',
    description: 'A7 Website-Build + Deploy starten',
    keywords: ['build start', 'baue site', 'deploy', 'a7', 'website bau'],
    permission: 'destructive_action',
    requiredParams: ['lead'],
    async handler({ lead, options }) {
      return { ok: true, result: await triggerWebsiteBuild(lead.lead_id, options || {}) }
    },
  },
  {
    name: 'agent.trigger',
    description: 'Einen n8n-Agenten starten (A1, A2, etc.)',
    keywords: ['agent start', 'agent ausführen', 'webhook'],
    permission: 'expensive_action',
    requiredParams: ['agentId'],
    async handler({ agentId, params }) {
      return { ok: true, result: await triggerAgent(agentId, params || {}) }
    },
  },

  // ── OUTREACH ────────────────────────────────────────────────────────────
  {
    name: 'mail.send',
    description: 'Mail an Lead versenden (echtes Outreach)',
    keywords: ['mail senden', 'verschick', 'outreach send'],
    permission: 'external_send_action',
    requiredParams: ['lead', 'mail'],
    async handler({ lead, mail }) {
      // Hinweis: Aktuell kein Mail-Send-Backend. Sicheres Fallback:
      return {
        ok: false,
        error: 'Mail-Send-Backend nicht konfiguriert',
        notImplemented: true,
        hint: `Mail manuell versenden: ${lead.email || lead.content?.email || 'keine E-Mail im Lead'}`,
        draft: mail,
      }
    },
  },

  // ── HELPERS / RECOMMENDATIONS ──────────────────────────────────────────
  {
    name: 'pipeline.nextAction',
    description: 'Nächste sinnvolle Aktion für diesen Lead empfehlen',
    keywords: ['nächste aktion', 'was tun', 'was nun', 'recommend', 'empfehlung'],
    permission: 'safe_action',
    requiredParams: ['lead'],
    async handler({ lead }) {
      const qual = qualifyLead(lead)
      const fact = runFactCheck(lead)
      let next
      if (!fact.factGatePassed) next = 'A6 FactCheck blockiert — fehlende Daten ergänzen: ' + fact.blockingReasons.join(', ')
      else if (qual.leadScore < 50) next = 'Lead-Score unter 50 — archivieren'
      else if (qual.leadScore < 70) next = 'A2 Content-Extraktion zur Anreicherung'
      else if (!fact.sendReady) next = 'A6 Konflikte/Unsicherheit prüfen vor Mail-Versand'
      else if (qual.leadScore < 90) next = 'A2 Demo bauen + A4 Mail vorbereiten'
      else next = 'Top-Lead — sofort A2 Build + A4 Mail-Sequenz'
      return {
        ok: true,
        result: { leadScore: qual.leadScore, factGatePassed: fact.factGatePassed, sendReady: fact.sendReady, nextAction: next },
      }
    },
  },
  {
    name: 'pipeline.full',
    description: 'Komplette Pipeline für Lead durchlaufen (A1+A6+A3+A5+A6Premium)',
    keywords: ['komplett pipeline', 'alles', 'voller durchlauf', 'all the things'],
    permission: 'expensive_action',
    cost: { poeCalls: 2, model: 'mixed' },
    requiredParams: ['lead', 'assets'],
    async handler({ lead, assets = [] }) {
      const steps = []
      try {
        const qual = qualifyLead(lead); steps.push({ step: 'A1', score: qual.leadScore, band: qual.scoreBand.id })
        const fact = await runFactCheckAsync(lead); steps.push({ step: 'A6FactCheck', passed: fact.factGatePassed, sendReady: fact.sendReady })
        const assetA = analyzeAssets(lead, assets); steps.push({ step: 'A3', heroReady: assetA.summary.heroReady, gatePassed: assetA.assetGatePassed })
        const gate = runPreBuildGate({ lead, assets }); steps.push({ step: 'PreBuildGate', verdict: gate.verdict })
        if (gate.verdict === 'proceed') {
          const concept = generateConcept({ lead, gate_report: gate }); steps.push({ step: 'A5', styleId: concept.style_id })
          const premium = await buildPremiumPrompt({ lead, gate_report: gate, approved_assets: assets.filter(a => a.verdict === 'hero_ready' || a.verdict === 'usable'), concept })
          steps.push({ step: 'A6Premium', readyForA7: premium.readyForA7, qualityScore: premium.promptQualityScore })
          return { ok: true, result: { steps, finalPromptReady: premium.readyForA7, finalPrompt: premium.finalBuildPrompt } }
        }
        return { ok: true, result: { steps, blocked: true, reason: 'Gate failed' } }
      } catch (e) {
        return { ok: false, error: e.message, partialSteps: steps }
      }
    },
  },
  {
    name: 'site.archive',
    description: 'Demo-Site archivieren (markiert als inactive)',
    keywords: ['site archivier', 'demo entfern', 'inactive'],
    permission: 'destructive_action',
    requiredParams: ['lead'],
    async handler({ lead }) {
      return {
        ok: false,
        error: 'Site-Archivierung über n8n-Workflow — noch nicht implementiert',
        notImplemented: true,
        hint: `Manuell: Sheet-Zeile ${lead.lead_id} status auf "archived" setzen`,
      }
    },
  },
]

// ── Tool-Lookup ───────────────────────────────────────────────────────────
export function findTool(name) {
  return TOOLS.find(t => t.name === name)
}

// ── Natural-Language Match ────────────────────────────────────────────────
// Sucht das beste Tool für eine User-Eingabe (Plain Text).
export function matchToolFromInput(input) {
  const q = String(input || '').toLowerCase()
  if (!q.trim()) return null

  const matches = TOOLS.map(t => {
    let score = 0
    for (const kw of t.keywords || []) {
      if (q.includes(kw.toLowerCase())) score += kw.length * 2
    }
    if (q.includes(t.name.toLowerCase())) score += 50
    return { tool: t, score }
  }).filter(m => m.score > 0).sort((a, b) => b.score - a.score)

  return matches[0]?.tool || null
}

export function listTools() {
  return TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    permission: t.permission,
    requiredParams: t.requiredParams,
    cost: t.cost || null,
  }))
}

// ── Execute with Permission-Check ─────────────────────────────────────────
export async function executeTool(toolName, params = {}, { confirmed = false, onLog } = {}) {
  const tool = findTool(toolName)
  if (!tool) return { ok: false, error: `Unknown tool: ${toolName}` }

  const permission = PERMISSION_LEVELS[tool.permission]
  if (permission.confirmRequired && !confirmed) {
    return {
      ok: false,
      requiresConfirmation: true,
      reason: permission.reason,
      permission: tool.permission,
      tool: tool.name,
      description: tool.description,
      cost: tool.cost || null,
    }
  }

  // Required Params Check
  for (const req of tool.requiredParams || []) {
    if (params[req] === undefined) {
      return { ok: false, error: `Missing required param: ${req}` }
    }
  }

  onLog?.({ type: 'start', tool: tool.name, time: Date.now() })
  const t0 = Date.now()
  try {
    const result = await tool.handler(params)
    onLog?.({ type: 'end', tool: tool.name, durationMs: Date.now() - t0, ok: result.ok })
    return { ...result, tool: tool.name, durationMs: Date.now() - t0 }
  } catch (e) {
    onLog?.({ type: 'error', tool: tool.name, durationMs: Date.now() - t0, error: e.message })
    return { ok: false, error: e.message, tool: tool.name }
  }
}
