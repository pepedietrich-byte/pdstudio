import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { getLeadStage } from '../lib/sheets'

const EASE = [0.23, 1, 0.32, 1]

function AnimatedNumber({ value, color }) {
  const spring  = useSpring(0, { stiffness: 100, damping: 22 })
  const display = useTransform(spring, v => Math.round(v).toString())
  const prev    = useRef(0)

  useEffect(() => {
    if (value !== prev.current) {
      spring.set(value)
      prev.current = value
    }
  }, [value, spring])

  return <motion.span style={{ color }}>{display}</motion.span>
}

export default function PipelineHealth({ leads = [] }) {
  const total     = leads.length
  const atStage   = n => leads.filter(l => getLeadStage(l) === n).length
  const minStage  = n => leads.filter(l => getLeadStage(l) >= n).length
  const hotLeads  = leads.filter(l => (+l.score || 0) >= 75).length
  const goodLeads = leads.filter(l => (+l.score || 0) >= 50).length

  const stats = [
    { label: 'Qualifiziert', note: 'Score ≥ 50', value: goodLeads,   color: '#00d4ff', station: 'A1' },
    { label: 'Hot Leads',    note: 'Score ≥ 75', value: hotLeads,    color: '#2ddb72', station: 'HOT' },
    { label: 'Content',      note: 'Text+',      value: minStage(2), color: '#e8197f', station: 'A2' },
    { label: 'Bilder',       note: 'Img+',       value: minStage(3), color: '#f5a623', station: 'A3' },
    { label: 'Gebaut',       note: 'A2 Deploy',  value: atStage(7),  color: '#9b6ef3', station: 'LIVE' },
    { label: 'Gesamt',       note: 'alle leads', value: total,       color: 'rgba(255,255,255,0.3)', station: '∑' },
  ]

  return (
    <div className="mb-6">
      {/* Section label */}
      <div
        className="font-mono text-[9px] tracking-widest mb-3 flex items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <span style={{ color: 'rgba(0,212,255,0.5)' }}>◈</span>
        PDSTUDIO // PIPELINE HEALTH
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {stats.map((stat, i) => {
          const active = stat.value > 0
          return (
            <motion.div
              key={stat.label}
              className="flex flex-col gap-1 px-3 pt-3 pb-3 relative overflow-hidden"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${stat.color}08 0%, ${stat.color}03 100%)`
                  : 'var(--bg-panel)',
                border: `1px solid ${active ? `${stat.color}28` : 'var(--border)'}`,
                borderRadius: 8,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.22, ease: EASE }}
            >
              {/* Station badge top-right */}
              <div
                className="absolute top-2 right-2 font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: active ? `${stat.color}15` : 'rgba(255,255,255,0.04)',
                  color: active ? stat.color : 'rgba(255,255,255,0.18)',
                  border: `1px solid ${active ? `${stat.color}30` : 'rgba(255,255,255,0.08)'}`,
                  letterSpacing: '0.06em',
                }}
              >
                {stat.station}
              </div>

              {/* Large number */}
              <div
                className="font-mono font-bold tabular-nums leading-none"
                style={{ fontSize: '2rem' }}
              >
                <AnimatedNumber
                  value={stat.value}
                  color={active ? stat.color : 'rgba(255,255,255,0.15)'}
                />
              </div>

              {/* Label */}
              <div
                className="font-mono text-[10px] font-semibold tracking-wide"
                style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--text-dim)' }}
              >
                {stat.label}
              </div>

              {/* Note */}
              <div
                className="font-mono text-[9px] tracking-widest"
                style={{ color: active ? `${stat.color}70` : 'rgba(255,255,255,0.12)' }}
              >
                {stat.note}
              </div>

              {/* Bottom glow line */}
              {active && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}50, transparent)` }}
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
