import { motion } from 'framer-motion'
import { gridToScreen, TILE_W, TILE_H } from './useCamera'

/**
 * Visual zone showing the top 5 hottest leads as pulsing dots on a perimeter arc.
 * Renders inside the SVG scene, just outside PEPE Core.
 */
export default function HotLeadRadar({ leads = [] }) {
  const top = [...leads]
    .sort((a, b) => (+b.score || 0) - (+a.score || 0))
    .slice(0, 5)
    .filter(l => (+l.score || 0) > 0)

  if (top.length === 0) return null

  // PEPE is at (0,0) → distribute the 5 dots on a small arc around it
  const center = gridToScreen(0, 0)
  const radius = TILE_W * 0.7

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Faint ring */}
      <motion.ellipse
        cx={center.x} cy={center.y}
        rx={radius} ry={radius / 2}
        fill="none"
        stroke="rgba(255,215,0,0.10)"
        strokeWidth="0.6"
        strokeDasharray="4 6"
        animate={{ rotate: 360 }}
        style={{ transformOrigin: `${center.x}px ${center.y}px` }}
        transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
      />

      {/* Hot lead dots */}
      {top.map((l, i) => {
        const angle = (-Math.PI / 2) + (i / top.length) * Math.PI * 2 + Math.PI * 0.15
        const cx = center.x + Math.cos(angle) * radius
        const cy = center.y + Math.sin(angle) * radius / 2  // squish for iso
        const score = +l.score || 0
        const color = score >= 60 ? '#ffd700' : '#9b6ef3'
        const size  = score >= 60 ? 4 : 3
        return (
          <g key={l.lead_id || i}>
            <motion.circle
              cx={cx} cy={cy} r={size + 2}
              fill={color}
              opacity={0.25}
              animate={{ r: [size + 2, size + 5, size + 2], opacity: [0.25, 0.05, 0.25] }}
              transition={{ duration: 2 + (i * 0.15), repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx={cx} cy={cy} r={size} fill={color} />
            {/* Score label */}
            <text x={cx + size + 3} y={cy + 3}
              fontFamily="JetBrains Mono, monospace" fontSize="7" fontWeight="700"
              fill={color}>
              {score}
            </text>
          </g>
        )
      })}

      {/* Center label */}
      <text x={center.x} y={center.y - TILE_H * 1.4} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace" fontSize="6.5"
        fill="rgba(255,215,0,0.5)" letterSpacing="1">
        HOT LEAD RADAR
      </text>
    </g>
  )
}
