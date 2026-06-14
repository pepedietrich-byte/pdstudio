// ─── A6 Fact Check API ──────────────────────────────────────────────────────
// Vercel serverless function für netzwerk-basierte Fact-Checks.
// - Website Reachability via HEAD/GET
// - Email MX-Lookup (Node 18+ dns)
//
// POST { website?: string, email?: string }
// → { website: { reachable, finalUrl, status, reason }, email: { mx_ok, mx_count } }

import { promises as dns } from 'node:dns'

const TIMEOUT_MS = 8000

async function checkWebsite(url) {
  if (!url) return null
  try {
    const u = url.startsWith('http') ? url : `https://${url}`
    new URL(u) // validate
    const r = await fetch(u, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDSTUDIO-FactCheck/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return {
      reachable: r.ok,
      status: r.status,
      finalUrl: r.url,
      reason: r.ok ? null : `HTTP ${r.status}`,
    }
  } catch (e) {
    return {
      reachable: false,
      status: null,
      finalUrl: null,
      reason: e.name === 'TimeoutError' ? 'timeout' : (e.message || 'fetch failed'),
    }
  }
}

async function checkEmailMx(email) {
  if (!email) return null
  const m = String(email).match(/^[^@\s]+@([^@\s]+)$/)
  if (!m) return { mx_ok: false, reason: 'invalid_format' }
  const domain = m[1].toLowerCase()
  try {
    const records = await dns.resolveMx(domain)
    if (!records || records.length === 0) {
      return { mx_ok: false, mx_count: 0, domain }
    }
    return {
      mx_ok: true,
      mx_count: records.length,
      domain,
      mx_top: records.sort((a, b) => a.priority - b.priority)[0]?.exchange || null,
    }
  } catch (e) {
    if (e.code === 'ENODATA' || e.code === 'ENOTFOUND') {
      return { mx_ok: false, reason: e.code, domain }
    }
    return { mx_ok: null, reason: e.message, domain }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const { website, email } = req.body || {}
  if (!website && !email) {
    res.status(400).json({ error: 'website or email required' })
    return
  }

  try {
    const [websiteResult, emailResult] = await Promise.all([
      website ? checkWebsite(website) : Promise.resolve(null),
      email ? checkEmailMx(email) : Promise.resolve(null),
    ])
    res.status(200).json({
      website: websiteResult,
      email: emailResult,
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
