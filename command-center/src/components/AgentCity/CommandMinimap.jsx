import { motion } from 'framer-motion'
import { AGENT_POSITIONS, gridToScreen } from './useCamera'

const COLORS = {
  1: '#00d4ff', 2: '#e8197f', 3: '#2ddb72', 4: '#f5a623',
  5: '#9b6ef3', 6: '#00d4ff', 7: '#e8197f', 8: '#ffd700',
}

/**
 * Tiny navigator in bottom-left corner of the scene.
 * Click a dot → camera focuses that agent.
 */
export default function CommandMinimap({ selectedAgent, onSelect, agentErrors = [] }) {
  const errorMap = new Map((agentErrors || []).map(e => [e.agentId, e.count]))

  return (
    <div
      style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 5,
        background: 'rgba(7,5,26,0.85)',
        border: '1px solid rgba(155,110,243,0.25)',
        borderRadius: 8,
        padding: '10px 12px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="font-mono text-[8px] tracking-widest mb-2" style={{ color: 'rgba(155,110,243,0.55)' }}>
        ◈ MINIMAP
      </div>
      <svg width="140" height="120" viewBox="0 0 1200 700" style={{ display: 'block' }}>
        {/* Center dot ref */}
        <circle cx="600" cy="350" r="3" fill="rgba(155,110,243,0.18)" />
        {/* Diamond floor outline */}
        <path
          d={(() => {
            const t = gridToScreen(0, -5), r = gridToScreen(5, 0), b = gridToScreen(0, 5), l = gridToScreen(-5, 0)
            return `M ${t.x} ${t.y} L ${r.x} ${r.y} L ${b.x} ${b.y} L ${l.x} ${l.y} Z`
          })()}
          fill="rgba(155,110,243,0.04)"
          stroke="rgba(155,110,243,0.2)"
          strokeWidth="3"
        />
        {/* Agent dots */}
        {Object.entries(AGENT_POSITIONS).map(([id, { gx, gy }]) => {
          const { x, y } = gridToScreen(gx, gy)
          const agentId  = +id
          const color    = COLORS[agentId]
          const isSelected = selectedAgent === agentId
          const isPepe   = agentId === 8
          const errCount = errorMap.get(agentId) || 0
          return (
            <motion.g key={id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect?.(agentId)}
              whileHover={{ scale: 1.4 }}
              animate={isSelected ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={isSelected ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}
            >
              <circle cx={x} cy={y} r={isPepe ? 26 : 18} fill={color}
                stroke={isSelected ? '#fff' : 'none'} strokeWidth="3"
                opacity={isPepe ? 0.85 : 0.7} />
              <text x={x} y={y + 7} textAnchor="middle"
                fontFamily="JetBrains Mono, monospace" fontSize="18" fontWeight="800"
                fill="rgba(7,5,26,0.95)">
                {isPepe ? 'P' : agentId}
              </text>
              {/* Error pip */}
              {errCount > 0 && (
                <circle cx={x + (isPepe ? 26 : 18) - 4} cy={y - (isPepe ? 26 : 18) + 4} r="8"
                  fill="#f03a3a" />
              )}
            </motion.g>
          )
        })}
      </svg>
      <div className="font-mono text-[8px] mt-1.5 text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
        Click to zoom
      </div>
    </div>
  )
}
