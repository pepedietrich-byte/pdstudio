// ─── A4 GOETHE Panel ──────────────────────────────────────────────────
// Generiert 3 Mail-Varianten parallel via Poe.
// Zeigt Vorschau, Risk-Flags, Confidence, sendReady.
// User kann jede Variante einzeln kopieren.

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenLine, Loader2, Copy, ClipboardCheck, AlertTriangle,
  CheckCircle2, ShieldAlert, Sparkles, Mail, ChevronRight,
} from 'lucide-react'
import { generateAllMailVariants } from '../lib/mailBuilder'
import { runFactCheck } from '../lib/factChecker'

const VARIANT_COLORS = {
  short: '#00d4ff',
  consultative: '#39ff88',
  premium: '#f5a623',
}

function VariantCard({ variant, onCopy, copyState }) {
  const color = VARIANT_COLORS[variant.variant] || '#9ca3b5'
  const confColor = variant.confidence >= 70 ? '#39ff88' : variant.confidence >= 50 ? '#f5a623' : '#ef4444'

  if (variant.error) {
    return (
      <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="text-[10px]" style={{ color: '#ef4444' }}>
          <strong>{variant.variantLabel}:</strong> {variant.error}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}06 0%, rgba(15,20,30,0.6) 100%)`,
        border: `1px solid ${color}30`,
      }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between gap-2"
        style={{ borderBottom: `1px solid ${color}20` }}>
        <div className="flex items-center gap-2">
          <Mail size={11} style={{ color }} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color }}>
            {variant.variantLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-bold tabular-nums" style={{ color: confColor }}>
            {variant.confidence}%
          </span>
          {variant.sendReady ? (
            <CheckCircle2 size={11} style={{ color: '#39ff88' }} />
          ) : (
            <ShieldAlert size={11} style={{ color: '#f5a623' }} />
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="px-3 py-2"
        style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="font-mono text-[8px] uppercase tracking-widest mb-0.5" style={{ color: '#6b7a90' }}>
          Betreff ({variant.subject?.length || 0})
        </div>
        <div className="text-[12px] font-semibold" style={{ color: '#e8edf4' }}>
          {variant.subject || '—'}
        </div>
        {variant.previewText && (
          <div className="text-[10px] mt-1" style={{ color: '#9ca3b5' }}>
            {variant.previewText}
          </div>
        )}
      </div>

      {/* Body Preview */}
      <div className="px-3 py-2.5">
        <div className="font-mono text-[8px] uppercase tracking-widest mb-1.5" style={{ color: '#6b7a90' }}>
          Body ({(variant.emailBody || '').length} Zeichen)
        </div>
        <div className="text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto"
          style={{ color: '#cbd5e1' }}>
          {variant.emailBody || '—'}
        </div>
      </div>

      {/* Personalization + Risk Flags */}
      {(variant.personalizationPoints?.length > 0 || variant.riskFlags?.length > 0) && (
        <div className="px-3 pb-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
          {variant.personalizationPoints?.length > 0 && (
            <div className="rounded p-1.5"
              style={{ background: 'rgba(57,255,136,0.03)', border: '1px solid rgba(57,255,136,0.12)' }}>
              <div className="flex items-center gap-1 mb-1">
                <Sparkles size={9} style={{ color: '#39ff88' }} />
                <span className="font-mono text-[8px] uppercase tracking-widest font-bold" style={{ color: '#39ff88' }}>
                  Personalisierung
                </span>
              </div>
              <ul className="space-y-0.5">
                {variant.personalizationPoints.map((p, i) => (
                  <li key={i} className="text-[9px]" style={{ color: '#cbd5e1' }}>· {p}</li>
                ))}
              </ul>
            </div>
          )}
          {variant.riskFlags?.length > 0 && (
            <div className="rounded p-1.5"
              style={{ background: 'rgba(245,166,35,0.03)', border: '1px solid rgba(245,166,35,0.18)' }}>
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle size={9} style={{ color: '#f5a623' }} />
                <span className="font-mono text-[8px] uppercase tracking-widest font-bold" style={{ color: '#f5a623' }}>
                  Risk Flags ({variant.riskFlags.length})
                </span>
              </div>
              <ul className="space-y-0.5">
                {variant.riskFlags.map((r, i) => (
                  <li key={i} className="text-[9px]" style={{ color: '#cbd5e1' }}>· {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between gap-2"
        style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>
          {variant.sendReady
            ? 'send ready'
            : (variant.reasonIfNotSendReady || []).join(' · ') || 'review needed'}
        </div>
        <button onClick={() => onCopy(variant)}
          className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: copyState === variant.variant ? 'rgba(57,255,136,0.18)' : `${color}15`,
            border: `1px solid ${copyState === variant.variant ? 'rgba(57,255,136,0.45)' : color + '35'}`,
            color: copyState === variant.variant ? '#39ff88' : color,
          }}>
          {copyState === variant.variant
            ? <><ClipboardCheck size={10} /> Kopiert</>
            : <><Copy size={10} /> Kopieren</>}
        </button>
      </div>
    </motion.div>
  )
}

export default function MailBuilderPanel({ lead }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState(null)

  const generate = useCallback(async () => {
    if (!lead) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const factCheck = runFactCheck(lead)
      const r = await generateAllMailVariants(lead, factCheck)
      setResult({ ...r, factCheck })
    } catch (e) {
      setError(e.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }, [lead])

  const handleCopy = useCallback(async (variant) => {
    const text = `Betreff: ${variant.subject}\n\n${variant.emailBody}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyState(variant.variant)
      setTimeout(() => setCopyState(null), 2000)
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="rounded-lg p-4 mt-3"
      style={{ background: 'rgba(245,166,35,0.03)', border: '1px solid rgba(245,166,35,0.2)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <PenLine size={14} style={{ color: '#f5a623' }} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: '#f5a623' }}>
            A4 · GOETHE · 3 Mail-Varianten
          </span>
        </div>
        <button onClick={generate}
          disabled={loading || !lead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold"
          style={{
            background: loading ? 'rgba(245,166,35,0.06)' : 'rgba(245,166,35,0.15)',
            border: '1px solid rgba(245,166,35,0.4)',
            color: '#f5a623',
            cursor: loading ? 'wait' : 'pointer',
          }}>
          {loading
            ? <><Loader2 size={11} className="animate-spin" /> Generiere…</>
            : <><ChevronRight size={11} /> 3 Mails bauen</>}
        </button>
      </div>

      {!result && !loading && (
        <p className="text-[10px]" style={{ color: '#9ca3b5' }}>
          Erzeugt drei Mail-Varianten via Poe (kurz · beratend · premium). Nutzt FactCheck-Daten;
          unsichere Felder werden nicht im Body verwendet. Versand erfolgt manuell — kein Auto-Send.
        </p>
      )}

      {error && (
        <div className="rounded p-2 text-[10px]" style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {result?.blocked && (
        <div className="rounded p-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={11} style={{ color: '#ef4444' }} />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: '#ef4444' }}>
              A4 blockiert
            </span>
          </div>
          <div className="text-[11px]" style={{ color: '#cbd5e1' }}>{result.reason}</div>
          {result.blockingReasons?.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.blockingReasons.map((r, i) => (
                <li key={i} className="text-[10px]" style={{ color: '#ef4444' }}>· {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result?.variants && (
        <AnimatePresence>
          <div className="space-y-3">
            {result.variants.map(v => (
              <VariantCard key={v.variant} variant={v} onCopy={handleCopy} copyState={copyState} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
