// PDSTUDIO — Poe API Proxy
// Handles: PEPE Chat, A4 Human Writer (text generation), generic Poe calls
//
// Accepts both formats:
//   { question, context }  → PEPE chat mode (Gemini routing)
//   { message, system }    → Direct text generation (A4 Writer etc.)
//   { model, ... }         → Model override

const MODELS = {
  pro:    'Gemini-2.5-Pro',
  flash:  'Gemini-2.5-Flash',
  lite:   'Gemini-2.5-Flash-Lite',
  claude: 'Claude-3.7-Sonnet',
}

function pickModel(question) {
  const q = (question || '').toLowerCase()
  if (/(warum|wieso|strateg|architekt|empfehlung|priorisier|analyse|verbesser|fix|fehler|bug|umsatz|verkauf|pitch|angebot|schreib|text|mail|brief)/i.test(q)) {
    return MODELS.flash
  }
  if (q.length < 28 && /(läuft|ok|status|wie viele|count|wieviel)/i.test(q)) {
    return MODELS.lite
  }
  return MODELS.flash
}

function buildPepeSystemPrompt(context) {
  const { hotLeads = 0, revenueOpps = 0, criticalBugs = 0, systemHealth = 0,
          topLead = null, agentErrors = [], totalLeads = 0, pipelineScore = 0,
          activeLead = null } = context || {}

  return `Du bist PEPE, der Command Captain von PDSTUDIO — manuelle KI-Command-Zentrale für Restaurant-Lead-Generierung und Website-Erstellung.

REGELN:
- Antworte IMMER auf Deutsch.
- Maximal 4 Sätze. Knapp, präzise, business-orientiert.
- Wenn du Daten nicht hast: sag klar "Ich habe dafür keine Daten gefunden."
- Erfinde NIEMALS Zahlen oder Lead-Namen.
- Wenn die Frage konkrete Aktionen verlangt: gib 1-3 konkrete Aktionspunkte.

LIVE-DATEN:
- Leads gesamt: ${totalLeads}
- Hot Leads (Score ≥75): ${hotLeads}
- Sites live (deployed): ${revenueOpps}
- Kritische Bugs (letzte 2h): ${criticalBugs}
- System Health: ${systemHealth}%
${topLead ? `- Top Lead: "${topLead.name || topLead.lead_id}" (Score ${topLead.score || 0})` : ''}
${activeLead ? `- Aktiver Lead: "${activeLead.name || activeLead.lead_id}" (Score ${activeLead.score || '—'})` : ''}
${agentErrors && agentErrors.length > 0 ? `- Agenten mit Fehlern: ${agentErrors.map(a => a.agentName || a).join(', ')}` : '- Alle Agenten OK'}

AGENT-ARCHITEKTUR (PDSTUDIO — manuell gesteuert):
A1 Lead Qualifier → bewertet Lead, Score + Confidence
A2 Claude Code Builder → baut und deployt Website (Claude Code)
A3 Polish Agent → Bilder generieren (Poe/Nano Banana), Code polishen
A4 Human Writer → Verkaufs-E-Mails, DMs, Follow-ups
A5 Pricing Agent → Preis berechnen (Min/Empfehlung/Premium)
A6 Fact Checker → Website, Telefon, E-Mail verifizieren
TWIN PEPE = du selbst, der Boss.

Kein automatischer Pipeline-Zwang mehr. Pepe entscheidet pro Lead welcher Agent läuft.`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ _error: 'method_not_allowed' })

  const POE_KEY = process.env.POE_API_KEY
  if (!POE_KEY) {
    return res.status(200).json({ _error: 'POE_API_KEY not configured', _fallback: 'mock' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  // Support both call formats
  const question = (body?.question || body?.message || '').trim()
  const context  = body?.context || {}
  const systemOverride = body?.system || null

  if (!question) {
    return res.status(400).json({ _error: 'question or message is required' })
  }

  const model = body?.model || pickModel(question)
  const systemPrompt = systemOverride || buildPepeSystemPrompt(context)

  try {
    const r = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: question },
        ],
        temperature: 0.5,
        max_tokens:  1200,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      return res.status(200).json({
        _error: `poe_http_${r.status}`,
        _detail: errText.slice(0, 300),
        _fallback: 'mock',
      })
    }

    const data = await r.json()
    const answer = data?.choices?.[0]?.message?.content?.trim() || ''
    const usage  = data?.usage || {}

    if (!answer) {
      return res.status(200).json({
        _error: 'empty_response',
        _detail: JSON.stringify(data).slice(0, 300),
        _fallback: 'mock',
      })
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      answer,          // primary field
      reply: answer,   // backwards compat alias
      message: answer, // backwards compat alias
      model,
      tokens_in:  usage.prompt_tokens     || 0,
      tokens_out: usage.completion_tokens || 0,
      provider:   'poe',
    })
  } catch (e) {
    return res.status(200).json({
      _error: 'fetch_failed',
      _detail: e.message,
      _fallback: 'mock',
    })
  }
}
