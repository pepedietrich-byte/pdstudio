import { useMemo } from 'react'
import { WORKFLOW_AGENT_MAP, AGENT_NAMES } from '../lib/n8n'
import { getLeadStage } from '../lib/sheets'

const ONE_DAY = 24 * 60 * 60 * 1000

/**
 * Per-agent diagnostics derived from real n8n executions + leads data.
 * No fetches, pure computation.
 */
export function useAgentDiagnostics(agentId, { leads = [], executions = [] }) {
  return useMemo(() => {
    const wfId = Object.keys(WORKFLOW_AGENT_MAP).find(k => WORKFLOW_AGENT_MAP[k] === agentId)
    const name = AGENT_NAMES[agentId]

    const runs = executions.filter(e => e.workflowId === wfId)
    const recentRuns = runs.slice(0, 20)

    const ok       = recentRuns.filter(e => e.status === 'success').length
    const err      = recentRuns.filter(e => e.status === 'error').length
    const running  = recentRuns.filter(e => e.status === 'running').length
    const total    = recentRuns.length
    const successRate = total > 0 ? Math.round((ok / total) * 100) : null
    const lastRun  = runs[0] || null

    // Today's runs — Date.now() via constructor (purer wrapper)
    const now = new Date().getTime()
    const todayRuns = runs.filter(e => (now - new Date(e.startedAt).getTime()) < ONE_DAY)

    // Avg duration of successful runs
    const durations = recentRuns
      .filter(e => e.status === 'success' && e.stoppedAt && e.startedAt)
      .map(e => new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime())
    const avgMs = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

    // Leads currently at this agent's stage (waiting to be processed or just processed)
    const leadsAtStage = leads.filter(l => getLeadStage(l) === agentId)
    const leadsCompleted = leads.filter(l => getLeadStage(l) > agentId)

    // Status diagnosis
    let healthStatus
    let healthMessage
    if (successRate === null) {
      healthStatus = 'idle'
      healthMessage = 'Noch keine Runs heute.'
    } else if (successRate >= 90) {
      healthStatus = 'excellent'
      healthMessage = `Läuft stabil — ${successRate}% Erfolg.`
    } else if (successRate >= 70) {
      healthStatus = 'ok'
      healthMessage = `Akzeptabel — ${successRate}% Erfolg, ${err} Fehler.`
    } else if (successRate >= 40) {
      healthStatus = 'warning'
      healthMessage = `Auffällig — nur ${successRate}% Erfolg, ${err} Fehler.`
    } else {
      healthStatus = 'critical'
      healthMessage = `Kritisch — ${successRate}% Erfolg, ${err} Fehler in letzten ${total} Runs.`
    }

    // Webhook configured?
    const webhookConfigured = !!import.meta.env[`VITE_N8N_AGENT${agentId}_WEBHOOK`]

    return {
      agentId,
      name,
      wfId,
      runs: recentRuns,
      lastRun,
      ok,
      err,
      running,
      total,
      successRate,
      todayRunCount: todayRuns.length,
      avgDurationMs: avgMs,
      leadsAtStage,
      leadsCompleted,
      healthStatus,
      healthMessage,
      webhookConfigured,
    }
  }, [agentId, leads, executions])
}
