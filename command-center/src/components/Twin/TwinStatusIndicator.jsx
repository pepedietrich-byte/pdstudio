import { motion } from 'framer-motion'
import { useTwin } from './TwinContext'

const GOLD = '#ffd700'

const STATE = {
  offline:    { dot: `${GOLD}33`, label: 'OFFLINE', text: `${GOLD}44` },
  connecting: { dot: '#f5a623',   label: 'VERBINDE', text: '#f5a623bb' },
  listening:  { dot: '#2ddb72',   label: 'HÖRT ZU',  text: '#2ddb72bb' },
  speaking:   { dot: GOLD,        label: 'SPRICHT',   text: `${GOLD}dd` },
  error:      { dot: '#f03a3a',   label: 'FEHLER',    text: '#f03a3abb' },
}

function getState(status, isSpeaking, hasError) {
  if (hasError) return 'error'
  if (status === 'connecting') return 'connecting'
  if (status === 'connected' && isSpeaking) return 'speaking'
  if (status === 'connected') return 'listening'
  return 'offline'
}

export default function TwinStatusIndicator() {
  const { status, isSpeaking, hasError, setIsOpen } = useTwin()
  const stateKey = getState(status, isSpeaking, hasError)
  const cfg = STATE[stateKey]
  const isActive = status === 'connected'

  return (
    <button
      onClick={() => setIsOpen(true)}
      title="TWIN öffnen"
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        height: 26, padding: '0 8px',
        borderRadius: 5,
        background: 'transparent',
        border: `1px solid ${isActive ? `${GOLD}18` : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${GOLD}06`
        e.currentTarget.style.borderColor = `${GOLD}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = isActive ? `${GOLD}18` : 'transparent'
      }}
    >
      {/* Status dot */}
      <motion.div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
      }}
      animate={isActive
        ? { opacity: [0.5, 1, 0.5], boxShadow: [`0 0 4px ${cfg.dot}`, `0 0 8px ${cfg.dot}`, `0 0 4px ${cfg.dot}`] }
        : { opacity: 1 }
      }
      transition={isActive ? { duration: stateKey === 'speaking' ? 0.6 : 1.5, repeat: Infinity } : {}}
      />

      {/* Label */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
        color: cfg.text,
        userSelect: 'none',
      }}>
        TWIN
      </span>

      {/* State sub-label (only when active) */}
      {isActive && (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 7, letterSpacing: '0.08em',
          color: 'var(--text-dim)',
          userSelect: 'none',
        }}>
          · {cfg.label}
        </span>
      )}
    </button>
  )
}
