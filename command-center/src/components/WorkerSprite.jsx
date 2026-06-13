import { motion } from 'framer-motion'

const WORKER_DEFS = {
  1: { // Lead Scanner — character with magnifying glass
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        {/* Head */}
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        {/* Eyes */}
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        {/* Legs */}
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Magnifying glass arm */}
        <rect x="18" y="13" width="2" height="6" rx="1" fill={color} opacity="0.7" transform="rotate(-30 18 13)"/>
        <circle cx="21" cy="11" r="3" stroke={color} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <line x1="23" y1="13" x2="25" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      </svg>
    )
  },
  2: { // Text Extractor — typing at keyboard
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="9" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="21" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="21" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Arms reaching forward to keyboard */}
        <rect x="6" y="15" width="5" height="1.5" rx="0.75" fill={color} opacity="0.7"/>
        <rect x="17" y="15" width="5" height="1.5" rx="0.75" fill={color} opacity="0.7"/>
        {/* Keyboard */}
        <rect x="5" y="23" width="18" height="3" rx="1.5" fill={color} opacity="0.3"/>
        <rect x="7" y="24" width="2" height="1" rx="0.5" fill={color} opacity="0.6"/>
        <rect x="10" y="24" width="2" height="1" rx="0.5" fill={color} opacity="0.6"/>
        <rect x="13" y="24" width="2" height="1" rx="0.5" fill={color} opacity="0.6"/>
        <rect x="16" y="24" width="2" height="1" rx="0.5" fill={color} opacity="0.6"/>
        <rect x="19" y="24" width="2" height="1" rx="0.5" fill={color} opacity="0.6"/>
      </svg>
    )
  },
  3: { // Image Extractor — holding camera
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Camera body */}
        <rect x="17" y="13" width="8" height="6" rx="1.5" fill={color} opacity="0.4"/>
        <rect x="18" y="12" width="3" height="2" rx="0.5" fill={color} opacity="0.5"/>
        <circle cx="21" cy="16" r="2" stroke={color} strokeWidth="1.2" fill="none" opacity="0.9"/>
        <circle cx="21" cy="16" r="0.8" fill={color} opacity="0.7"/>
        {/* Flash */}
        <circle cx="24" cy="13.5" r="0.8" fill={color} opacity="0.6"/>
      </svg>
    )
  },
  4: { // Data Validator — clipboard checker
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Clipboard */}
        <rect x="17" y="11" width="8" height="11" rx="1.5" fill={color} opacity="0.25"/>
        <rect x="19.5" y="10" width="3" height="2" rx="0.5" fill={color} opacity="0.5"/>
        {/* Check marks */}
        <path d="M19 15 L20.5 16.5 L23 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <path d="M19 18 L20.5 19.5 L23 17" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
    )
  },
  5: { // Concept Architect — blueprint/pen
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Blueprint */}
        <rect x="17" y="11" width="9" height="12" rx="1" fill={color} opacity="0.2"/>
        <line x1="18" y1="14" x2="25" y2="14" stroke={color} strokeWidth="0.8" opacity="0.6"/>
        <line x1="18" y1="17" x2="25" y2="17" stroke={color} strokeWidth="0.8" opacity="0.4"/>
        <line x1="18" y1="20" x2="22" y2="20" stroke={color} strokeWidth="0.8" opacity="0.4"/>
        <line x1="20" y1="12" x2="20" y2="22" stroke={color} strokeWidth="0.8" opacity="0.4"/>
        {/* Pencil */}
        <rect x="4" y="13" width="7" height="2" rx="0.5" fill={color} opacity="0.7" transform="rotate(-45 7 14)"/>
        <polygon points="4,16 2,18 5,17" fill={color} opacity="0.8"/>
      </svg>
    )
  },
  6: { // Prompt Builder — writing/coding
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Laptop/screen */}
        <rect x="4" y="15" width="7" height="5" rx="1" fill={color} opacity="0.25"/>
        <rect x="3.5" y="20" width="8" height="1" rx="0.5" fill={color} opacity="0.3"/>
        {/* Code lines */}
        <line x1="5" y1="17" x2="9" y2="17" stroke={color} strokeWidth="0.7" opacity="0.7"/>
        <line x1="5" y1="18.5" x2="8" y2="18.5" stroke={color} strokeWidth="0.7" opacity="0.5"/>
        {/* Code bracket text */}
        <text x="4.5" y="17.5" fontSize="3" fill={color} opacity="0.8" fontFamily="monospace">{"{ }"}</text>
      </svg>
    )
  },
  7: { // Website Builder — construction
    body: (color) => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="10" y="12" width="8" height="10" rx="2" fill={color} opacity="0.9"/>
        <rect x="11" y="7" width="6" height="6" rx="3" fill={color}/>
        {/* Hard hat */}
        <path d="M10 8 Q14 4 18 8 Z" fill={color} opacity="0.8"/>
        <rect x="9.5" y="7.5" width="9" height="2" rx="1" fill={color} opacity="0.6"/>
        <rect x="12" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="14.5" y="9" width="1.5" height="1.5" rx="0.5" fill="#000" opacity="0.6"/>
        <rect x="11" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        <rect x="14.5" y="22" width="2.5" height="3" rx="1" fill={color} opacity="0.8"/>
        {/* Wrench */}
        <rect x="17" y="14" width="8" height="2" rx="1" fill={color} opacity="0.6" transform="rotate(-30 21 15)"/>
        <circle cx="19" cy="16" r="2" stroke={color} strokeWidth="1.2" fill="none" opacity="0.8"/>
        {/* Bricks */}
        <rect x="4" y="22" width="5" height="2" rx="0.5" fill={color} opacity="0.3"/>
        <rect x="4" y="20" width="5" height="2" rx="0.5" fill={color} opacity="0.25"/>
        <rect x="5.5" y="18" width="5" height="2" rx="0.5" fill={color} opacity="0.2"/>
      </svg>
    )
  }
}

const AGENT_COLORS = {
  1: '#00d4ff',
  2: '#e8197f',
  3: '#2ddb72',
  4: '#f5a623',
  5: '#9b6ef3',
  6: '#00d4ff',
  7: '#e8197f',
}

export function WorkerSprite({ agentId, active = false, size = 1 }) {
  const def = WORKER_DEFS[agentId]
  const color = AGENT_COLORS[agentId] || '#00d4ff'

  if (!def) return null

  return (
    <motion.div
      style={{
        display: 'inline-block',
        transform: `scale(${size})`,
        transformOrigin: 'bottom center',
        filter: active ? `drop-shadow(0 0 6px ${color}88)` : 'none',
        opacity: active ? 1 : 0.6,
      }}
      animate={active ? {
        y: [0, -2, 0],
      } : { y: 0 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: (agentId - 1) * 0.15,
      }}
    >
      {def.body(color)}
    </motion.div>
  )
}

// Multiple workers in a scene
export function WorkerScene({ agentId, count = 3, active = false, running = false }) {
  const color = AGENT_COLORS[agentId] || '#00d4ff'

  return (
    <div style={{ position: 'relative', height: 44, display: 'flex', alignItems: 'flex-end', gap: 4, overflow: 'hidden' }}>
      {/* Ground line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}30, transparent)`
      }} />

      {/* Workers */}
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          style={{ display: 'inline-block', flexShrink: 0 }}
          animate={running ? {
            x: [i * 2, i * 2 + 4, i * 2],
          } : {}}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        >
          <WorkerSprite agentId={agentId} active={active || running} size={0.85} />
        </motion.div>
      ))}

      {/* Data particles when running */}
      {running && (
        <>
          {[0, 1, 2].map(i => (
            <motion.div
              key={`particle-${i}`}
              style={{
                position: 'absolute',
                width: 2, height: 2,
                borderRadius: '50%',
                background: color,
                left: `${20 + i * 30}%`,
                bottom: 8,
              }}
              animate={{
                y: [-8, -32],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default WorkerSprite
