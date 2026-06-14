import { motion } from 'framer-motion'
import { gridToScreen, TILE_W, TILE_H } from './useCamera'
import { useTwin } from '../Twin/TwinContext'

const GOLD   = '#ffd700'
const GREEN  = '#2ddb72'
const AMBER  = '#f5a623'
const PURPLE = '#9b6ef3'

function orbColor(status, isSpeaking) {
  if (status === 'connecting')               return AMBER
  if (status === 'connected' && isSpeaking)  return GOLD
  if (status === 'connected')                return GREEN
  return GOLD
}

function statusLabel(status, isSpeaking) {
  if (status === 'connecting')               return 'VERBINDE'
  if (status === 'connected' && isSpeaking)  return 'SPRICHT'
  if (status === 'connected')                return 'HÖRT ZU'
  return 'STANDBY'
}

// Particle positions: 6 particles on two orbital radii
const PARTICLES_OUTER = [0, 60, 120, 180, 240, 300].map((deg, i) => ({ deg, r: TILE_H * 0.82, size: i % 2 === 0 ? 2.2 : 1.6 }))
const PARTICLES_INNER = [30, 90, 150, 210, 270, 330].map((deg, i) => ({ deg, r: TILE_H * 0.62, size: i % 2 === 0 ? 1.8 : 1.2 }))

export default function PepeCommandCore({ pepe, onClick, focused, dimmed }) {
  const { x, y }            = gridToScreen(0, 0)
  const { status, isSpeaking } = useTwin()

  const color      = orbColor(status, isSpeaking)
  const label      = statusLabel(status, isSpeaking)
  const isActive   = status === 'connected'
  const isTalking  = isActive && isSpeaking
  const isListening = isActive && !isSpeaking
  const isConnecting = status === 'connecting'

  // Derived animation speeds
  const ring1Speed  = isTalking ? 8  : isConnecting ? 5  : 20
  const ring2Speed  = isTalking ? 5  : isConnecting ? 3  : 13
  const ring3Speed  = isTalking ? 3  : isConnecting ? 2  : 8
  const pOuter      = isTalking ? 7  : 16
  const pInner      = isTalking ? 4  : isConnecting ? 3 : 11

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      animate={{ opacity: dimmed ? 0.88 : 1 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: dimmed ? 1.03 : 1.05 }}
    >
      {/* Large invisible hit area */}
      <ellipse cx={x} cy={y} rx={TILE_W * 1.1} ry={TILE_H * 1.1} fill="transparent" />

      {/* ═══ AURA LAYERS (multi-ring glow without SVG filters) ═══ */}
      {[
        { r: TILE_H * 1.55, op: 0.025 },
        { r: TILE_H * 1.22, op: 0.045 },
        { r: TILE_H * 0.97, op: 0.07  },
        { r: TILE_H * 0.78, op: 0.10  },
      ].map(({ r, op }, i) => (
        <motion.circle key={`aura-${i}`}
          cx={x} cy={y} r={r}
          fill={color}
          animate={{ opacity: isActive ? [op, op * 2.2, op] : [op * 0.4, op * 0.9, op * 0.4] }}
          transition={{ duration: isTalking ? 0.7 : 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
        />
      ))}

      {/* ═══ GROUND SHADOW (isometric) ═══ */}
      <motion.ellipse
        cx={x} cy={y + TILE_H * 0.68}
        rx={TILE_W * 0.52} ry={TILE_H * 0.24}
        fill="none" stroke={color} strokeWidth="0.8"
        animate={{ opacity: isActive ? [0.2, 0.45, 0.2] : [0.07, 0.18, 0.07] }}
        transition={{ duration: isTalking ? 0.7 : 2.2, repeat: Infinity }}
      />

      {/* ═══ OUTER ORBIT — slow isometric ellipse ═══ */}
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
        animate={{ rotate: -360 }}
        transition={{ duration: ring1Speed, ease: 'linear', repeat: Infinity }}
      >
        <ellipse cx={x} cy={y}
          rx={TILE_W * 0.88} ry={TILE_H * 0.88}
          fill="none" stroke={`${color}18`} strokeWidth="0.7"
          strokeDasharray="4 9 1 9"
        />
      </motion.g>

      {/* ═══ MID ORBIT — circle, tilted group ═══ */}
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration: ring2Speed, ease: 'linear', repeat: Infinity }}
      >
        <circle cx={x} cy={y} r={TILE_H * 0.75}
          fill="none" stroke={`${color}28`} strokeWidth="0.9"
          strokeDasharray="3 6"
        />
      </motion.g>

      {/* ═══ INNER ORBIT ═══ */}
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
        animate={{ rotate: -360 }}
        transition={{ duration: ring3Speed, ease: 'linear', repeat: Infinity }}
      >
        <circle cx={x} cy={y} r={TILE_H * 0.6}
          fill="none" stroke={`${color}40`} strokeWidth="1"
          strokeDasharray="2 4"
        />
      </motion.g>

      {/* ═══ ANIMATED DATA ARC (dashoffset scroll) ═══ */}
      <motion.circle cx={x} cy={y} r={TILE_H * 0.68}
        fill="none" stroke={`${color}30`} strokeWidth="1.5"
        strokeDasharray={`${TILE_H * 0.5} ${TILE_H * 4}`}
        animate={{ strokeDashoffset: [0, -(TILE_H * 4.5)] }}
        transition={{ duration: isTalking ? 1.2 : 3, ease: 'linear', repeat: Infinity }}
      />
      <motion.circle cx={x} cy={y} r={TILE_H * 0.52}
        fill="none" stroke={`${PURPLE}35`} strokeWidth="1"
        strokeDasharray={`${TILE_H * 0.35} ${TILE_H * 3}`}
        animate={{ strokeDashoffset: [0, (TILE_H * 3.35)] }}
        transition={{ duration: isTalking ? 0.9 : 2.2, ease: 'linear', repeat: Infinity }}
      />

      {/* ═══ OUTER PARTICLES (6, rotating group) ═══ */}
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration: pOuter, ease: 'linear', repeat: Infinity }}
      >
        {PARTICLES_OUTER.map(({ deg, r, size }, i) => {
          const rad = (deg * Math.PI) / 180
          const px = x + Math.cos(rad) * r
          const py = y + Math.sin(rad) * r * 0.45 // flatten for isometric
          return (
            <motion.circle key={i} cx={px} cy={py} r={size}
              fill={i % 3 === 0 ? color : i % 3 === 1 ? PURPLE : `${color}88`}
              animate={{ opacity: [0.4, 1, 0.4], r: [size, size * 1.4, size] }}
              transition={{ duration: 1.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}
      </motion.g>

      {/* ═══ INNER PARTICLES (6, counter-rotate) ═══ */}
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
        animate={{ rotate: -360 }}
        transition={{ duration: pInner, ease: 'linear', repeat: Infinity }}
      >
        {PARTICLES_INNER.map(({ deg, r, size }, i) => {
          const rad = (deg * Math.PI) / 180
          const px = x + Math.cos(rad) * r
          const py = y + Math.sin(rad) * r * 0.45
          return (
            <motion.circle key={i} cx={px} cy={py} r={size}
              fill={i % 2 === 0 ? `${color}cc` : `${PURPLE}aa`}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.2 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
            />
          )
        })}
      </motion.g>

      {/* ═══ BURST RINGS (when speaking) ═══ */}
      {isTalking && [0, 1, 2, 3].map(i => (
        <motion.circle key={`burst-${i}`}
          cx={x} cy={y} r={TILE_H * 0.55}
          fill="none" stroke={GOLD} strokeWidth="0.8"
          animate={{ r: [TILE_H * 0.55, TILE_H * 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: 'easeOut', delay: i * 0.25 }}
        />
      ))}

      {/* ═══ LISTEN PULSE RINGS ═══ */}
      {isListening && [0, 1, 2].map(i => (
        <motion.circle key={`pulse-${i}`}
          cx={x} cy={y} r={TILE_H * 0.55}
          fill="none" stroke={GREEN} strokeWidth="0.6"
          animate={{ r: [TILE_H * 0.55, TILE_H * 1.2], opacity: [0.4, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut', delay: i * 0.63 }}
        />
      ))}

      {/* ═══ CONNECTING SPINNER ═══ */}
      {isConnecting && (
        <motion.g style={{ transformOrigin: `${x}px ${y}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, ease: 'linear', repeat: Infinity }}
        >
          <circle cx={x} cy={y} r={TILE_H * 0.72}
            fill="none" stroke={AMBER} strokeWidth="2"
            strokeDasharray={`${TILE_H * 0.5} ${TILE_H * 4}`}
          />
        </motion.g>
      )}

      {/* ═══ ORB BODY ═══ */}

      {/* Body fill */}
      <circle cx={x} cy={y} r={TILE_H * 0.5}
        fill="rgba(6,5,18,0.92)"
      />

      {/* Body border — pulsing */}
      <motion.circle cx={x} cy={y} r={TILE_H * 0.5}
        fill="none"
        animate={{ stroke: isActive
          ? [`${color}44`, `${color}99`, `${color}44`]
          : [`${GOLD}1a`, `${GOLD}40`, `${GOLD}1a`],
          strokeWidth: isTalking ? [1.2, 2.2, 1.2] : [1, 1.5, 1],
        }}
        transition={{ duration: isTalking ? 0.6 : 2.0, repeat: Infinity }}
      />

      {/* Body inner glow — offset like a light source */}
      <motion.circle
        cx={x - TILE_H * 0.14} cy={y - TILE_H * 0.16}
        r={TILE_H * 0.28}
        fill={color}
        animate={{ opacity: isActive ? [0.06, 0.18, 0.06] : [0.03, 0.08, 0.03] }}
        transition={{ duration: isTalking ? 0.7 : 2.2, repeat: Infinity }}
      />

      {/* Specular highlight (top-left) */}
      <motion.circle
        cx={x - TILE_H * 0.2} cy={y - TILE_H * 0.22}
        r={TILE_H * 0.14}
        fill="white"
        animate={{ opacity: isActive ? [0.04, 0.1, 0.04] : [0.02, 0.05, 0.02] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />

      {/* Center core dot */}
      <motion.circle cx={x} cy={y} r={4}
        fill={isActive ? color : `${GOLD}66`}
        animate={{
          r: isTalking ? [4, 7, 4] : isListening ? [4, 5.5, 4] : [3.5, 4.5, 3.5],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: isTalking ? 0.48 : 1.4, repeat: Infinity }}
      />

      {/* ═══ LABEL ═══ */}
      <g transform={`translate(${x}, ${y - TILE_H * 1.12})`}>
        <rect x="-40" y="-11" width="80" height="20" rx="5"
          fill="rgba(5,4,16,0.95)"
          stroke={`${GOLD}38`}
          strokeWidth="0.8"
        />
        <text x="0" y="3.5" textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9" fontWeight="800"
          fill={GOLD} letterSpacing="1.4">
          TWIN PEPE
        </text>
      </g>

      {/* Status */}
      <motion.g transform={`translate(${x}, ${y - TILE_H * 0.84})`}
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: isTalking ? 0.7 : 1.8, repeat: Infinity }}
      >
        <text x="0" y="0" textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="6.5" fontWeight="700"
          fill={isActive ? color : `${GOLD}44`}
          letterSpacing="1">
          {label}
        </text>
      </motion.g>

      {/* Health */}
      {pepe?.systemHealth > 0 && (
        <g transform={`translate(${x}, ${y + TILE_H * 0.96})`}>
          <rect x="-26" y="-8" width="52" height="14" rx="3"
            fill={`${GOLD}07`} stroke={`${GOLD}1a`} strokeWidth="0.5"
          />
          <text x="0" y="2.5" textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7" fontWeight="700"
            fill={`${GOLD}77`}>
            {pepe.systemHealth}% SYS
          </text>
        </g>
      )}

      {/* Focus ring */}
      {focused && (
        <motion.ellipse
          cx={x} cy={y + TILE_H * 0.68}
          rx={TILE_W * 0.62} ry={TILE_H * 0.33}
          fill="none" stroke={GOLD} strokeWidth="1.2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
    </motion.g>
  )
}
