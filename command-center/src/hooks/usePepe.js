import { useMemo } from 'react'
import { getLeadStage } from '../lib/sheets'
import { WORKFLOW_AGENT_MAP, AGENT_NAMES } from '../lib/n8n'

// 2 hours in ms
const TWO_HOURS = 2 * 60 * 60 * 1000
const ONE_DAY   = 24 * 60 * 60 * 1000

export function usePepe({ leads = [], executions = [] }) {
  return useMemo(() => {
    const now = Date.now()

    // ── Lead stats ─────────────────────────────────────────────────────────
    const total      = leads.length
    const hotLeads   = leads.filter(l => (+l.score || 0) >= 75)  // updated threshold
    const revenueOpps = leads.filter(l => {
      const url = l.build?.demo_url || ''
      return url && !url.startsWith('/files') && /^https?:\/\//.test(url) && getLeadStage(l) === 7
    })
    const topLead = [...leads]
      .filter(l => revenueOpps.some(r => r.lead_id === l.lead_id))
      .sort((a, b) => (+b.score || 0) - (+a.score || 0))[0] || hotLeads[0] || null

    const pipelineActive = leads.filter(l => getLeadStage(l) >= 2 && getLeadStage(l) < 7).length

    // ── Execution stats ────────────────────────────────────────────────────
    const recentExecs  = executions.filter(e => {
      const t = new Date(e.startedAt).getTime()
      return (now - t) < ONE_DAY
    })
    const criticalBugs  = executions.filter(e => {
      const t = new Date(e.startedAt).getTime()
      return e.status === 'error' && (now - t) < TWO_HOURS
    })
    const activeAudits  = executions.filter(e => e.status === 'running').length
    const successCount  = recentExecs.filter(e => e.status === 'success').length
    const pipelineScore = recentExecs.length > 0
      ? Math.round((successCount / recentExecs.length) * 100)
      : 100

    // ── Agent error summary ────────────────────────────────────────────────
    const agentErrors = Object.entries(AGENT_NAMES).map(([id, name]) => {
      const wfId = Object.keys(WORKFLOW_AGENT_MAP).find(k => WORKFLOW_AGENT_MAP[k] === +id)
      const errs = recentExecs.filter(e => e.workflowId === wfId && e.status === 'error')
      const lastErr = errs[0]
      return { agentId: +id, agentName: name, count: errs.length, lastError: lastErr || null }
    }).filter(a => a.count > 0)

    // ── System health (composite score) ────────────────────────────────────
    // 40% pipeline success rate + 40% lead coverage (stage≥2) + 20% no critical bugs
    const coverageScore  = total > 0 ? Math.round((leads.filter(l => getLeadStage(l) >= 2).length / total) * 100) : 0
    const bugPenalty     = criticalBugs.length > 0 ? Math.min(20, criticalBugs.length * 5) : 0
    const systemHealth   = Math.max(0, Math.round(
      pipelineScore * 0.4 + coverageScore * 0.4 + 20 - bugPenalty
    ))

    // ── Recommendations (new manual-first architecture) ────────────────────
    const lastDecision = topLead
      ? `Lead "${topLead.name || topLead.lead_id}" (Score ${topLead.score || 0}) hat fertige Demo — Outreach empfohlen`
      : criticalBugs.length > 0
        ? `${criticalBugs.length} kritische Fehler erkannt — n8n prüfen`
        : hotLeads.length > 0
          ? `${hotLeads.length} Hot Leads (≥75) bereit — A2 Builder starten`
          : 'System stabil — Lead auswählen und A1 starten'

    const recommendations = [
      revenueOpps.length > 0 && {
        priority: 'HIGH',
        title: `${revenueOpps.length} Site${revenueOpps.length > 1 ? 's' : ''} live — Outreach möglich`,
        reason: 'Demos deployed — A4 Texte schreiben und versenden',
        target: 'revenue',
      },
      hotLeads.length > revenueOpps.length && {
        priority: 'HIGH',
        title: `${hotLeads.length - revenueOpps.length} Hot Lead${hotLeads.length - revenueOpps.length > 1 ? 's' : ''} ohne Demo`,
        reason: 'Leads mit Score ≥75 → A2 Builder starten',
        target: 'pipeline',
      },
      criticalBugs.length > 0 && {
        priority: 'HIGH',
        title: `${criticalBugs.length} Agentenfehler in letzten 2h`,
        reason: 'n8n Executions prüfen',
        target: 'bugs',
      },
      {
        priority: 'MED',
        title: 'Lead aktivieren und A6 Fact Check starten',
        reason: 'Vor Outreach immer Fakten prüfen — Trust Score sicherstellen',
        target: 'factcheck',
      },
      {
        priority: 'LOW',
        title: 'A5 Preis für Top-Leads berechnen',
        reason: 'Closing-Chance und Preisrahmen kennen vor dem Anruf',
        target: 'pricing',
      },
    ].filter(Boolean).slice(0, 6)

    return {
      // Metrics
      systemHealth,
      hotLeads,
      revenueOpps,
      criticalBugs,
      activeAudits,
      pipelineScore,
      pipelineActive,
      agentErrors,
      topLead,
      total,
      // AI outputs (mock Phase 1–3)
      lastDecision,
      recommendations,
    }
  }, [leads, executions])
}
