import { motion } from 'framer-motion'
import { Mic, MicOff, Power } from 'lucide-react'
import { useTwin } from './TwinContext'

const GOLD = '#ffd700'
const GREEN = '#2ddb72'

function getStateLabel(status, isSpeaking) {
  if (status === 'connecting') return 'VERBINDE'
  if (status === 'connected' && isSpeaking) return 'SPRICHT'
  if (status === 'connected') return 'HÖRT ZU'
  return 'OFFLINE'
}

function getStateColor(status, isSpeaking) {
  if (status === 'connecting') return '#f5a623'
  if (status === 'connected' && isSpeaking) return GOLD
  if (status === 'connected') return GREEN
  return `${GOLD}33`
}

export default function TwinCore() {
  const { status, isSpeaking, hasError, start, stop } = useTwin()
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const stateColor = hasError ? '#f03a3a' : getStateColor(status, isSpeaking)
  const stateLabel = hasError ? 'FEHLER' : getStateLabel(status, isSpeaking)

  const orbSize = 240
  const cx = orbSize / 2

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 28,
      padding: '40px 32px',
      position: 'relative',
    }}>
      {/* SVG Ring system */}
      <div style={{ position: 'relative', width: orbSize, height: orbSize }}>
        <svg width={orbSize} height={orbSize} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Outer counter-rotating ring */}
          <motion.g style={{ transformOrigin: `${cx}px ${cx}px` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
          >
            <circle cx={cx} cy={cx} r={cx - 8} fill="none"
              stroke={`${GOLD}14`} strokeWidth="1"
              strokeDasharray="4 8 2 8" />
          </motion.g>

          {/* Middle rotating ring */}
          <motion.g style={{ transformOrigin: `${cx}px ${cx}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: isConnected && isSpeaking ? 8 : 18, ease: 'linear', repeat: Infinity }}
          >
            <circle cx={cx} cy={cx} r={cx - 22} fill="none"
              stroke={`${stateColor}30`} strokeWidth="1.2"
              strokeDasharray="3 5 6 5" />
          </motion.g>

          {/* Inner ring — faster when speaking */}
          <motion.g style={{ transformOrigin: `${cx}px ${cx}px` }}
            animate={{ rotate: -360 }}
            transition={{ duration: isConnected && isSpeaking ? 4 : 10, ease: 'linear', repeat: Infinity }}
          >
            <circle cx={cx} cy={cx} r={cx - 42} fill="none"
              stroke={`${stateColor}44`} strokeWidth="1"
              strokeDasharray="2 4" />
          </motion.g>

          {/* Burst rings when speaking */}
          {isConnected && isSpeaking && [0, 1, 2].map(i => (
            <motion.circle key={i}
              cx={cx} cy={cx} r={cx - 55}
              fill="none" stroke={GOLD} strokeWidth="0.8"
              animate={{ r: [cx - 55, cx + 20], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
            />
          ))}

          {/* Pulse rings when listening */}
          {isConnected && !isSpeaking && [0, 1].map(i => (
            <motion.circle key={i}
              cx={cx} cy={cx} r={cx - 55}
              fill="none" stroke={GREEN} strokeWidth="0.7"
              animate={{ r: [cx - 55, cx - 10], opacity: [0.4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }}
            />
          ))}
        </svg>

        {/* Orb body */}
        <motion.div style={{
          position: 'absolute',
          top: 42, left: 42,
          width: orbSize - 84, height: orbSize - 84,
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 35%, ${isConnected ? (isSpeaking ? `${GOLD}18` : `${GREEN}14`) : `${GOLD}08`} 0%, rgba(6,6,16,0.96) 65%)`,
          border: `1.5px solid ${stateColor}44`,
          boxShadow: `0 0 40px ${stateColor}20, inset 0 0 24px ${stateColor}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        animate={{
          boxShadow: isConnected
            ? [`0 0 30px ${stateColor}18, inset 0 0 18px ${stateColor}08`, `0 0 55px ${stateColor}35, inset 0 0 30px ${stateColor}18`, `0 0 30px ${stateColor}18, inset 0 0 18px ${stateColor}08`]
            : [`0 0 18px ${GOLD}10, inset 0 0 10px ${GOLD}05`, `0 0 26px ${GOLD}18, inset 0 0 14px ${GOLD}0a`, `0 0 18px ${GOLD}10, inset 0 0 10px ${GOLD}05`],
        }}
        transition={{ duration: isSpeaking ? 0.7 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Center icon */}
          <motion.div
            animate={{ scale: isSpeaking ? [1, 1.2, 1] : 1, opacity: isConnecting ? [0.4, 1, 0.4] : 1 }}
            transition={{ duration: isSpeaking ? 0.5 : (isConnecting ? 0.9 : 0), repeat: (isSpeaking || isConnecting) ? Infinity : 0 }}
          >
            {isConnected
              ? <Mic size={32} color={stateColor} strokeWidth={1.5} />
              : <MicOff size={32} color={`${GOLD}44`} strokeWidth={1.5} />
            }
          </motion.div>
        </motion.div>

        {/* Connecting spinner arc */}
        {isConnecting && (
          <div style={{ position: 'absolute', top: 42, left: 42, width: orbSize - 84, height: orbSize - 84 }}>
            <motion.div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: '2px solid transparent', borderTopColor: GOLD,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, ease: 'linear', repeat: Infinity }}
            />
          </div>
        )}
      </div>

      {/* State label */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
          color: stateColor,
        }}>
          {stateLabel}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8, fontWeight: 600, letterSpacing: '0.18em',
          color: `${GOLD}44`,
        }}>
          TWIN · PDSTUDIO AI
        </span>
      </div>

      {/* Start / Stop button */}
      <motion.button
        onClick={isConnected ? stop : start}
        disabled={isConnecting}
        whileHover={isConnecting ? {} : { scale: 1.03 }}
        whileTap={isConnecting ? {} : { scale: 0.96 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '0 18px', height: 34,
          borderRadius: 6,
          background: isConnected
            ? 'rgba(240,58,58,0.08)'
            : `rgba(255,215,0,0.07)`,
          border: `1px solid ${isConnected ? 'rgba(240,58,58,0.3)' : `${GOLD}33`}`,
          color: isConnected ? '#f03a3a' : GOLD,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          cursor: isConnecting ? 'wait' : 'pointer',
          opacity: isConnecting ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        <Power size={12} />
        {isConnected ? 'TRENNEN' : (isConnecting ? 'VERBINDET…' : 'STARTEN')}
      </motion.button>
    </div>
  )
}
