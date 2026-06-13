import { useRef, useEffect } from 'react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Brain, ChevronRight, Activity } from 'lucide-react'
import { usePepe } from '../hooks/usePepe'

const EASE  = [0.23, 1, 0.32, 1]
const GOLD  = '#ffd700'
const GOLD2 = '#ffb300'

// Animated number (same pattern as PipelineHealth)
function AnimNum({ value, suffix = '', color }) {
  const spring  = useSpring(0, { stiffness: 90, damping: 20 })
  const display = useTransform(spring, v => Math.round(v).toString())
  const prev    = useRef(0)
  useEffect(() => {
    if (value !== prev.current) { spring.set(value); prev.current = value }
  }, [value, spring])
  return (
    <span style={{ color }}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

export default function PepeCard({ leads = [], executions = [], onOpenControlRoom }) {
  const pepe = usePepe({ leads, executions })

  const healthColor = pepe.systemHealth >= 80 ? '#2ddb72'
    : pepe.systemHealth >= 50 ? '#f5a623' : '#f03a3a'
  const bugsColor   = pepe.criticalBugs.length > 0 ? '#f03a3a' : '#2ddb72'
  const isActive    = pepe.activeAudits > 0 || pepe.criticalBugs.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.42, ease: EASE }}
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,215,0,0.02) 100%)`,
        border: `1px solid rgba(255,215,0,${isActive ? '0.35' : '0.18'})`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'border-color 400ms, box-shadow 400ms',
        boxShadow: isActive ? '0 0 20px rgba(255,215,0,0.08)' : 'none',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
        opacity: isActive ? 1 : 0.4,
        transition: 'opacity 400ms',
      }} />

      {/* Scan line (when active) */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="scan"
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', left: 0, right: 0, height: 1, zIndex: 1, pointerEvents: 'none',
              background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `rgba(255,215,0,0.12)`,
            border: `1px solid rgba(255,215,0,0.3)`,
            boxShadow: isActive ? `0 0 14px rgba(255,215,0,0.2)` : 'none',
            transition: 'box-shadow 400ms',
          }}>
            <Brain size={15} style={{ color: GOLD }} />
          </div>

          {/* Title + badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="font-ui font-bold text-sm" style={{ color: '#fff', letterSpacing: '-0.01em' }}>
                PEPE
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,215,0,0.12)', color: GOLD, border: '1px solid rgba(255,215,0,0.25)', letterSpacing: '0.05em' }}>
                A8
              </span>
            </div>
            <div className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: 'rgba(255,215,0,0.55)' }}>
              COMMAND CAPTAIN
            </div>
          </div>

          {/* Status dot */}
          <motion.div
            animate={isActive ? { opacity: [0.6, 1, 0.6], scale: [1, 1.4, 1] } : { opacity: 0.3 }}
            transition={isActive ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
            style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 3,
              background: isActive ? GOLD : 'rgba(255,255,255,0.15)',
              boxShadow: isActive ? `0 0 8px ${GOLD}88` : 'none',
            }}
          />
        </div>

        {/* Stats grid 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'SYSTEM', value: pepe.systemHealth, suffix: '%', color: healthColor },
            { label: 'HOT LEADS', value: pepe.hotLeads.length, suffix: '', color: GOLD },
            { label: 'BUGS', value: pepe.criticalBugs.length, suffix: '', color: bugsColor },
            { label: 'REVENUE', value: pepe.revenueOpps.length, suffix: '', color: '#e8197f' },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} style={{
              background: `${color}08`,
              border: `1px solid ${color}18`,
              borderRadius: 5, padding: '5px 7px',
            }}>
              <div className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {label}
              </div>
              <div className="font-mono font-bold tabular-nums" style={{ fontSize: 18, lineHeight: 1 }}>
                <AnimNum value={value} suffix={suffix} color={color} />
              </div>
            </div>
          ))}
        </div>

        {/* Last decision */}
        <div style={{
          padding: '7px 9px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 5,
          flex: 1,
        }}>
          <div className="font-mono text-[8px] tracking-widest mb-1" style={{ color: 'rgba(255,215,0,0.4)' }}>
            LAST DECISION
          </div>
          <p className="font-ui text-[11px] leading-relaxed italic" style={{ color: 'var(--text-dim)', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {pepe.lastDecision}
          </p>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={onOpenControlRoom}
          whileHover={{ scale: 1.02, boxShadow: `0 0 24px rgba(255,215,0,0.25)` }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,215,0,0.1)',
            border: `1px solid rgba(255,215,0,0.35)`,
            color: GOLD,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          }}
        >
          <Activity size={10} />
          OPEN CONTROL ROOM
          <ChevronRight size={10} />
        </motion.button>
      </div>
    </motion.div>
  )
}
