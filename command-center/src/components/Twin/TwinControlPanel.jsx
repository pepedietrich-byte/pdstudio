// ─── TWIN PEPE Control Panel ────────────────────────────────────────────────
// Befehls-Interface für die Tool Registry.
// User schreibt Befehl → matchToolFromInput → Permission-Check →
// Confirmation (falls nötig) → executeTool → Result-Display + Log.

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Send, Loader2, ChevronRight, ShieldAlert,
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Trash2,
  Zap, Clock, Wrench,
} from 'lucide-react'
import {
  listTools, matchToolFromInput, executeTool, PERMISSION_LEVELS,
} from '../../services/twin/toolRegistry'

const SUGGESTIONS = [
  'Prüfe diesen Lead und sag mir warum der Build blockiert oder erlaubt ist.',
  'Generiere einen neuen Hero wenn der aktuelle unter 90 ist.',
  'Starte A6 Premium Prompt mit Poe-Analyse.',
  'Welche nächste Aktion empfiehlst du?',
  'Zeig mir die 3 Mail-Varianten für diesen Lead.',
  'FactCheck mit Netzwerk-Validierung.',
]

function TimeAgo({ ts }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])
  const seconds = Math.round((now - ts) / 1000)
  if (seconds < 60) return <span>{seconds}s</span>
  return <span>{Math.round(seconds / 60)}m</span>
}

function PermissionChip({ permission }) {
  const meta = PERMISSION_LEVELS[permission] || { label: permission, color: '#6b7a90' }
  return (
    <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}>
      {meta.label}
    </span>
  )
}

function LogEntry({ entry, onView }) {
  const Icon = entry.error ? XCircle : entry.requiresConfirmation ? ShieldAlert : entry.ok ? CheckCircle2 : AlertTriangle
  const color = entry.error ? '#ef4444' : entry.requiresConfirmation ? '#f5a623' : entry.ok ? '#39ff88' : '#9ca3b5'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded p-2 flex items-start gap-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}>
      <Icon size={11} style={{ color, marginTop: 2 }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <code className="font-mono text-[10px] font-bold" style={{ color }}>{entry.tool || 'unknown'}</code>
          <span className="font-mono text-[8px]" style={{ color: '#6b7a90' }}>
            <TimeAgo ts={entry.ts} /> · {entry.durationMs ? `${entry.durationMs}ms` : ''}
          </span>
        </div>
        <div className="text-[10px] mt-0.5 break-words" style={{ color: '#cbd5e1' }}>
          {entry.error || entry.requiresConfirmation || (entry.summary || 'OK')}
        </div>
        {entry.result && (
          <button onClick={() => onView(entry)}
            className="font-mono text-[9px] mt-1 underline"
            style={{ color: '#9ca3b5' }}>
            Result anzeigen ↗
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function TwinControlPanel({ lead = null, assets = [], gateReport = null, concept = null }) {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const [pendingConfirmation, setPendingConfirmation] = useState(null)
  const [viewerEntry, setViewerEntry] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const inputRef = useRef(null)

  const tools = useMemo(() => listTools(), [])

  const buildParamsFor = useCallback((tool) => {
    const params = {}
    if (tool.requiredParams?.includes('lead')) params.lead = lead
    if (tool.requiredParams?.includes('assets')) params.assets = assets
    if (tool.requiredParams?.includes('gate_report')) params.gate_report = gateReport
    if (tool.requiredParams?.includes('concept')) params.concept = concept
    if (tool.requiredParams?.includes('variant')) params.variant = 'consultative'
    if (tool.requiredParams?.includes('agentId')) params.agentId = 1
    return params
  }, [lead, assets, gateReport, concept])

  const exec = useCallback(async (toolName, params, confirmed = false) => {
    setRunning(true)
    const t0 = Date.now()
    try {
      const result = await executeTool(toolName, params, {
        confirmed,
        onLog: (msg) => {
          if (msg.type === 'start' || msg.type === 'end' || msg.type === 'error') {
            // we'll consume the final result below
          }
        },
      })
      const entry = {
        tool: toolName,
        ts: Date.now(),
        durationMs: result.durationMs || (Date.now() - t0),
        ok: result.ok,
        error: result.error,
        requiresConfirmation: result.requiresConfirmation ? `${result.reason} — Bestätigen?` : null,
        result: result.result,
        summary: result.result ? summarizeResult(toolName, result.result) : null,
      }
      setLog(prev => [entry, ...prev].slice(0, 30))
      if (result.requiresConfirmation) {
        setPendingConfirmation({ tool: toolName, params, reason: result.reason, cost: result.cost })
      } else {
        setPendingConfirmation(null)
      }
    } finally {
      setRunning(false)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || running) return
    const tool = matchToolFromInput(input)
    if (!tool) {
      setLog(prev => [{
        tool: 'no-match',
        ts: Date.now(),
        error: 'Kein passendes Tool gefunden. Klicke "Tools" um die Liste zu sehen.',
      }, ...prev].slice(0, 30))
      return
    }
    const params = buildParamsFor(tool)
    setInput('')
    await exec(tool.name, params, false)
  }, [input, running, buildParamsFor, exec])

  const handleConfirmPending = useCallback(async () => {
    if (!pendingConfirmation) return
    const { tool, params } = pendingConfirmation
    setPendingConfirmation(null)
    await exec(tool, params, true)
  }, [pendingConfirmation, exec])

  const handleCancelPending = useCallback(() => {
    setPendingConfirmation(null)
  }, [])

  const handleRunTool = useCallback(async (tool) => {
    const params = buildParamsFor(tool)
    await exec(tool.name, params, false)
  }, [buildParamsFor, exec])

  return (
    <div className="rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(15,20,30,0.6) 100%)',
        border: '1px solid rgba(255,215,0,0.25)',
      }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,215,0,0.15)' }}>
        <div className="flex items-center gap-2">
          <Terminal size={14} style={{ color: '#ffd700' }} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: '#ffd700' }}>
            TWIN · Command Interface
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTools(s => !s)}
            className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest"
            style={{ color: showTools ? '#ffd700' : '#6b7a90' }}>
            <Wrench size={9} /> Tools ({tools.length})
          </button>
          {log.length > 0 && (
            <button onClick={() => setLog([])}
              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: '#6b7a90' }}>
              <Trash2 size={9} /> Log
            </button>
          )}
        </div>
      </div>

      {/* Lead/Context status */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>
          Context:
        </span>
        <Ctx label="lead" ok={!!lead} value={lead?.business_name || lead?.lead_id || ''} />
        <Ctx label="assets" ok={assets.length > 0} value={assets.length > 0 ? `${assets.length}` : '0'} />
        <Ctx label="gate" ok={!!gateReport} value={gateReport?.verdict || '—'} />
        <Ctx label="concept" ok={!!concept} value={concept?.style_id || '—'} />
      </div>

      {/* Tools List */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {tools.map(t => (
                <button key={t.name} onClick={() => handleRunTool(t)}
                  disabled={running}
                  className="text-left rounded p-2 transition"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <code className="font-mono text-[10px] font-bold" style={{ color: '#ffd700' }}>{t.name}</code>
                    <PermissionChip permission={t.permission} />
                  </div>
                  <div className="text-[9px] leading-relaxed" style={{ color: '#cbd5e1' }}>{t.description}</div>
                  {t.cost && (
                    <div className="font-mono text-[8px] uppercase tracking-widest mt-1 flex items-center gap-1"
                      style={{ color: '#f5a623' }}>
                      <Zap size={8} /> {t.cost.poeCalls} Poe call · {t.cost.model}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <ChevronRight size={12} style={{ color: '#ffd700' }} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder='z.B. "Prüfe diesen Lead" oder "Generiere 3 Mails"'
            disabled={running}
            className="flex-1 bg-transparent outline-none text-[11px] font-mono"
            style={{ color: '#e8edf4' }}
          />
          <button onClick={handleSubmit}
            disabled={running || !input.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(255,215,0,0.18)',
              border: '1px solid rgba(255,215,0,0.5)',
              color: '#ffd700',
              opacity: running || !input.trim() ? 0.4 : 1,
            }}>
            {running ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Run
          </button>
        </div>
        {!input && log.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="text-[9px] px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: '#9ca3b5',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending Confirmation */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3"
            style={{
              background: 'rgba(245,166,35,0.08)',
              borderTop: '1px solid rgba(245,166,35,0.3)',
              borderBottom: '1px solid rgba(245,166,35,0.3)',
            }}>
            <div className="flex items-start gap-2 mb-2">
              <ShieldAlert size={14} style={{ color: '#f5a623', marginTop: 2 }} />
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: '#f5a623' }}>
                  Bestätigung erforderlich
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#cbd5e1' }}>
                  <strong>{pendingConfirmation.tool}</strong> — {pendingConfirmation.reason}
                  {pendingConfirmation.cost && (
                    <span style={{ color: '#f5a623' }}> ({pendingConfirmation.cost.poeCalls} Poe-Call · {pendingConfirmation.cost.model})</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirmPending}
                disabled={running}
                className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(57,255,136,0.18)',
                  border: '1px solid rgba(57,255,136,0.4)',
                  color: '#39ff88',
                }}>
                <Sparkles size={10} /> Ausführen
              </button>
              <button onClick={handleCancelPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#9ca3b5',
                }}>
                Abbrechen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log */}
      <div className="px-4 py-3 space-y-1.5 max-h-96 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.15)' }}>
        {log.length === 0 ? (
          <div className="text-center py-4" style={{ color: '#6b7a90' }}>
            <Clock size={20} className="mx-auto mb-2 opacity-30" />
            <div className="text-[10px] font-mono uppercase tracking-widest">
              Noch keine Aktionen ausgeführt
            </div>
          </div>
        ) : (
          log.map((entry, i) => (
            <LogEntry key={entry.ts + '-' + i} entry={entry} onView={setViewerEntry} />
          ))
        )}
      </div>

      {/* Result Viewer Modal */}
      <AnimatePresence>
        {viewerEntry && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,8,14,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setViewerEntry(null)}>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-3xl max-h-[80vh] rounded-xl flex flex-col"
              style={{
                background: 'rgba(15,20,30,0.98)',
                border: '1px solid rgba(255,215,0,0.3)',
              }}
              onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <code className="font-mono text-[11px] font-bold" style={{ color: '#ffd700' }}>
                  {viewerEntry.tool} · result
                </code>
                <button onClick={() => setViewerEntry(null)}
                  className="font-mono text-[10px]" style={{ color: '#9ca3b5' }}>Schließen</button>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-[10px] font-mono leading-relaxed"
                style={{ color: '#cbd5e1' }}>
                {JSON.stringify(viewerEntry.result, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Ctx({ label, ok, value }) {
  return (
    <span className="font-mono text-[8px] uppercase tracking-widest flex items-center gap-1"
      style={{ color: ok ? '#39ff88' : '#6b7a90' }}>
      {label}: <strong>{String(value).slice(0, 14) || '—'}</strong>
    </span>
  )
}

// ── Result Summarizer ─────────────────────────────────────────────────────
function summarizeResult(toolName, result) {
  if (!result) return null
  if (toolName === 'lead.qualify') return `Score ${result.leadScore} · ${result.scoreBand?.label}`
  if (toolName === 'lead.factCheck') return `Gate ${result.factGatePassed ? 'OK' : 'BLOCKED'} · Send ${result.sendReady ? 'READY' : 'NOT READY'}`
  if (toolName === 'assets.analyze') return `${result.summary?.heroReady || 0} Hero · ${result.summary?.usable || 0} usable`
  if (toolName === 'gate.run') return `Verdict: ${result.verdict}`
  if (toolName === 'concept.generate') return `Style: ${result.style_id}`
  if (toolName === 'mail.generate3') return result.blocked ? `Blocked: ${result.reason}` : `${result.variants?.length || 0} Mails generiert`
  if (toolName === 'mail.generateOne') return result.error ? result.error : `Confidence ${result.confidence}% · ${result.sendReady ? 'send ready' : 'review'}`
  if (toolName === 'prompt.buildPremium') return `Quality ${result.promptQualityScore} · readyForA7: ${result.readyForA7}`
  if (toolName === 'prompt.buildStandard') return `Prompt ${result.prompt?.prompt?.length || 0} Zeichen`
  if (toolName === 'pipeline.nextAction') return `Score ${result.leadScore} · ${result.nextAction?.slice(0, 60)}`
  if (toolName === 'pipeline.full') return result.blocked ? 'Blocked' : `${result.steps?.length || 0} Phasen · readyForA7: ${result.finalPromptReady}`
  return JSON.stringify(result).slice(0, 100)
}
