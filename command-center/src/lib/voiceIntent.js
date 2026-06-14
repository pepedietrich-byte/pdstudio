// ─── Voice Intent Matcher ───────────────────────────────────────────────────
// Mapped DE-Sprachbefehle auf Tool-Registry-Aktionen.
//
// Pflicht-Verhalten:
//   - Erkennt nur klare Intents (kein "schon ungefähr passend")
//   - Liefert spoken_summary für TTS-Rückgabe
//   - Permission-Check vor Run (keine Mail-Send/Site-Delete per Voice)

import { findTool, executeTool } from '../services/twin/toolRegistry'

// ── Intent → Tool Mapping ────────────────────────────────────────────────
export const INTENT_TOOL_MAP = {
  // Safe / direkt
  run_lead_qualifier: { tool: 'lead.qualify', voiceSafe: true },
  run_fact_check:     { tool: 'lead.factCheck', voiceSafe: true },
  analyze_assets:     { tool: 'assets.analyze', voiceSafe: true },
  run_pre_build_gate: { tool: 'gate.run', voiceSafe: true },
  generate_concept:   { tool: 'concept.generate', voiceSafe: true },
  show_next_action:   { tool: 'pipeline.nextAction', voiceSafe: true },
  explain_blocker:    { tool: 'pipeline.nextAction', voiceSafe: true },

  // Expensive — Voice-Bestätigung Pflicht (NICHT direkt voiceSafe)
  generate_mail_drafts: { tool: 'mail.generate3', voiceSafe: false },
  generate_mail_single: { tool: 'mail.generateOne', voiceSafe: false },
  build_premium_prompt: { tool: 'prompt.buildPremium', voiceSafe: false },
  build_standard_prompt:{ tool: 'prompt.buildStandard', voiceSafe: true },
  generate_poe_hero:    { tool: 'hero.regenerate', voiceSafe: false },
  run_full_pipeline:    { tool: 'pipeline.full', voiceSafe: false },

  // Destructive / External — IMMER Confirmation
  start_build:          { tool: 'build.trigger', voiceSafe: false, requiresExplicitYes: true },
  start_deploy:         { tool: 'build.trigger', voiceSafe: false, requiresExplicitYes: true },
  send_mail:            { tool: 'mail.send', voiceSafe: false, blockedByVoice: true },
  archive_site:         { tool: 'site.archive', voiceSafe: false, blockedByVoice: true },

  // Audit / Read-only
  run_sales_audit:      { tool: 'lead.factCheck', voiceSafe: true }, // proxied — wir haben kein separates audit tool
}

// ── Sprach-Pattern → Intent ──────────────────────────────────────────────
const INTENT_PATTERNS = [
  { intent: 'run_lead_qualifier', patterns: [
    /prüf(e|st)?\s+(diesen?|den)?\s*lead/i,
    /(qualifizier|score|bewert)\s+(diesen?|den)?\s*lead/i,
    /lead.*(prüfen|qualifizieren)/i,
    /starte\s*a1/i,
    /a1\s*(starten|ausführen|laufen)/i,
    /pepe.*prüf/i,           // "Pepe, prüfe X" → versteht als Qualify-Befehl
    /prüf(e|st)?\s+[a-z]/i,   // "prüfe Ricks Burger" / "prüfe Antonio"
  ] },
  { intent: 'run_fact_check', patterns: [
    /fact.?check/i,
    /fakten\s+prüf/i,
    /verifizier/i,
    /starte\s*a6/i,
    /a6\s*(starten|ausführen)/i,
  ] },
  { intent: 'analyze_assets', patterns: [
    /asset.*(prüf|analysier|bewerten)/i,
    /bilder.*(prüf|analysier|bewerten)/i,
    /hero.*(prüf|check)/i,
    /starte\s*a3/i,
  ] },
  { intent: 'run_pre_build_gate', patterns: [
    /pre.?build.?gate/i,
    /baulich.?prüf/i,
    /gate.*(prüfen|laufen)/i,
    /build.*(check|prüfen)/i,
  ] },
  { intent: 'generate_concept', patterns: [
    /konzept|concept/i,
    /a5\s*(starten|ausführen|laufen)/i,
    /style.*(generier|vorschlag)/i,
  ] },
  { intent: 'generate_mail_drafts', patterns: [
    /(generier|baue|erstell|schreib).*(mails?|email|verkaufs.?mail)/i,
    /drei mails/i,
    /3 mails/i,
    /mail.?varianten/i,
    /a4\s*(starten|ausführen)/i,
  ] },
  { intent: 'generate_mail_single', patterns: [
    /eine?\s*mail/i,
    /mail.*(kurz|premium|beratend)/i,
  ] },
  { intent: 'build_premium_prompt', patterns: [
    /(premium|finalen?).*(prompt|build.?prompt)/i,
    /a6.*(premium|analyse)/i,
    /design.?analyse/i,
    /poe.?analyse/i,
  ] },
  { intent: 'build_standard_prompt', patterns: [
    /standard.?prompt/i,
    /baue?\s+den?\s+prompt/i,
    /promptbuilder/i,
  ] },
  { intent: 'generate_poe_hero', patterns: [
    /generier.*hero/i,
    /neuer?\s+hero/i,
    /hero.*(neu|generier)/i,
    /hero.*(bild|image).*(generier|neu)/i,
    /poe.*hero/i,
    /nano\s*banana/i,
  ] },
  { intent: 'show_next_action', patterns: [
    /n(ä|ae)chste(r|s|n)?\s+(\S+\s+){0,3}?(schritt|aktion)/i,  // "nächste beste schritt" ok
    /n(ä|ae)chste(r|s)?\s*(schritt|aktion)/i,
    /was\s+(soll|muss|wäre)\s+ich\s+(machen|tun)/i,
    /was\s+(ist\s+)?(der\s+)?n(ä|ae)chst/i,
    /was\s+nun/i,
    /(was|welche).*?empfehl/i,
  ] },
  { intent: 'explain_blocker', patterns: [
    /warum\s+(ist\s+)?(der\s+)?build\s+blockiert/i,
    /was\s+blockiert/i,
    /blocker\s+erklär/i,
    /warum\s+kann\s+ich\s+nicht/i,
  ] },
  { intent: 'run_sales_audit', patterns: [
    /sales.?(audit|readiness)/i,
    /verkaufs.?audit/i,
    /audit\s+starten/i,
  ] },
  { intent: 'start_build', patterns: [
    /(starte|baue).*(build|website)/i,
    /a2.*(starten|ausführen)/i,
    /a7.*(starten|ausführen)/i,
    /website.*(bauen|generieren)/i,
  ] },
  { intent: 'start_deploy', patterns: [
    /deploy.?(en|starten)/i,
    /vercel.*(deploy|deployen)/i,
    /live\s+schalten/i,
  ] },
  { intent: 'send_mail', patterns: [
    /(mail|email).*senden/i,
    /verschick/i,
    /outreach.*(starten|senden)/i,
  ] },
  { intent: 'archive_site', patterns: [
    /site.*(archivier|entfernen)/i,
    /demo.*(löschen|archivier)/i,
  ] },
  { intent: 'run_full_pipeline', patterns: [
    /komplette?\s*pipeline/i,
    /alles.*(durchlauf|machen)/i,
    /voller?\s*durchlauf/i,
  ] },
]

export function detectIntent(text) {
  const t = String(text || '').toLowerCase().trim()
  if (!t) return null
  const matches = []
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const p of patterns) {
      const m = t.match(p)
      if (m) {
        matches.push({ intent, matchLength: m[0].length, pattern: p.toString() })
        break // ein Pattern reicht pro Intent
      }
    }
  }
  if (matches.length === 0) return null
  // Längster Match gewinnt
  matches.sort((a, b) => b.matchLength - a.matchLength)
  return matches[0].intent
}

// ── Spoken-Summary Generator ────────────────────────────────────────────
export function summarizeForVoice(toolName, result, error) {
  if (error) return `Fehler: ${error}`
  if (!result) return 'Aktion ausgeführt, kein Detail-Result.'

  switch (toolName) {
    case 'lead.qualify':
      return `Lead-Score ${result.leadScore}, Kategorie ${result.scoreBand?.label || '—'}. ${result.recommendedNextAction || ''}`
    case 'lead.factCheck':
      return result.factGatePassed
        ? `Fact Gate ok. ${result.sendReady ? 'Versand bereit.' : 'Versand noch blockiert.'}`
        : `Fact Gate blockiert: ${(result.blockingReasons || []).join(', ')}`
    case 'assets.analyze':
      return `${result.summary?.heroReady || 0} Hero-taugliche Bilder, ${result.summary?.usable || 0} nutzbare, ${result.summary?.rejected || 0} abgelehnt.`
    case 'gate.run':
      return `Gate verdict: ${result.verdict}. ${result.problems?.length || 0} Probleme.`
    case 'concept.generate':
      return `Style: ${result.style_id || 'unbekannt'}. ${result.hero_composition || ''}`
    case 'mail.generate3':
      return result.blocked
        ? `Mails blockiert: ${result.reason}`
        : `${result.variants?.length || 0} Mail-Varianten generiert.`
    case 'prompt.buildPremium':
      return `Premium-Prompt Quality ${result.promptQualityScore}, ready for A7: ${result.readyForA7 ? 'ja' : 'nein'}.`
    case 'pipeline.nextAction':
      return `Nächste Aktion: ${result.nextAction}`
    case 'hero.regenerate':
      return result.error ? `Hero-Generierung fehlgeschlagen: ${result.error}` : 'Neuer Hero generiert.'
    case 'build.trigger':
      return result.error ? `Build fehlgeschlagen: ${result.error}` : `Build gestartet. ${result.demo_url ? 'URL: ' + result.demo_url : ''}`
    case 'mail.send':
      return result.notImplemented ? 'Mail-Versand ist deaktiviert. Draft wurde erstellt.' : 'Mail versendet.'
    case 'site.archive':
      return result.notImplemented ? 'Archivierung nicht angebunden.' : 'Site archiviert.'
    case 'pipeline.full':
      return result.blocked
        ? `Pipeline blockiert: ${result.reason || 'unbekannt'}`
        : `Pipeline durchgelaufen, ${result.steps?.length || 0} Phasen, ready for A7: ${result.finalPromptReady}`
    default:
      return 'Aktion abgeschlossen.'
  }
}

// ── Voice Command Router ────────────────────────────────────────────────
// Nimmt rohen Voice-Text + Kontext, mappt zu Tool, prüft Permissions,
// führt aus oder blockiert ehrlich.
export async function routeVoiceCommand(text, ctx = {}) {
  const intent = detectIntent(text)
  if (!intent) {
    return {
      ok: false,
      intent: null,
      spoken: 'Den Befehl habe ich nicht verstanden. Sag z.B. „prüfe diesen Lead" oder „nächste Aktion".',
    }
  }

  const mapping = INTENT_TOOL_MAP[intent]
  if (!mapping) {
    return { ok: false, intent, spoken: `Intent ${intent} ist nicht angeschlossen.` }
  }

  // Blocked by Voice (z.B. echtes Mail-Senden)
  if (mapping.blockedByVoice) {
    return {
      ok: false,
      intent,
      blocked: true,
      reason: 'Diese Aktion ist per Voice gesperrt. Nutze das Command-Center-UI mit Bestätigung.',
      spoken: 'Aus Sicherheit per Sprache nicht erlaubt. Mach das im Command Center mit Bestätigung.',
    }
  }

  const tool = findTool(mapping.tool)
  if (!tool) {
    return { ok: false, intent, spoken: `Tool ${mapping.tool} nicht gefunden in Registry.` }
  }

  // Permission-Check + Voice-Safety
  const needsConfirmation = !mapping.voiceSafe
  if (needsConfirmation && !ctx.confirmed) {
    return {
      ok: false,
      intent,
      tool: tool.name,
      requiresConfirmation: true,
      reason: `Dieser Befehl ist ${tool.permission} (${tool.description}).`,
      spoken: `Soll ich ${tool.description} wirklich ausführen? Sag „bestätigen" zum Ausführen.`,
    }
  }

  // Build params from context
  const params = {}
  for (const req of tool.requiredParams || []) {
    if (ctx[req] !== undefined) params[req] = ctx[req]
  }

  const result = await executeTool(tool.name, params, { confirmed: true })
  return {
    ok: result.ok,
    intent,
    tool: tool.name,
    result: result.result,
    error: result.error,
    spoken: summarizeForVoice(tool.name, result.result, result.error),
    durationMs: result.durationMs,
  }
}

// ── For ElevenLabs Function Calling: list of callable functions ─────────
export function listVoiceFunctions() {
  return Object.entries(INTENT_TOOL_MAP).map(([intent, mapping]) => {
    const tool = findTool(mapping.tool)
    return {
      intent,
      tool: mapping.tool,
      description: tool?.description || '',
      permission: tool?.permission || 'unknown',
      voiceSafe: !!mapping.voiceSafe,
      blockedByVoice: !!mapping.blockedByVoice,
    }
  })
}
