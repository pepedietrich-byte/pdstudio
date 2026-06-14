import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { AGENT_POSITIONS, gridToScreen, TILE_W, TILE_H } from './useCamera'
import { AGENT_NAMES, WORKFLOW_AGENT_MAP } from '../../lib/n8n'
import { getLeadStage } from '../../lib/sheets'
import AgentAvatar from './AgentAvatar'

const COLORS = {
  1: '#00d4ff',   // Lead Qualifier
  2: '#9b6ef3',   // Claude Code Builder
  3: '#e8197f',   // Polish Agent
  4: '#f5a623',   // Human Writer
  5: '#2ddb72',   // Pricing Agent
  6: '#ff6b35',   // Fact Checker
}

export default function AgentStation({ agentId, leads = [], executions = [], onClick, focused, dimmed }) {
  const { gx, gy } = AGENT_POSITIONS[agentId]
  const { x, y }   = gridToScreen(gx, gy)
  const color      = COLORS[agentId] || '#9b6ef3'
  const name       = AGENT_NAMES[agentId]

  // Health from real executions
  const { err, lastStatus, running } = useMemo(() => {
    const wfId = Object.keys(WORKFLOW_AGENT_MAP).find(k => WORKFLOW_AGENT_MAP[k] === agentId)
    const runs = executions.filter(e => e.workflowId === wfId).slice(0, 10)
    return {
      err: runs.filter(e => e.status === 'error').length,
      lastStatus: runs[0]?.status || null,
      running: runs.some(e => e.status === 'running'),
    }
  }, [executions, agentId])

  const count = leads.filter(l => getLeadStage(l) >= agentId).length

  const statusColor = lastStatus === 'success' ? '#2ddb72'
    : lastStatus === 'error' ? '#f03a3a'
    : running ? color : 'rgba(255,255,255,0.25)'

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      animate={{ opacity: dimmed ? 0.85 : 1 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: dimmed ? 1.03 : 1.05 }}
    >
      {/* Hover-tilt invisible hitbox (bigger click area) */}
      <ellipse cx={x} cy={y} rx={TILE_W * 0.7} ry={TILE_H * 0.7} fill="transparent" />

      {/* Focused highlight ring */}
      {focused && (
        <motion.ellipse
          cx={x} cy={y + TILE_H * 0.7}
          rx={TILE_W * 0.55} ry={TILE_H * 0.30}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Health halo ring */}
      <circle
        cx={x} cy={y - 30}
        r="36"
        fill="none"
        stroke={`${color}25`}
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Avatar */}
      <AgentAvatar agentId={agentId} color={color} x={x} y={y - 4} running={running} />

      {/* Label (above avatar) */}
      <g transform={`translate(${x}, ${y - TILE_H * 0.95})`}>
        <rect
          x="-50" y="-14" width="100" height="20" rx="4"
          fill="rgba(7,5,26,0.85)"
          stroke={`${color}50`}
          strokeWidth="0.8"
        />
        <text
          x="0" y="0"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fontWeight="700"
          fill={color}
          letterSpacing="0.5"
        >
          A{agentId} · {name?.toUpperCase()}
        </text>
      </g>

      {/* Status dot below name */}
      <g transform={`translate(${x + 40}, ${y - TILE_H * 0.95 - 5})`}>
        <motion.circle
          cx="0" cy="0" r="3.2"
          fill={statusColor}
          animate={running ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      </g>

      {/* Lead-count badge on platform */}
      {count > 0 && (
        <g transform={`translate(${x - 50}, ${y + TILE_H * 0.55})`}>
          <rect x="-14" y="-7" width="28" height="14" rx="7" fill={`${color}22`} stroke={`${color}55`} strokeWidth="0.8" />
          <text x="0" y="3" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill={color}>
            {count}
          </text>
        </g>
      )}

      {/* Error pip */}
      {err > 0 && (
        <g transform={`translate(${x + 50}, ${y + TILE_H * 0.55})`}>
          <rect x="-14" y="-7" width="28" height="14" rx="7" fill="rgba(240,58,58,0.18)" stroke="rgba(240,58,58,0.5)" strokeWidth="0.8" />
          <text x="0" y="3" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#ff6b6b">
            {err}✗
          </text>
        </g>
      )}
    </motion.g>
  )
}
