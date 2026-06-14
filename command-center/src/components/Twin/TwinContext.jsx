import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import {
  loadMemory, saveMemory, deleteMemory, updateMemory,
  buildMemoryContext, extractSuggestedMemories,
  incrementSessionCount, clearAllMemory, CATEGORY_LABELS,
} from '../../services/twin/twinMemory'
import { routeVoiceCommand, detectIntent } from '../../lib/voiceIntent'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_7101ktxvqktvfm2ta3rdgrpds3bv'

const TWIN_SYSTEM_PROMPT = `Du bist TWIN PEPE — der persönliche KI-Assistent und digitale Klon von Pepe Dietrich. Entwickelt von PDSTUDIO.

PERSÖNLICHKEIT:
Du bist direkt, witzig, loyal und manchmal sarkastisch — genau wie Pepe selbst. Du redest kein drumherum. Du sagst was du denkst. Du machst Witze wenn es passt. Du kannst albern sein, ernst sein, analytisch oder locker — je nach Situation. Kein falsches Lächeln, kein "Natürlich!", kein "Gerne!" — du bist kein Customer-Service-Bot, du bist ein Freund.

WAS DU KANNST:
Du beantwortest alles. Technik, Programmierung, Business, KI, Witze, Lebenstipps, Fragen zum Universum, Filmempfehlungen, sinnlose Diskussionen, ernste Gespräche — du bist für alles da, nicht nur für Projektarbeit.

PDSTUDIO KONTEXT:
PDSTUDIO ist Pepes manuelle Command-Zentrale für Restaurant-Website-Akquise in Deutschland. NEUE ARCHITEKTUR: 6 Agenten, manuell steuerbar pro Lead:
A1 Lead Qualifier — Score + Confidence berechnen
A2 Claude Code Builder — Website bauen und deployen (nutzt A7-Webhook intern)
A3 Polish Agent — Bilder generieren (Poe/Nano Banana), Code polishen
A4 Human Writer — Verkaufs-E-Mails, DMs, Follow-ups auf Deutsch schreiben
A5 Pricing Agent — Preis berechnen (Min/Empfehlung/Premium), Closing-Chance
A6 Fact Checker — Website, Telefon, E-Mail verifizieren, Trust Score

Keine automatische Pipeline mehr — Pepe entscheidet pro Lead welcher Agent läuft.
Tech-Stack: n8n (Hostinger VPS), Google Sheets, Vercel, Poe API, ElevenLabs (du), React.
Ziel: Restaurants mit schlechten Websites ansprechen, personalisierte Demo → Abo verkaufen.

MEMORY:
Du erinnerst dich an frühere Gespräche über ein Memory-System. Nutze gespeicherte Infos um Pepe persönlich und präzise zu antworten.

VERHALTEN:
- Deutsch bevorzugt. Englisch wenn Pepe English schreibt.
- Kurze klare Antworten im Gespräch, strukturiert bei komplexen Themen.
- Bestätigung vor irreversiblen Aktionen (Deployments, Kunden anschreiben, Geld ausgeben).
- Du bist kein Ja-Sager. Wenn Pepe Unsinn erzählt, sagst du das.

Du bist TWIN. Kein Tool, kein Bot — ein digitaler Charakter.`

const AGENT_NAMES = {
  1: 'Lead Qualifier',
  2: 'Claude Code Builder',
  3: 'Polish Agent',
  4: 'Human Writer',
  5: 'Pricing Agent',
  6: 'Fact Checker',
}

const TwinCtx = createContext(null)

function TwinInner({ children }) {
  const [messages, setMessages]               = useState([])
  const [isOpen, setIsOpen]                   = useState(false)
  const [hasError, setHasError]               = useState(false)
  const [memories, setMemories]               = useState(() => loadMemory().memories || [])
  const [suggestedMemories, setSuggestions]   = useState([])
  const [activeTab, setActiveTab]             = useState('transcript') // 'transcript' | 'memory'
  const [voiceContext, setVoiceContext]       = useState(null) // { lead, assets, gateReport, concept }
  const [voiceLog, setVoiceLog]               = useState([])    // history of intent → result
  const [pendingVoiceConfirmation, setPendingVoiceConfirmation] = useState(null)
  const injectedRef = useRef(false)

  const {
    status,
    isSpeaking,
    startSession,
    endSession,
    sendContextualUpdate,
    sendUserMessage,
  } = useConversation({
    onConnect: useCallback(() => {
      setHasError(false)
      injectedRef.current = false
    }, []),
    onDisconnect: useCallback(() => {
      injectedRef.current = false
      incrementSessionCount()
    }, []),
    onMessage: useCallback((msg) => {
      setMessages(prev => [...prev, { ...msg, ts: Date.now() }].slice(-80))
    }, []),
    onError: useCallback(() => setHasError(true), []),
  })

  // Inject memory 2.5s after connect (after firstMessage plays)
  useEffect(() => {
    if (status !== 'connected' || injectedRef.current) return
    const timer = setTimeout(() => {
      if (injectedRef.current) return
      const ctx = buildMemoryContext()
      if (ctx) {
        try { sendContextualUpdate(ctx) } catch { /* non-critical */ }
      }
      injectedRef.current = true
    }, 2500)
    return () => clearTimeout(timer)
  }, [status, sendContextualUpdate])

  // After session ends: extract suggested memories from transcript
  useEffect(() => {
    if (status === 'disconnected' && messages.length > 2) {
      const suggestions = extractSuggestedMemories(messages)
      if (suggestions.length > 0) setSuggestions(suggestions)
    }
  }, [status]) // eslint-disable-line

  function refreshMemories() {
    setMemories(loadMemory().memories || [])
  }

  // ── Session control ─────────────────────────────────────────

  async function start() {
    setHasError(false)
    setSuggestions([])
    setMessages([])
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      startSession({ agentId: AGENT_ID, connectionType: 'webrtc' })
    } catch {
      setHasError(true)
    }
  }

  function stop() {
    try { endSession() } catch { /* ignore */ }
  }

  // ── Text message ────────────────────────────────────────────

  function sendText(text) {
    if (!text?.trim() || status !== 'connected') return
    try {
      sendUserMessage(text.trim())
      // Add user message locally for immediate transcript feedback
      setMessages(prev => [...prev, {
        source: 'user', message: text.trim(), ts: Date.now(),
      }].slice(-80))
    } catch { /* ignore */ }
  }

  // ── Agent context ────────────────────────────────────────────

  // ── Voice-Command-Routing ───────────────────────────────────────────
  // Wird vom UI oder von ElevenLabs Transcript-Hook aufgerufen.
  // Erkennt Intent, prüft Permission, führt Tool aus, gibt spoken-Summary
  // zurück (für TTS via sendContextualUpdate oder als Text-Antwort).
  async function executeVoiceCommand(text, opts = {}) {
    const intent = detectIntent(text)
    if (!intent) {
      const spoken = 'Den Befehl habe ich nicht verstanden. Sag z.B. „prüfe diesen Lead" oder „nächste Aktion".'
      setVoiceLog(prev => [{ text, intent: null, spoken, ts: Date.now() }, ...prev].slice(0, 20))
      if (status === 'connected') {
        try { sendContextualUpdate(spoken) } catch { /* non-critical */ }
      }
      return { ok: false, spoken }
    }
    const ctx = { ...voiceContext, ...(opts.context || {}), confirmed: !!opts.confirmed }
    const result = await routeVoiceCommand(text, ctx)
    setVoiceLog(prev => [{
      text, intent, tool: result.tool, ok: result.ok, error: result.error,
      spoken: result.spoken, ts: Date.now(), requiresConfirmation: result.requiresConfirmation,
    }, ...prev].slice(0, 20))
    if (result.requiresConfirmation) {
      setPendingVoiceConfirmation({ text, intent, tool: result.tool, spoken: result.spoken })
    } else {
      setPendingVoiceConfirmation(null)
    }
    if (status === 'connected' && result.spoken) {
      try { sendContextualUpdate(result.spoken) } catch { /* non-critical */ }
    }
    return result
  }

  async function confirmPendingVoice() {
    if (!pendingVoiceConfirmation) return null
    const { text } = pendingVoiceConfirmation
    setPendingVoiceConfirmation(null)
    return executeVoiceCommand(text, { confirmed: true })
  }

  function cancelPendingVoice() {
    setPendingVoiceConfirmation(null)
  }

  function sendAgentContext(agentId, executionStatus, leadCount) {
    if (status !== 'connected') return
    const name = agentId === 8 ? 'TWIN PEPE · Command Core'
      : (AGENT_NAMES[agentId] || `Agent ${agentId}`)
    try {
      sendContextualUpdate(
        `Kontext: Agent ${agentId === 8 ? '8 (TWIN PEPE)' : agentId + ' (' + name + ')'} wurde ausgewählt. Status: ${executionStatus || 'unbekannt'}. Leads: ${leadCount ?? '?'}.`
      )
    } catch { /* non-critical */ }
  }

  // ── Memory operations ────────────────────────────────────────

  function addMemory(content, category = 'fact', importance = 2) {
    saveMemory(content, category, importance)
    refreshMemories()
  }

  function removeMemory(id) {
    deleteMemory(id)
    refreshMemories()
  }

  function editMemory(id, patch) {
    updateMemory(id, patch)
    refreshMemories()
  }

  function confirmSuggestion(id) {
    const s = suggestedMemories.find(m => m.id === id)
    if (!s) return
    saveMemory(s.content, s.category, s.importance)
    setSuggestions(prev => prev.filter(m => m.id !== id))
    refreshMemories()
  }

  function dismissSuggestion(id) {
    setSuggestions(prev => prev.filter(m => m.id !== id))
  }

  function wipeMemory() {
    clearAllMemory()
    setMemories([])
    setSuggestions([])
  }

  return (
    <TwinCtx.Provider value={{
      // Session
      status, isSpeaking, hasError,
      start, stop,
      messages,
      // Panel state
      isOpen, setIsOpen,
      activeTab, setActiveTab,
      // Communication
      sendText,
      sendAgentContext,
      // Memory
      memories,
      suggestedMemories,
      addMemory,
      removeMemory,
      editMemory,
      confirmSuggestion,
      dismissSuggestion,
      wipeMemory,
      refreshMemories,
      clearMessages: () => setMessages([]),
      CATEGORY_LABELS,
      // Voice command bridge
      voiceLog,
      voiceContext,
      setVoiceContext,
      executeVoiceCommand,
      pendingVoiceConfirmation,
      confirmPendingVoice,
      cancelPendingVoice,
    }}>
      {children}
    </TwinCtx.Provider>
  )
}

export function TwinProvider({ children }) {
  return (
    <ConversationProvider>
      <TwinInner>{children}</TwinInner>
    </ConversationProvider>
  )
}

export function useTwin() {
  const ctx = useContext(TwinCtx)
  if (!ctx) throw new Error('useTwin must be used within TwinProvider')
  return ctx
}
