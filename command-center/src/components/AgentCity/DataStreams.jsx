import { motion } from 'framer-motion'
import { gridToScreen, AGENT_POSITIONS } from './useCamera'

/**
 * Subtle particle/connector overlay between PEPE Core and each agent station.
 * Pure SVG, low-cost: 7 lines + animated dashes.
 */
export default function DataStreams({ selectedAgent }) {
  const center = gridToScreen(0, 0)
  const links = Object.entries(AGENT_POSITIONS)
    .filter(([id]) => id !== '8')
    .map(([id, { gx, gy }]) => {
      const { x, y } = gridToScreen(gx, gy)
      return { id: +id, x, y }
    })

  return (
    <g style={{ pointerEvents: 'none' }}>
      {links.map(({ id, x, y }) => {
        const active = selectedAgent === null || selectedAgent === id
        return (
          <motion.line
            key={id}
            x1={center.x} y1={center.y}
            x2={x}        y2={y}
            stroke="rgba(155,110,243,0.18)"
            strokeWidth="0.8"
            strokeDasharray="2 6"
            animate={{
              opacity: active ? [0.25, 0.45, 0.25] : 0.08,
              strokeDashoffset: [0, -16],
            }}
            transition={{
              opacity: { duration: 3 + id * 0.2, repeat: Infinity, ease: 'easeInOut' },
              strokeDashoffset: { duration: 4, repeat: Infinity, ease: 'linear' },
            }}
          />
        )
      })}
    </g>
  )
}
