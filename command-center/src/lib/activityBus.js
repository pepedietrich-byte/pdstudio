// ─── Activity Bus ────────────────────────────────────────────────────────────
// Globaler Pub/Sub für Live-Updates zwischen Tool-Registry und UI.
// Kein externes State-Management nötig — einfacher Event-Emitter.
//
// Ablauf:
//   executeTool() → emit() → TwinActivityFeed + useSheetData refetch + AgentCity badges

const listeners = new Set()

export function emit(event) {
  const stamped = { ...event, ts: event.ts || Date.now() }
  listeners.forEach(fn => { try { fn(stamped) } catch { /* noop */ } })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ── Helper: welche Entities könnte das Tool verändert haben? ──────────────
// Wird genutzt um gezielt nur die nötigen Daten neu zu laden.
export function getAffectedEntities(toolName) {
  const map = {
    'lead.qualify':          ['leads', 'kpis'],
    'lead.factCheck':        ['leads'],
    'assets.analyze':        ['leads'],
    'gate.run':              ['leads'],
    'concept.generate':      ['leads'],
    'mail.generate3':        ['leads'],
    'mail.generateOne':      ['leads'],
    'prompt.buildPremium':   ['leads'],
    'prompt.buildStandard':  ['leads'],
    'hero.regenerate':       ['leads', 'assets'],
    'build.trigger':         ['leads', 'sites', 'kpis'],
    'agent.trigger':         ['leads', 'kpis'],
    'pipeline.full':         ['leads', 'sites', 'kpis'],
    'pipeline.nextAction':   [],
    'mail.send':             [],
    'site.archive':          ['leads', 'sites', 'kpis'],
  }
  return map[toolName] || []
}

// ── Stage-Change-Erkennung ────────────────────────────────────────────────
// Versucht aus einem Tool-Result zu lesen ob sich der Lead-Stage geändert hat.
export function extractStageChange(toolName, result) {
  if (!result) return null
  // lead.qualify → liefert leadScore + scoreBand
  if (toolName === 'lead.qualify' && result.leadScore !== undefined) {
    return {
      type: 'score_update',
      leadId: result.leadId,
      score: result.leadScore,
      band: result.scoreBand,
      message: `SIGN · Score ${result.leadScore} · ${result.scoreBand?.label || ''}`.trim(),
    }
  }
  // build.trigger → demo_url gesetzt
  if (toolName === 'build.trigger' && result.demo_url) {
    return {
      type: 'stage_change',
      newStage: 7,
      message: `Build gestartet → ${result.demo_url}`,
    }
  }
  // agent.trigger → generic
  if (toolName === 'agent.trigger') {
    return { type: 'agent_triggered', message: 'Agent gestartet' }
  }
  return null
}
