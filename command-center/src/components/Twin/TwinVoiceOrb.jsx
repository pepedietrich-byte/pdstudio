import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useTwin } from './TwinContext'

const GOLD = '#ffd700'

const STATE_CFG = {
  idle:       { border: `${GOLD}22`, glow: `${GOLD}08`, icon: `${GOLD}55`, label: 'TWIN',       dot: `${GOLD}44` },
  connecting: { border: `${GOLD}55`, glow: `${GOLD}20`, icon: `${GOLD}99`, label: 'VERBINDE…',  dot: '#f5a623' },
  listening:  { border: '#2ddb7277', glow: '#2ddb7218', icon: '#2ddb72',   label: 'HÖRT ZU',    dot: '#2ddb72' },
  speaking:   { border: `${GOLD}99`, glow: `${GOLD}28`, icon: GOLD,        label: 'SPRICHT',    dot: GOLD },
  error:      { border: '#f03a3a77', glow: '#f03a3a14', icon: '#f03a3a',   label: 'FEHLER',     dot: '#f03a3a' },
}

function resolveState(status, isSpeaking, hasError) {
  if (hasError) return 'error'
  if (status === 'connecting') return 'connecting'
  if (status === 'connected' && isSpeaking) return 'speaking'
  if (status === 'connected') return 'listening'
  return 'idle'
}

export default function TwinVoiceOrb() {
  const { status, isSpeaking, hasError, start, stop, setIsOpen } = useTwin()
  const stateKey = resolveState(status, isSpeaking, hasError)
  const cfg = STATE_CFG[stateKey]
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  async function handleClick() {
    if (isConnected) {
      setIsOpen(true)
      return
    }
    if (isConnecting) return
    await start()
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', pointerEvents: 'all' }}>
        {/* Pulse rings when active */}
        {isConnected && [0, 1].map(i => (
          <motion.div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1px solid ${cfg.dot}`,
          }}
          animate={{ scale: [1, 1.6 + i * 0.4], opacity: [0.3, 0] }}
          transition={{ duration: isSpeaking ? 0.85 : 1.7, repeat: Infinity, ease: 'easeOut', delay: i * 0.28 }}
          />
        ))}

        {/* Orb body */}
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `radial-gradient(circle at 38% 35%, rgba(255,215,0,0.07) 0%, rgba(6,6,16,0.96) 68%)`,
            border: `1.5px solid ${cfg.border}`,
            boxShadow: `0 0 22px ${cfg.glow}, inset 0 0 14px ${cfg.glow}`,
            cursor: isConnecting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(18px)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${GOLD}10 0%, transparent 60%)`,
          }}
          animate={{ opacity: isConnected ? [0.5, 1, 0.5] : [0.15, 0.35, 0.15] }}
          transition={{ duration: isSpeaking ? 0.65 : (isConnected ? 1.3 : 2.6), repeat: Infinity }}
          />

          {/* Connecting spinner */}
          {isConnecting && (
            <motion.div style={{
              position: 'absolute', inset: 5, borderRadius: '50%',
              border: '1.5px solid transparent', borderTopColor: GOLD,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, ease: 'linear', repeat: Infinity }}
            />
          )}

          {/* Icon */}
          <motion.div
            animate={{ scale: isSpeaking ? [1, 1.18, 1] : 1 }}
            transition={{ duration: 0.48, repeat: isSpeaking ? Infinity : 0 }}
          >
            {isConnected
              ? <Mic size={18} color={cfg.icon} />
              : <MicOff size={18} color={cfg.icon} />
            }
          </motion.div>
        </motion.button>
      </div>

      {/* Label */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
        color: cfg.dot, opacity: 0.8,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {cfg.label}
      </span>
    </div>
  )
}
