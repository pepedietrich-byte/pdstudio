import { motion } from 'framer-motion'

const CONFIGS = {
  idle:    { label: 'IDLE',    color: '#52526b' },
  running: { label: 'RUNNING', color: '#00d4ff' },
  done:    { label: 'DONE',    color: '#2ddb72' },
  error:   { label: 'ERROR',   color: '#f03a3a' },
  waiting: { label: 'WAIT',    color: '#f5a623' },
  website: { label: 'LIVE',    color: '#e8197f' },
  stage7:  { label: 'LIVE',    color: '#e8197f' },
}

export default function StatusBadge({ status = 'idle', size = 'sm' }) {
  const cfg       = CONFIGS[status] ?? CONFIGS.idle
  const isRunning = status === 'running'
  const fs        = size === 'sm' ? '10px' : '11px'
  const pad       = size === 'sm' ? '2px 7px' : '3px 9px'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded font-mono font-semibold tracking-wider"
      style={{
        color:      cfg.color,
        background: `${cfg.color}12`,
        border:     `1px solid ${cfg.color}28`,
        fontSize:   fs,
        padding:    pad,
        letterSpacing: '0.08em',
      }}
    >
      <motion.span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{ background: cfg.color }}
        animate={isRunning ? { opacity: [1, 0.25, 1], scale: [1, 1.2, 1] } : { opacity: 1, scale: 1 }}
        transition={isRunning ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      />
      {cfg.label}
    </span>
  )
}
