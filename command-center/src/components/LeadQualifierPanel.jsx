// ─── A1 SIGN Panel ────────────────────────────────────────────────
// Zeigt das Resultat von qualifyLead() — Score, Bands, Weaknesses, Opportunities,
// Next-Action und Top-Reasons. Pure client-side Komponente, ohne Webhook.

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, AlertTriangle, Lightbulb, ChevronDown, ChevronUp,
  ArrowRight, Sparkles,
} from 'lucide-react'
import { qualifyLead } from '../lib/leadQualifier'

export default function LeadQualifierPanel({ lead }) {
  const [expanded, setExpanded] = useState(false)

  const result = useMemo(() => {
    if (!lead) return null
    try { return qualifyLead(lead) }
    catch (e) { return { error: e.message } }
  }, [lead])

  if (!result) return null
  if (result.error) {
    return (
      <div className="rounded-lg p-3 mt-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
          <AlertTriangle size={12} /> Qualifier-Fehler: {result.error}
        </div>
      </div>
    )
  }

  const band = result.scoreBand
  const topReasons = [...result.scoreReasons].sort((a, b) => b.impact - a.impact)
  const visibleReasons = expanded ? topReasons : topReasons.slice(0, 4)

  return (
    <div className="rounded-lg mt-3 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${band.color}05 0%, rgba(15,20,30,0.6) 100%)`,
        border: `1px solid ${band.color}30`,
      }}>
      {/* Header — Score + Band */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderBottom: `1px solid ${band.color}20` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 52, height: 52,
              background: `${band.color}12`,
              border: `1px solid ${band.color}40`,
            }}>
            <div className="text-center leading-none">
              <div className="font-mono text-[18px] font-black tabular-nums"
                style={{ color: band.color }}>{result.leadScore}</div>
              <div className="font-mono text-[7px] uppercase tracking-widest"
                style={{ color: `${band.color}aa` }}>SCORE</div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest font-bold"
              style={{ color: band.color }}>
              A1 · {band.label}
            </div>
            <div className="text-[11px] mt-0.5 truncate" style={{ color: '#e8edf4' }}>
              {result.recommendedNextAction}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Sparkles size={11} style={{ color: band.color }} />
          <span className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: `${band.color}cc` }}>{band.action}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        {[
          { label: 'Demo', value: result.demoBuildPotential, suffix: '%' },
          { label: 'Sales', value: result.salesPotential, suffix: '%' },
          { label: 'Daten', value: result.dataConfidence, suffix: '%' },
          { label: 'Quellen', value: result.availableSources.length, suffix: '' },
        ].map(stat => (
          <div key={stat.label} className="rounded p-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="font-mono text-[8px] uppercase tracking-widest"
              style={{ color: '#6b7a90' }}>{stat.label}</div>
            <div className="font-mono text-[14px] font-bold tabular-nums mt-0.5"
              style={{ color: '#e8edf4' }}>{stat.value}{stat.suffix}</div>
          </div>
        ))}
      </div>

      {/* Weaknesses + Opportunities */}
      {(result.weaknesses.length > 0 || result.opportunities.length > 0) && (
        <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.weaknesses.length > 0 && (
            <div className="rounded p-2.5"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle size={10} style={{ color: '#ef4444' }} />
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold"
                  style={{ color: '#ef4444' }}>Schwächen ({result.weaknesses.length})</span>
              </div>
              <ul className="space-y-1">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-[10px] flex items-start gap-1.5" style={{ color: '#cbd5e1' }}>
                    <span style={{ color: '#ef4444' }}>·</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.opportunities.length > 0 && (
            <div className="rounded p-2.5"
              style={{ background: 'rgba(45,219,114,0.04)', border: '1px solid rgba(45,219,114,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={10} style={{ color: '#2ddb72' }} />
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold"
                  style={{ color: '#2ddb72' }}>Chancen ({result.opportunities.length})</span>
              </div>
              <ul className="space-y-1">
                {result.opportunities.map((o, i) => (
                  <li key={i} className="text-[10px] flex items-start gap-1.5" style={{ color: '#cbd5e1' }}>
                    <span style={{ color: '#2ddb72' }}>·</span>{o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top Reasons */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target size={10} style={{ color: '#9ca3b5' }} />
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold"
              style={{ color: '#9ca3b5' }}>Score-Begründungen (sortiert nach Impact)</span>
          </div>
          {topReasons.length > 4 && (
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 font-mono text-[9px]"
              style={{ color: '#6b7a90' }}>
              {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              {expanded ? 'Weniger' : `+${topReasons.length - 4} weitere`}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          <div className="space-y-1.5">
            {visibleReasons.map((r, i) => (
              <motion.div key={r.reason + i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-2 p-2 rounded"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums"
                  style={{
                    background: r.impact >= 6 ? 'rgba(45,219,114,0.15)' : r.impact >= 3 ? 'rgba(245,166,35,0.15)' : 'rgba(239,68,68,0.15)',
                    color: r.impact >= 6 ? '#2ddb72' : r.impact >= 3 ? '#f5a623' : '#ef4444',
                  }}>
                  {r.impact >= 0 ? '+' : ''}{r.impact}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] leading-relaxed" style={{ color: '#cbd5e1' }}>{r.reason}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[8px]" style={{ color: '#6b7a90' }}>
                      gewicht {r.weight} · score {(r.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Footer — Quellen + Next Action chip */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {result.availableSources.length > 0 ? result.availableSources.map(s => (
            <span key={s} className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0,212,255,0.08)',
                color: '#00d4ff',
                border: '1px solid rgba(0,212,255,0.2)',
              }}>{s}</span>
          )) : (
            <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>
              Keine Quellen erkannt
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>
            qualifier v1
          </span>
          <ArrowRight size={10} style={{ color: band.color }} />
        </div>
      </div>
    </div>
  )
}
