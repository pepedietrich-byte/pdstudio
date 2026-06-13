import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { getLeadStage } from '../lib/sheets'
import { getAllLeadResults } from '../hooks/useLeadResults'
import { SCORE_THRESHOLD } from '../lib/status'

const EASE = [0.23, 1, 0.32, 1]

function AnimNum({ value, color, size = 26 }) {
  const spring  = useSpring(0, { stiffness: 90, damping: 20 })
  const display = useTransform(spring, v => Math.round(v).toString())
  const prev    = useRef(0)
  useEffect(() => {
    if (value !== prev.current) { spring.set(value); prev.current = value }
  }, [value, spring])
  return (
    <motion.span style={{ color, fontSize: size, fontFamily: 'var(--font-mono,monospace)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  )
}

function KPITile({ label, sub, value, color, suffix = '' }) {
  const active = (+value || 0) > 0
  return (
    <motion.div
      className="relative flex flex-col gap-2 px-3 pt-3 pb-3 overflow-hidden"
      style={{
        background: active ? `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)` : 'var(--bg-panel)',
        border: `1px solid ${active ? `${color}28` : 'var(--border)'}`,
        borderRadius: 8,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <div className="absolute top-2 right-2 font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
        style={{
          background: active ? `${color}15` : 'rgba(255,255,255,0.04)',
          color: active ? color : 'rgba(255,255,255,0.18)',
          border: `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
        }}>
        {sub}
      </div>
      <div className="font-mono font-bold tabular-nums leading-none" style={{ fontSize: '2rem' }}>
        <AnimNum value={+value || 0} color={active ? color : 'rgba(255,255,255,0.15)'} />
        {suffix && active && (
          <span style={{ color: `${color}80`, fontSize: '0.75rem', marginLeft: 2 }}>{suffix}</span>
        )}
      </div>
      <div className="font-mono text-[10px] font-semibold tracking-wide"
        style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--text-dim)' }}>
        {label}
      </div>
      {active && (
        <motion.div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }} />
      )}
    </motion.div>
  )
}

export default function CommandKPIs({ leads = [] }) {
  // Active leads (score >= 50, not archived)
  const archived     = (() => { try { return new Set(JSON.parse(localStorage.getItem('pdstudio_archived_leads_v1') || '[]')) } catch { return new Set() } })()
  const activeLeads  = leads.filter(l => !archived.has(l.lead_id) && (+l.score || 0) >= SCORE_THRESHOLD.ACTIVE)
  const hotLeads     = activeLeads.filter(l => (+l.score || 0) >= SCORE_THRESHOLD.HOT)
  const archivedCount= leads.filter(l => archived.has(l.lead_id)).length

  const deployed     = leads.filter(l => { const u = l.build?.demo_url || ''; return u && /^https?:\/\//.test(u) && !u.startsWith('/files') })
  const avgScore     = activeLeads.length ? Math.round(activeLeads.reduce((s, l) => s + (+l.score || 0), 0) / activeLeads.length) : 0

  // Read A5 pricing results from localStorage
  const allResults = getAllLeadResults()
  const pricedLeads = activeLeads.filter(l => l.lead_id && allResults[l.lead_id]?.a5Result)
  const totalPipelineValue = pricedLeads.reduce((sum, l) => {
    const r = allResults[l.lead_id]?.a5Result
    return sum + (+r?.price_recommended || 0)
  }, 0)

  // A4 texts ready count
  const textsReady = activeLeads.filter(l => l.lead_id && allResults[l.lead_id]?.a4Texts).length

  // A6 fact check: ready_to_send
  const readyToSend = activeLeads.filter(l => l.lead_id && allResults[l.lead_id]?.a6Result?.send_status === 'ready_to_send').length

  const tiles = [
    { label: 'Aktive Leads',   sub: `≥${SCORE_THRESHOLD.ACTIVE}`,  value: activeLeads.length,    color: '#00d4ff' },
    { label: 'Hot Leads',      sub: `≥${SCORE_THRESHOLD.HOT}`,     value: hotLeads.length,        color: '#2ddb72' },
    { label: 'Ø Score',        sub: 'aktiv',                        value: avgScore,               color: '#9b6ef3' },
    { label: 'Sites Live',     sub: 'deployed',                     value: deployed.length,        color: '#e8197f' },
    { label: 'Texte fertig',   sub: 'A4 ready',                     value: textsReady,             color: '#f5a623' },
    { label: 'Bereit',         sub: 'ready_send',                   value: readyToSend,            color: '#2ddb72' },
    { label: 'Archiviert',     sub: '<50',                          value: archivedCount,          color: 'rgba(255,255,255,0.25)' },
    { label: 'Pipeline-Wert',  sub: 'A5 est.',                      value: Math.round(totalPipelineValue / 100) * 100, color: '#f5a623', suffix: '€' },
  ]

  return (
    <div className="mb-6">
      <div className="font-mono text-[9px] tracking-widest mb-3 flex items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        <span style={{ color: 'rgba(0,212,255,0.5)' }}>◈</span>
        PDSTUDIO // COMMAND CENTER KPIs
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {tiles.map((t, i) => (
          <KPITile key={t.label} {...t} />
        ))}
      </div>
    </div>
  )
}
