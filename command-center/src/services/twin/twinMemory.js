const STORAGE_KEY = 'pdstudio_twin_memory_v1'

const EMPTY = {
  version: 1,
  memories: [],
  sessionCount: 0,
  lastSession: null,
}

const CATEGORY_LABELS = {
  fact:       'FAKTEN',
  decision:   'ENTSCHEIDUNGEN',
  preference: 'PRÄFERENZEN',
  goal:       'ZIELE',
  context:    'KONTEXT',
}

// ── Persistence ─────────────────────────────────────────────────

export function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY }
  }
}

function persist(memory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch { /* storage full or unavailable */ }
}

// ── CRUD ────────────────────────────────────────────────────────

export function saveMemory(content, category = 'fact', importance = 2) {
  const memory = loadMemory()
  const entry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    content: content.trim(),
    importance,       // 1 = low, 2 = medium, 3 = critical
    timestamp: new Date().toISOString(),
    confirmed: true,
  }
  memory.memories = [entry, ...memory.memories].slice(0, 200)
  persist(memory)
  return entry
}

export function deleteMemory(id) {
  const memory = loadMemory()
  memory.memories = memory.memories.filter(m => m.id !== id)
  persist(memory)
}

export function updateMemory(id, patch) {
  const memory = loadMemory()
  memory.memories = memory.memories.map(m => m.id === id ? { ...m, ...patch } : m)
  persist(memory)
}

export function clearAllMemory() {
  persist({ ...EMPTY })
}

export function incrementSessionCount() {
  const memory = loadMemory()
  memory.sessionCount = (memory.sessionCount || 0) + 1
  memory.lastSession = new Date().toISOString()
  persist(memory)
}

// ── Context Builder ──────────────────────────────────────────────
// Returns a string injected into TWIN at session start via sendContextualUpdate

export function buildMemoryContext(overrideMemory = null) {
  const memory = overrideMemory || loadMemory()
  if (!memory.memories || memory.memories.length === 0) return null

  const confirmed = memory.memories
    .filter(m => m.confirmed !== false)
    .sort((a, b) => (b.importance - a.importance) || (new Date(b.timestamp) - new Date(a.timestamp)))
    .slice(0, 20)

  if (confirmed.length === 0) return null

  const byCategory = {}
  confirmed.forEach(m => {
    const key = m.category || 'context'
    if (!byCategory[key]) byCategory[key] = []
    byCategory[key].push(m.content)
  })

  const sections = Object.entries(byCategory).map(([cat, items]) => {
    const label = CATEGORY_LABELS[cat] || cat.toUpperCase()
    return `[${label}]\n${items.map(i => `• ${i}`).join('\n')}`
  })

  const sessionInfo = memory.sessionCount > 0
    ? `\nDies ist Session #${memory.sessionCount + 1}. Letzte Session: ${memory.lastSession ? new Date(memory.lastSession).toLocaleDateString('de-DE') : 'unbekannt'}.`
    : ''

  return `TWIN MEMORY RECALL — Gespeichertes Wissen aus früheren Sessions:${sessionInfo}\n\n${sections.join('\n\n')}\n\nVerwende dieses Wissen um Pepe persönlich und präzise zu antworten.`
}

// ── Auto-Extraction ──────────────────────────────────────────────
// Heuristically extracts potentially memorable facts from TWIN messages

const IGNORE_PATTERNS = [
  /^(ok|ja|nein|verstanden|alles klar|gut|danke|bitte|gerne|sicher|natürlich)/i,
  /^\?/,
]

const IMPORTANT_PATTERNS = [
  /\d+\s*(€|euro|kunden|leads|agenten|prozent|%)/i,
  /(entscheid|empfehl|solltest|wichtig|kritisch|problem|fehler|fix|lösung)/i,
  /(diese woche|nächste woche|morgen|heute|nächsten monat|ziel|deadline)/i,
  /(agent \d|pipeline|deployment|vercel|n8n|supabase|poe api)/i,
]

export function extractSuggestedMemories(messages) {
  const agentMessages = messages.filter(m => m.source === 'agent' || m.role === 'assistant')
  const suggestions = []

  agentMessages.forEach(msg => {
    const text = (msg.message || msg.content || '').trim()
    if (text.length < 60) return
    if (IGNORE_PATTERNS.some(p => p.test(text))) return
    if (!IMPORTANT_PATTERNS.some(p => p.test(text))) return

    // Calculate importance from pattern matches
    const matchCount = IMPORTANT_PATTERNS.filter(p => p.test(text)).length
    const importance = matchCount >= 3 ? 3 : matchCount >= 2 ? 2 : 1

    suggestions.push({
      id: `suggest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content: text.length > 180 ? text.slice(0, 177) + '…' : text,
      category: guessCategory(text),
      importance,
      confirmed: false,
      timestamp: msg.ts ? new Date(msg.ts).toISOString() : new Date().toISOString(),
    })
  })

  return suggestions.slice(0, 8) // max 8 suggestions per session
}

function guessCategory(text) {
  if (/(entscheid|wählen|nutzen|verwenden|implementier)/i.test(text)) return 'decision'
  if (/(ziel|will|möchte|plane|nächste[rn]? schritt)/i.test(text)) return 'goal'
  if (/(bevorzug|lieber|immer|nie|nicht|kein)/i.test(text)) return 'preference'
  if (/\d+\s*(€|kunden|leads|prozent)/i.test(text)) return 'fact'
  return 'context'
}

export { CATEGORY_LABELS }
