// ─── Direct Runner Bridge ──────────────────────────────────────────────────
// Umgeht den n8n-Workflow für Premium-Builds.
// Schickt den fertigen Premium-Prompt direkt an den Runner /run-a2.
//
// POST {
//   lead_id, site_dir, final_prompt, gates_passed,
//   accepted_hero_url?, a6_quality_score?, prompt_builder_version?,
//   async?: true|false
// }
//
// Server-side: Bearer-Auth gegen RUNNER_SECRET (kein Browser-Token-Leak).

const RUNNER_BASE   = process.env.RUNNER_BASE_URL || ''
const RUNNER_SECRET = process.env.RUNNER_SECRET   || ''

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  if (!RUNNER_BASE || !RUNNER_SECRET) {
    res.status(503).json({
      error: 'runner_not_configured',
      hint: 'Setze RUNNER_BASE_URL und RUNNER_SECRET in Vercel Env Vars.',
    })
    return
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {})
  const {
    lead_id,
    site_dir,
    final_prompt,
    gates_passed = false,
    accepted_hero_url = '',
    a6_quality_score = null,
    prompt_builder_version = '',
    mode = 'build',
    async: isAsync = true,
  } = body

  if (!lead_id || !final_prompt) {
    res.status(400).json({ error: 'lead_id and final_prompt required' })
    return
  }

  if (!gates_passed) {
    res.status(403).json({
      error: 'gates_not_passed',
      hint: 'Frontend muss PreBuildGate ausführen und gates_passed=true setzen.',
    })
    return
  }

  if (a6_quality_score !== null && a6_quality_score < 60) {
    res.status(403).json({
      error: 'a6_quality_too_low',
      score: a6_quality_score,
      hint: 'A6 Premium-Prompt-Quality muss ≥ 60 sein, ist ' + a6_quality_score,
    })
    return
  }

  try {
    const runnerUrl = `${RUNNER_BASE.replace(/\/$/, '')}/run-a2${isAsync ? '?async=1' : ''}`
    const resp = await fetch(runnerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNNER_SECRET}`,
      },
      body: JSON.stringify({
        prompt: final_prompt,
        mode,
        metadata: {
          gates_passed: true,
          site_dir: site_dir || `sites/${lead_id}`,
          accepted_hero_url,
          a6_quality_score,
          prompt_builder_version,
          source: 'command-center-direct-bridge',
        },
      }),
    })

    const data = await resp.json().catch(() => ({ raw: 'non-json response' }))
    res.status(resp.status).json({
      ...data,
      bridge: 'direct-runner',
      runner_url: runnerUrl,
    })
  } catch (e) {
    res.status(502).json({
      error: 'runner_unreachable',
      detail: e.message,
      runner_base: RUNNER_BASE,
    })
  }
}

function safeJson(s) {
  try { return JSON.parse(s) } catch { return {} }
}
