// ─── Sites filter logic ─────────────────────────────────────────────────────
// Zeige nur Sites die:
//  1. gestern oder heute erstellt wurden (laut Sheet-Datum)
//  2. ODER in dieser Browser-Session frisch gebaut/redeployed wurden

const SESSION_KEY = 'pdstudio.fresh_sites.v1'

// ── Date helpers ────────────────────────────────────────────────────────────
function parseDate(value) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return d
  } catch { return null }
}

function isYesterdayOrToday(date, now = new Date()) {
  if (!date) return false
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(start.getTime() - 24 * 60 * 60 * 1000)
  return date >= yesterday
}

// Versucht aus einem BUILD-Row das beste Datum zu extrahieren
function buildDate(build) {
  if (!build) return null
  const fields = [
    'deployed_at', 'built_at', 'build_date', 'created_at',
    'generated_at', 'updated_at', 'date', 'timestamp',
  ]
  for (const f of fields) {
    const d = parseDate(build[f])
    if (d) return d
  }
  return null
}

// ── Session-Tracker ─────────────────────────────────────────────────────────
// Frische Builds dieser Session — auch wenn das Sheet noch nicht aktualisiert ist
export function markSiteFresh(leadId, demoUrl) {
  if (!leadId || !demoUrl) return
  try {
    const cur = readFresh()
    cur[leadId] = { demo_url: demoUrl, at: new Date().toISOString() }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cur))
    // Notify other components
    window.dispatchEvent(new CustomEvent('pdstudio:site-fresh', {
      detail: { lead_id: leadId, demo_url: demoUrl },
    }))
  } catch {}
}

export function readFresh() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}') } catch { return {} }
}

export function isFresh(leadId) {
  return !!readFresh()[leadId]
}

// ── Hauptfilter ────────────────────────────────────────────────────────────
function hasValidDemoUrl(lead) {
  const url = lead?.build?.demo_url || ''
  return !!url && /^https?:\/\//.test(url) && !url.startsWith('/files')
}

export function filterRelevantSites(leads = []) {
  const fresh = readFresh()
  const now = new Date()

  return leads.filter(l => {
    if (!hasValidDemoUrl(l)) return false

    // 1. Session-Fresh? Immer anzeigen
    if (fresh[l.lead_id]) return true

    // 2. Datum aus Sheet — gestern/heute?
    const d = buildDate(l.build)
    if (d && isYesterdayOrToday(d, now)) return true

    return false
  })
}

export function getSiteDate(lead) {
  const fresh = readFresh()[lead.lead_id]
  if (fresh) return parseDate(fresh.at)
  return buildDate(lead.build)
}

export function formatRelativeDate(date) {
  if (!date) return '—'
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(start.getTime() - 24 * 60 * 60 * 1000)

  if (date >= start) {
    return 'Heute ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  if (date >= yesterday) {
    return 'Gestern ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function countRelevantSites(leads = []) {
  return filterRelevantSites(leads).length
}

// React hook für reactives Re-Rendern nach markSiteFresh
import { useEffect, useState } from 'react'
export function useFreshSitesVersion() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const onFresh = () => setV(x => x + 1)
    window.addEventListener('pdstudio:site-fresh', onFresh)
    return () => window.removeEventListener('pdstudio:site-fresh', onFresh)
  }, [])
  return v
}
