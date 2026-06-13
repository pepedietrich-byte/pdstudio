import { motion } from 'framer-motion'

// Per-agent SVG signature shapes (kept simple — figure silhouette)
// Reused color from station; running adds bob+pulse.
export default function AgentAvatar({ agentId, color, x = 0, y = 0, running = false }) {
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={running ? { y: [0, -2, 0] } : { y: 0 }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Drop shadow */}
        <ellipse cx="0" cy="18" rx="11" ry="2.6" fill="rgba(0,0,0,0.45)" />

        {/* Body — humanoid silhouette */}
        <g>
          {/* Legs */}
          <rect x="-3.5" y="3" width="2.5" height="13" rx="1.2" fill="#1a1530" stroke={`${color}66`} strokeWidth="0.6" />
          <rect x="1" y="3" width="2.5" height="13" rx="1.2" fill="#1a1530" stroke={`${color}66`} strokeWidth="0.6" />

          {/* Torso */}
          <rect x="-5" y="-7" width="10" height="12" rx="2" fill="#241a3d" stroke={color} strokeWidth="0.8" />

          {/* Tech detail line on torso */}
          <line x1="-3" y1="-3" x2="3" y2="-3" stroke={color} strokeWidth="0.5" opacity="0.7" />
          <circle cx="0" cy="0.5" r="0.9" fill={color} />

          {/* Head */}
          <circle cx="0" cy="-12" r="4.4" fill="#2a2050" stroke={color} strokeWidth="0.8" />

          {/* Visor / face glow */}
          <motion.rect
            x="-3" y="-13.6" width="6" height="2.2" rx="0.8"
            fill={color}
            animate={running ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.75 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          {/* Antenna for fun */}
          <line x1="0" y1="-16.5" x2="0" y2="-19" stroke={color} strokeWidth="0.7" />
          <motion.circle
            cx="0" cy="-19.6" r="1"
            fill={color}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* Tool/sigil per agent (small icon next to character) */}
        <ToolSigil agentId={agentId} color={color} />
      </g>
    </motion.g>
  )
}

function ToolSigil({ agentId, color }) {
  // Tiny per-agent visual signature placed at shoulder
  const tx = 7, ty = -4
  switch (agentId) {
    case 1: // Luthor — search lens
      return (
        <g transform={`translate(${tx},${ty})`}>
          <circle cx="0" cy="0" r="2.6" fill="none" stroke={color} strokeWidth="0.8" />
          <line x1="2" y1="2" x2="4" y2="4" stroke={color} strokeWidth="0.8" />
        </g>
      )
    case 2: // Shakespeare — quill
      return (
        <g transform={`translate(${tx},${ty})`}>
          <line x1="-2" y1="3" x2="3" y2="-3" stroke={color} strokeWidth="0.9" />
          <line x1="2" y1="-2" x2="4" y2="-4" stroke={color} strokeWidth="0.9" />
        </g>
      )
    case 3: // Van Gogh — palette/brush
      return (
        <g transform={`translate(${tx},${ty})`}>
          <ellipse cx="0" cy="0" rx="3" ry="2.2" fill="none" stroke={color} strokeWidth="0.8" />
          <circle cx="-1.2" cy="-0.4" r="0.6" fill={color} />
          <circle cx="0.8" cy="0.6" r="0.6" fill={color} />
        </g>
      )
    case 4: // ELON — rocket
      return (
        <g transform={`translate(${tx},${ty})`}>
          <path d="M -1 3 L 1 3 L 2 -2 L 0 -4 L -2 -2 Z" fill="none" stroke={color} strokeWidth="0.8" />
          <line x1="-1" y1="3" x2="-1.5" y2="4.5" stroke={color} strokeWidth="0.6" />
        </g>
      )
    case 5: // Quentin — film clapper
      return (
        <g transform={`translate(${tx},${ty})`}>
          <rect x="-2.5" y="-2" width="5" height="3.5" rx="0.4" fill="none" stroke={color} strokeWidth="0.8" />
          <line x1="-2.5" y1="-2" x2="-1" y2="-3.5" stroke={color} strokeWidth="0.8" />
          <line x1="0.5" y1="-2" x2="2" y2="-3.5" stroke={color} strokeWidth="0.8" />
        </g>
      )
    case 6: // Bezos — package box
      return (
        <g transform={`translate(${tx},${ty})`}>
          <rect x="-2.5" y="-2" width="5" height="4" fill="none" stroke={color} strokeWidth="0.8" />
          <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke={color} strokeWidth="0.6" />
        </g>
      )
    case 7: // Zuckerberg — network graph
      return (
        <g transform={`translate(${tx},${ty})`}>
          <circle cx="-2" cy="0" r="0.9" fill={color} />
          <circle cx="2" cy="-1.5" r="0.9" fill={color} />
          <circle cx="2" cy="1.5" r="0.9" fill={color} />
          <line x1="-2" y1="0" x2="2" y2="-1.5" stroke={color} strokeWidth="0.5" />
          <line x1="-2" y1="0" x2="2" y2="1.5" stroke={color} strokeWidth="0.5" />
        </g>
      )
    default:
      return null
  }
}
