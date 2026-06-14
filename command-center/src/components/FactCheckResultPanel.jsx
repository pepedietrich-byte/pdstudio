// ─── A6 Fact Check Result Panel ─────────────────────────────────────────────
// Zeigt das Resultat von runFactCheck() / runFactCheckAsync().
// Trennt verified / uncertain / conflicts / missing.
// Liefert "Send Ready"-Verdict.

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Loader2,
  Phone, Mail, Globe, MapPin, Clock, Building2, Wifi, Send,
} from 'lucide-react'
import { runFactCheckAsync } from '../lib/factChecker'

const FIELD_ICONS = {
  business_name: Building2,
  phone: Phone,
  email: Mail,
  website: Globe,
  website_reachable: Wifi,
  website_final_url: Globe,
  address: MapPin,
  opening_hours: Clock,
  email_mx: Mail,
}

const FIELD_LABELS = {
  business_name: 'Name',
  phone: 'Telefon',
  email: 'E-Mail',
  website: 'Website',
  website_reachable: 'Website erreichbar',
  website_final_url: 'Final URL',
  address: 'Adresse',
  opening_hours: 'Öffnungszeiten',
  email_mx: 'E-Mail-Server (MX)',
}

function ConfidenceBar({ label, score, color = '#39ff88' }) {
  const finalColor = score >= 70 ? color : score >= 40 ? '#f5a623' : '#ef4444'
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>{label}</span>
        <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: finalColor }}>{score}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ background: finalColor }} />
      </div>
    </div>
  )
}

export default function FactCheckResultPanel({ lead, skipNetwork = false }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(async () => {
    if (!lead) return
    setLoading(true)
    setError('')
    try {
      const r = await runFactCheckAsync(lead, { skipNetwork })
      setResult(r)
    } catch (e) {
      setError(e.message || 'Fehler')
    } finally {
      setLoading(false)
    }
  }, [lead, skipNetwork])

  if (!result && !loading) {
    return (
      <div className="rounded-lg p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} style={{ color: '#9ca3b5' }} />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: '#9ca3b5' }}>
              A6 · Fact Checker
            </span>
          </div>
          <button onClick={run}
            className="px-3 py-1.5 rounded text-[10px] font-semibold"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
            Prüfen starten
          </button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#6b7a90' }}>
          Validiert Telefon, E-Mail, Website, Adresse. Prüft Konflikte und liefert Versandfreigabe.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg p-4 flex items-center justify-center gap-2"
        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <Loader2 size={14} className="animate-spin" style={{ color: '#00d4ff' }} />
        <span className="text-[11px]" style={{ color: '#00d4ff' }}>
          Fact-Check läuft{skipNetwork ? '' : ' (inkl. Netzwerk-Validierung)'}…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg p-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="text-[11px]" style={{ color: '#ef4444' }}>Fact-Check-Fehler: {error}</div>
      </div>
    )
  }

  const verdictColor = result.sendReady ? '#39ff88' : result.factGatePassed ? '#f5a623' : '#ef4444'
  const verdictLabel = result.sendReady ? 'SEND READY' : result.factGatePassed ? 'GATE OK · NEEDS REVIEW' : 'GATE BLOCKED'

  const verifiedKeys = Object.keys(result.verifiedFacts || {})
  const uncertainKeys = Object.keys(result.uncertainFacts || {})

  return (
    <div className="rounded-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${verdictColor}05 0%, rgba(15,20,30,0.6) 100%)`,
        border: `1px solid ${verdictColor}30`,
      }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-2"
        style={{ borderBottom: `1px solid ${verdictColor}20` }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: verdictColor }} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: verdictColor }}>
            A6 · {verdictLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.networkChecked && (
            <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#39ff88' }}>
              ✓ network
            </span>
          )}
          {result.networkCheckFailed && (
            <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#f5a623' }}>
              network: {String(result.networkCheckFailed).slice(0, 20)}
            </span>
          )}
          <button onClick={run}
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: '#6b7a90' }}>
            neu prüfen
          </button>
        </div>
      </div>

      {/* Confidence Bars */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <ConfidenceBar label="Kontakt" score={result.contactConfidence} />
        <ConfidenceBar label="Menü" score={result.menuConfidence} />
        <ConfidenceBar label="Preise" score={result.priceConfidence} />
      </div>

      {/* Verified / Uncertain Grid */}
      <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {verifiedKeys.length > 0 && (
          <div className="rounded p-2.5"
            style={{ background: 'rgba(57,255,136,0.04)', border: '1px solid rgba(57,255,136,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 size={10} style={{ color: '#39ff88' }} />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color: '#39ff88' }}>
                Verifiziert ({verifiedKeys.length})
              </span>
            </div>
            <ul className="space-y-1">
              {verifiedKeys.map(k => {
                const Icon = FIELD_ICONS[k] || CheckCircle2
                return (
                  <li key={k} className="flex items-start gap-1.5 text-[10px]" style={{ color: '#cbd5e1' }}>
                    <Icon size={9} style={{ color: '#39ff88', marginTop: 2 }} className="flex-shrink-0" />
                    <span><strong>{FIELD_LABELS[k] || k}:</strong> {typeof result.verifiedFacts[k] === 'boolean' ? '✓' : String(result.verifiedFacts[k]).slice(0, 40)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {uncertainKeys.length > 0 && (
          <div className="rounded p-2.5"
            style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.18)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={10} style={{ color: '#f5a623' }} />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color: '#f5a623' }}>
                Unsicher ({uncertainKeys.length})
              </span>
            </div>
            <ul className="space-y-1">
              {uncertainKeys.map(k => (
                <li key={k} className="text-[10px]" style={{ color: '#cbd5e1' }}>
                  <strong>{FIELD_LABELS[k] || k}:</strong> {result.uncertainFacts[k].reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Conflicts */}
      {result.conflicts?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded p-2.5"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <XCircle size={10} style={{ color: '#ef4444' }} />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color: '#ef4444' }}>
                Konflikte ({result.conflicts.length})
              </span>
            </div>
            <ul className="space-y-1">
              {result.conflicts.map((c, i) => (
                <li key={i} className="text-[10px]" style={{ color: '#cbd5e1' }}>
                  <strong>{c.field}:</strong> {(c.values || []).map(v => `"${String(v).slice(0, 30)}"`).join(' vs ')}
                  <span className="ml-1.5" style={{ color: '#6b7a90' }}>({(c.sources || []).join(' / ')})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Missing Critical Data */}
      {result.missingCriticalData?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded p-2.5"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-1.5">
              <XCircle size={10} style={{ color: '#ef4444' }} />
              <span className="text-[10px]" style={{ color: '#ef4444' }}>
                <strong>Pflicht fehlt:</strong> {result.missingCriticalData.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Send-Ready Verdict */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <Send size={12} style={{ color: verdictColor }} />
          <span className="text-[10px] font-semibold" style={{ color: verdictColor }}>
            {result.sendReady
              ? 'A4 darf Outreach-Mail versenden'
              : `Versand blockiert${result.blockingReasons?.length ? ': ' + result.blockingReasons[0] : ''}`}
          </span>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>
          factChecker v1
        </span>
      </div>
    </div>
  )
}
