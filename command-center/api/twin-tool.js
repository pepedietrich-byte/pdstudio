// ─── Voice-Twin Tool Bridge Endpoint ───────────────────────────────────────
// Wird von ElevenLabs Voice Agent (Function-Calling) oder vom
// TwinControlPanel aufgerufen.
//
// POST { intent?, text?, lead?, confirmed?, params? }
//   → entweder Intent direkt geliefert, oder Text aus dem die Bridge den Intent extrahiert
//
// Schutz:
//   - voice-blockierte Aktionen (mail.send, site.archive) lehnen IMMER ab
//   - expensive_action / destructive_action: confirmed=true erforderlich
//
// Setup in ElevenLabs:
//   Agent → Tools → Add Webhook Tool
//   URL: https://command-center-lac-one.vercel.app/api/twin-tool
//   Method: POST
//   Schema:
//     {
//       "type": "object",
//       "properties": {
//         "intent": { "type": "string", "enum": ["run_lead_qualifier", "run_fact_check", ...] },
//         "lead_id": { "type": "string" },
//         "confirmed": { "type": "boolean" }
//       },
//       "required": ["intent"]
//     }

const ALLOWED_ORIGINS = [
  'https://command-center-lac-one.vercel.app',
  'https://api.elevenlabs.io',
  'http://localhost:5173',
]

// Minimaler in-memory token store für confirmation tracking
// (Pro echte Session sollte das Redis/KV werden — für jetzt: stateless mit signed tokens)
function safeJson(v) {
  try { return JSON.parse(v) } catch { return null }
}

export default async function handler(req, res) {
  // CORS für ElevenLabs
  const origin = req.headers.origin || ''
  if (ALLOWED_ORIGINS.some(a => origin === a || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  // Body parsing (Vercel meist schon JSON)
  const body = typeof req.body === 'string' ? safeJson(req.body) || {} : (req.body || {})
  const { intent, text, lead_id, confirmed = false, params: extraParams = {} } = body

  if (!intent && !text) {
    res.status(400).json({ error: 'intent_or_text_required' })
    return
  }

  // ── Intent-Mapping (verkürzt; mirror von src/lib/voiceIntent.js) ────────
  // Wir bauen hier einen kleinen serverseitigen Match, falls nur "text" kam.
  // Die volle Logik läuft client-side; dieser Endpoint sichert nur Permission ab.
  const INTENT_MAP = {
    run_lead_qualifier:    { tool: 'lead.qualify',         voiceSafe: true },
    run_fact_check:        { tool: 'lead.factCheck',       voiceSafe: true },
    analyze_assets:        { tool: 'assets.analyze',       voiceSafe: true },
    run_pre_build_gate:    { tool: 'gate.run',             voiceSafe: true },
    generate_concept:      { tool: 'concept.generate',     voiceSafe: true },
    show_next_action:      { tool: 'pipeline.nextAction',  voiceSafe: true },
    explain_blocker:       { tool: 'pipeline.nextAction',  voiceSafe: true },
    generate_mail_drafts:  { tool: 'mail.generate3',       voiceSafe: false },
    build_premium_prompt:  { tool: 'prompt.buildPremium',  voiceSafe: false },
    build_standard_prompt: { tool: 'prompt.buildStandard', voiceSafe: true },
    generate_poe_hero:     { tool: 'hero.regenerate',      voiceSafe: false },
    run_full_pipeline:     { tool: 'pipeline.full',        voiceSafe: false },
    start_build:           { tool: 'build.trigger',        voiceSafe: false, requiresExplicitYes: true },
    start_deploy:          { tool: 'build.trigger',        voiceSafe: false, requiresExplicitYes: true },
    send_mail:             { tool: 'mail.send',            voiceSafe: false, blockedByVoice: true },
    archive_site:          { tool: 'site.archive',         voiceSafe: false, blockedByVoice: true },
    run_sales_audit:       { tool: 'lead.factCheck',       voiceSafe: true },
  }

  const mapping = INTENT_MAP[intent]
  if (!mapping) {
    res.status(200).json({
      ok: false,
      intent,
      spoken: `Intent "${intent}" ist nicht im Tool-Bridge-Mapping. Verfügbare: ${Object.keys(INTENT_MAP).join(', ')}.`,
    })
    return
  }

  if (mapping.blockedByVoice) {
    res.status(200).json({
      ok: false,
      blocked: true,
      intent,
      reason: 'Diese Aktion ist per Voice gesperrt (mail.send/site.archive). Nur im UI mit explicit confirm möglich.',
      spoken: 'Per Sprache nicht erlaubt aus Sicherheit. Geh ins Command Center und bestätige dort.',
    })
    return
  }

  if (!mapping.voiceSafe && !confirmed) {
    res.status(200).json({
      ok: false,
      intent,
      tool: mapping.tool,
      requiresConfirmation: true,
      spoken: `Soll ich "${mapping.tool}" wirklich ausführen? Antworte mit „bestätigen".`,
    })
    return
  }

  // ── Execute via internal proxy ─────────────────────────────────────────
  // Wir können hier nicht den client-side executeTool() aufrufen (das ist React/Browser-Code).
  // Stattdessen: wir signalisieren der Frontend-App via Server-Sent-Event oder
  // wir delegieren an einen konkreten Endpoint pro Tool.
  //
  // Pragmatisch für jetzt:
  // - safe tools die rein client-logisch sind (qualify, factCheck, gate) →
  //   wir geben dem Client die Anweisung zurück, der Client führt aus und schickt das Ergebnis
  //   für die spoken-Summary zurück. Bei ElevenLabs Function Calling reicht der initiale
  //   Tool-Call-Response.
  //
  // - Server-tools (poe-image, sales-readiness, fact-check.network) können wir direkt aufrufen.

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (origin || '')

  try {
    if (mapping.tool === 'hero.regenerate' && lead_id) {
      const r = await fetch(`${baseUrl}/api/poe-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id, role: 'hero', ...extraParams }),
      })
      const data = await r.json()
      res.status(200).json({
        ok: r.ok,
        intent,
        tool: mapping.tool,
        result: data,
        spoken: r.ok ? 'Neuer Hero generiert.' : `Hero-Generierung fehlgeschlagen: ${data.error || r.status}`,
      })
      return
    }

    if ((intent === 'run_sales_audit' || mapping.tool === 'sales.audit') && extraParams.url) {
      const r = await fetch(`${baseUrl}/api/sales-readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extraParams),
      })
      const data = await r.json()
      res.status(200).json({
        ok: r.ok,
        intent,
        tool: 'sales.audit',
        result: data,
        spoken: r.ok ? `Sales Readiness: ${data.score} von 100, Verdict ${data.verdict}.` : `Audit failed: ${data.error}`,
      })
      return
    }

    // Für client-tools: signal an Frontend (Server-Sent-Events wären besser; aktuell Response-only)
    res.status(200).json({
      ok: true,
      intent,
      tool: mapping.tool,
      requiresClientExecution: true,
      params: extraParams,
      lead_id,
      spoken: `Führe ${mapping.tool} aus.`,
      hint: 'Dieser Tool-Call wird vom Browser ausgeführt. Frontend liest dieses Response und ruft executeTool() auf.',
    })
  } catch (e) {
    res.status(500).json({ ok: false, intent, error: e.message })
  }
}
