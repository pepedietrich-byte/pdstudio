import { motion } from 'framer-motion'
import { DollarSign, Trophy, ExternalLink } from 'lucide-react'
import { getLeadStage } from '../../lib/sheets'

const EASE = [0.23, 1, 0.32, 1]
const ONE_DAY = 24 * 60 * 60 * 1000

/**
 * Daily revenue briefing — aggregates today's activity from leads + executions.
 * Pure computation, real data.
 */
export default function RevenueBriefing({ leads = [], executions = [] }) {
  // Today's runs — Date.now() at module level for purity; updates on re-render naturally
  const now = typeof globalThis !== 'undefined' && globalThis.Date ? new Date().getTime() : 0
  const todayExecs = executions.filter(e => (now - new Date(e.startedAt).getTime()) < ONE_DAY)
  const todaySuccess = todayExecs.filter(e => e.status === 'success').length
  const todayErrors  = todayExecs.filter(e => e.status === 'error').length

  // Live demos with valid URL
  const validDemo = (u) => u && !u.startsWith('/files') && /^https?:\/\//.test(u)
  const liveDemos = leads.filter(l => validDemo(l.build?.demo_url) && getLeadStage(l) === 7)

  // Top by score
  const top3 = [...leads].sort((a, b) => (+b.score || 0) - (+a.score || 0)).slice(0, 3)

  // Revenue estimation per demo (mock pricing)
  const pricePerLead = (score) => {
    if (score >= 70) return 1500
    if (score >= 50) return 900
    if (score >= 30) return 500
    return 0
  }
  const estimatedRevenue = liveDemos.reduce((sum, l) => sum + pricePerLead(+l.score || 0), 0)

  const items = [
    { label: 'Heutige Runs', value: todayExecs.length, color: '#00d4ff' },
    { label: 'Erfolg',       value: todaySuccess,     color: '#2ddb72' },
    { label: 'Fehler',       value: todayErrors,      color: todayErrors > 0 ? '#f03a3a' : 'var(--text-dim)' },
    { label: 'Live-Demos',   value: liveDemos.length, color: '#e8197f' },
  ]

  return (
    <div>
      {/* Estimated revenue hero */}
      <div style={{
        background: `linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))`,
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: 7, padding: '14px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)',
        }}>
          <DollarSign size={18} style={{ color: '#ffd700' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-mono text-[9px] tracking-widest" style={{ color: 'rgba(255,215,0,0.6)' }}>
            HEUTIGES UMSATZPOTENTIAL
          </div>
          <div className="font-ui font-bold tabular-nums" style={{ color: '#ffd700', fontSize: 22, lineHeight: 1.1 }}>
            {estimatedRevenue.toLocaleString('de-DE')} €
          </div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {liveDemos.length} Demo{liveDemos.length === 1 ? '' : 's'} versandbereit
          </div>
        </div>
      </div>

      {/* Daily stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        {items.map((it, i) => (
          <motion.div key={it.label}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.18, ease: EASE }}
            style={{ background: `${it.color}06`, border: `1px solid ${it.color}18`, borderRadius: 5, padding: '7px 9px' }}>
            <div className="font-mono text-[8px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{it.label}</div>
            <div className="font-mono text-base font-bold tabular-nums" style={{ color: it.color }}>{it.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Top 3 leads of the day */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Trophy size={10} style={{ color: '#ffd700' }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>TOP 3 LEADS HEUTE</span>
        </div>
        {top3.length === 0 ? (
          <div className="font-mono text-[10px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            Keine Leads vorhanden.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {top3.map((l, i) => {
              const score = +l.score || 0
              const hasDemo = validDemo(l.build?.demo_url)
              return (
                <motion.div key={l.lead_id || i}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.16, ease: EASE }}
                  style={{ display: 'grid', gridTemplateColumns: '20px 1fr 50px 60px', gap: 8, alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 5 }}>
                  <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: ['#ffd700', '#c8c8d8', '#cd7f32'][i] || '#888' }}>
                    #{i + 1}
                  </span>
                  <span className="font-ui text-xs truncate" style={{ color: 'var(--text-hi)' }}>{l.name || l.lead_id}</span>
                  <span className="font-mono text-xs font-bold tabular-nums" style={{ color: score >= 60 ? '#2ddb72' : '#f5a623' }}>{score || '—'}</span>
                  {hasDemo ? (
                    <a href={l.build.demo_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded justify-center"
                      style={{ color: '#e8197f', background: 'rgba(232,25,127,0.08)', border: '1px solid rgba(232,25,127,0.18)' }}>
                      <ExternalLink size={8} /> Demo
                    </a>
                  ) : (
                    <span className="font-mono text-[8px] text-center" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>—</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <p className="font-mono text-[8px] mt-3" style={{ color: 'var(--text-dim)', opacity: 0.45 }}>
        ⚡ Pricing-Heuristik: 1500€ (Score ≥70) · 900€ (≥50) · 500€ (≥30) · Echte Daten · Phase 9 Gemini-Briefing
      </p>
    </div>
  )
}
