import Papa from 'papaparse'

const SHEET_ID  = import.meta.env.VITE_SHEET_ID  || ''
const API_KEY   = import.meta.env.VITE_SHEETS_API_KEY || ''
const N8N_BASE  = import.meta.env.VITE_N8N_BASE_URL || ''

const TABS = ['LEADS','CONTENT','IMAGES','VALIDATION','CONCEPT','BUILD']

const ARRAY_COLS = ['verkaufsargumente','warnings','angebot','speisekarte','spezialitaeten',
  'kueche','socials','galerie_urls','farbpalette','sections','improvements_vs_original',
  'missing_fields','tech_stack','extraktion_quellen',
  'missing_critical','missing_optional','rueckabe_an','ersatzstrategie']

const JSON_COLS = ['score_breakdown']

function splitArrayField(val) {
  if (!val || typeof val !== 'string') return []
  return val.split('|').map(s => s.trim()).filter(Boolean)
}

function parseJsonField(val) {
  if (!val || typeof val !== 'string') return {}
  try { return JSON.parse(val) } catch { return {} }
}

function parseRow(headers, row) {
  const obj = {}
  headers.forEach((h, i) => {
    const key = h.trim()
    const val = (row[i] ?? '').toString().trim()
    if (ARRAY_COLS.includes(key)) {
      obj[key] = splitArrayField(val)
    } else if (JSON_COLS.includes(key)) {
      obj[key] = parseJsonField(val)
    } else {
      obj[key] = val
    }
  })
  return obj
}

async function fetchViaN8nProxy(tab) {
  try {
    const r = await fetch(`/api/sheets?tab=${encodeURIComponent(tab)}`)
    if (r.ok) {
      const json = await r.json()
      if (Array.isArray(json.data) && json.data.length > 0) return json.data
    }
  } catch (_) { /* proxy not available in dev */ }

  if (!N8N_BASE) return null
  try {
    const url = `${N8N_BASE}/webhook/sheets-data?tab=${encodeURIComponent(tab)}`
    const r = await fetch(url)
    if (!r.ok) return null
    const json = await r.json()
    return Array.isArray(json.data) ? json.data : null
  } catch { return null }
}

async function fetchViaAPI(tab) {
  if (!SHEET_ID || !API_KEY) return null
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${tab}?key=${API_KEY}`
    const r = await fetch(url)
    if (!r.ok) return null
    const { values = [] } = await r.json()
    if (values.length < 2) return []
    const [headers, ...rows] = values
    return rows.map(row => parseRow(headers, row))
  } catch { return null }
}

const CSV_URLS = {
  LEADS:      import.meta.env.VITE_CSV_LEADS || '',
  CONTENT:    import.meta.env.VITE_CSV_CONTENT || '',
  IMAGES:     import.meta.env.VITE_CSV_IMAGES || '',
  VALIDATION: import.meta.env.VITE_CSV_VALIDATION || '',
  CONCEPT:    import.meta.env.VITE_CSV_CONCEPT || '',
  BUILD:      import.meta.env.VITE_CSV_BUILD || '',
}

async function fetchViaCSV(tab) {
  const url = CSV_URLS[tab]
  if (!url) return null
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const text = await r.text()
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
    return data.map(row => {
      const parsed = {}
      Object.entries(row).forEach(([k, v]) => {
        if (ARRAY_COLS.includes(k)) parsed[k] = splitArrayField(v)
        else if (JSON_COLS.includes(k)) parsed[k] = parseJsonField(v)
        else parsed[k] = (v ?? '')
      })
      return parsed
    })
  } catch { return null }
}

export async function fetchTab(tab) {
  const n8n = await fetchViaN8nProxy(tab)
  if (n8n !== null) return n8n
  const api = await fetchViaAPI(tab)
  if (api !== null) return api
  const csv = await fetchViaCSV(tab)
  if (csv !== null) return csv
  return []
}

export async function fetchAllTabs() {
  const results = await Promise.allSettled(TABS.map(t => fetchTab(t)))
  const out = {}
  TABS.forEach((t, i) => {
    out[t] = results[i].status === 'fulfilled' ? (results[i].value ?? []) : []
  })
  return out
}

function normalizeUrl(url) {
  if (!url) return ''
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

export function findDuplicateByUrl(url, leads) {
  if (!url) return null
  const norm = normalizeUrl(url)
  return leads.find(l => {
    const lw = normalizeUrl(l.website || l.content?.website || '')
    return lw && lw === norm
  }) ?? null
}

export function joinLeadData(sheets) {
  const rawLeads = sheets.LEADS ?? []

  const byId = (arr) => {
    const map = new Map()
    for (const row of arr) {
      if (row.lead_id) map.set(row.lead_id, row)
    }
    return map
  }

  const contentMap    = byId(sheets.CONTENT    ?? [])
  const imagesMap     = byId(sheets.IMAGES     ?? [])
  const validationMap = byId(sheets.VALIDATION ?? [])
  const conceptMap    = byId(sheets.CONCEPT    ?? [])

  // BUILD: prefer last row with demo_url or build_status — old broken runs left
  // many empty rows that would otherwise overwrite good data from earlier builds.
  const buildMap = (() => {
    const map = new Map()
    for (const row of (sheets.BUILD ?? [])) {
      if (!row.lead_id) continue
      const existing = map.get(row.lead_id)
      if (!existing || row.demo_url || row.build_status) map.set(row.lead_id, row)
    }
    return map
  })()

  const seenIds = new Set()
  const deduped = []
  for (let i = rawLeads.length - 1; i >= 0; i--) {
    const lead = rawLeads[i]
    if (!lead.lead_id || seenIds.has(lead.lead_id)) continue
    seenIds.add(lead.lead_id)
    deduped.push(lead)
  }

  return deduped.map(lead => ({
    ...lead,
    content:    contentMap.get(lead.lead_id)    ?? {},
    images:     imagesMap.get(lead.lead_id)     ?? {},
    validation: validationMap.get(lead.lead_id) ?? {},
    concept:    conceptMap.get(lead.lead_id)    ?? {},
    build:      buildMap.get(lead.lead_id)      ?? {},
  }))
}

export function getLeadStage(lead) {
  const demoUrl = lead.build?.demo_url || ''
  if (demoUrl && !demoUrl.startsWith('/files') && /^https?:\/\//.test(demoUrl)) return 7
  if (Number(lead.build?.prompt_chars) > 0 || lead.build?.build_status) return 6
  if (lead.concept?.design_direction || lead.concept?.hero_headline) return 5
  if (lead.validation?.ready_for_concept === 'true' || lead.validation?.ready_for_concept === true
      || lead.validation?.validation_score || lead.validation?.data_quality_score) return 4
  if (lead.images?.lead_id || lead.images?.hero_url) return 3
  if (lead.content?.lead_id || lead.content?.name) return 2
  if (lead.lead_id) return 1
  return 0
}

export function getConfidence(lead) {
  const raw = lead.confidence || lead.validation?.confidence || ''
  const n = parseFloat(raw)
  return isNaN(n) ? 0 : Math.min(1, Math.max(0, n))
}

export function getScoreBreakdown(lead) {
  if (lead.score_breakdown && typeof lead.score_breakdown === 'object') {
    return lead.score_breakdown
  }
  if (typeof lead.score_breakdown === 'string') {
    try { return JSON.parse(lead.score_breakdown) } catch { return {} }
  }
  return {}
}
