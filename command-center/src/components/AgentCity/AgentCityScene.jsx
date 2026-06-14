import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IsometricGround from './IsometricGround'
import AgentStation from './AgentStation'
import PepeCommandCore from './PepeCommandCore'
import AgentDetailPanel from './AgentDetailPanel'
import HotLeadRadar from './HotLeadRadar'
import CommandMinimap from './CommandMinimap'
import DataStreams from './DataStreams'
import { useCamera } from './useCamera'
import { usePepe } from '../../hooks/usePepe'
import { useTwin } from '../Twin/TwinContext'
import { getLeadStage } from '../../lib/sheets'

// New architecture: 6 agents visible + TWIN PEPE (A7 webhook is reused by A2 internally)
const AGENT_NAMES = {
  1: 'Lead Qualifier',
  2: 'Claude Code Builder',
  3: 'Polish Agent',
  4: 'Human Writer',
  5: 'Pricing Agent',
  6: 'Fact Checker',
}

export default function AgentCityScene({ leads = [], executions = [], activeLead, onOpenPepeRoom, onOpenLeads }) {
  const camera = useCamera()
  const pepe   = usePepe({ leads, executions })
  const { sendAgentContext, status: twinStatus, setIsOpen: openTwin } = useTwin()
  const [selectedAgent, setSelectedAgent] = useState(null)

  function handleAgentClick(agentId) {
    if (agentId === 8) {
      // TWIN PEPE center — open TWIN conversation
      openTwin(true)
      if (twinStatus === 'connected') {
        sendAgentContext(8, 'COMMAND_CORE', leads.length)
      }
      return
    }
    setSelectedAgent(agentId)
    camera.focusAgent(agentId, 1.9)

    if (twinStatus === 'connected') {
      const agentErrors = pepe.agentErrors?.[agentId]
      const execStatus = agentErrors?.lastError ? 'Fehler' : 'OK'
      const stageLeads = leads.filter(l => getLeadStage(l) === agentId).length
      sendAgentContext(agentId, execStatus, stageLeads)
    }
  }

  function handleClose() {
    setSelectedAgent(null)
    camera.reset()
  }

  // Esc to close
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && selectedAgent !== null) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedAgent])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'min(78vh, 720px)',
        minHeight: 480,
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(155,110,243,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,25,127,0.06) 0%, transparent 60%),
          linear-gradient(180deg, #07051a 0%, #0a0716 60%, #060410 100%)
        `,
        border: '1px solid rgba(155,110,243,0.18)',
        boxShadow: 'inset 0 0 80px rgba(155,110,243,0.06)',
      }}
    >
      {/* Scanlines bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        zIndex: 1,
      }} />

      {/* Section label */}
      <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 5 }}>
        <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(155,110,243,0.55)' }}>
          ◈ PDSTUDIO // COMMAND CENTER
        </div>
        <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {selectedAgent
            ? `Focus → ${AGENT_NAMES[selectedAgent] || `Agent ${selectedAgent}`}`
            : 'Manuell steuern · Agent anklicken für Details'}
        </div>
      </div>

      {/* Empty data banner */}
      {leads.length === 0 && executions.length === 0 && (
        <div style={{
          position: 'absolute', bottom: 14, right: 14, zIndex: 6,
          background: 'rgba(245,166,35,0.08)',
          border: '1px solid rgba(245,166,35,0.25)',
          borderRadius: 6, padding: '6px 12px',
        }}>
          <span className="font-mono text-[9px]" style={{ color: '#f5a623' }}>
            ⚠ Keine Daten — Pipeline läuft noch nicht
          </span>
        </div>
      )}

      {/* Reset button when zoomed */}
      <AnimatePresence>
        {selectedAgent !== null && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={handleClose}
            style={{
              position: 'absolute', top: 14, right: 18, zIndex: 6,
              padding: '6px 12px', borderRadius: 6,
              background: 'rgba(155,110,243,0.12)',
              border: '1px solid rgba(155,110,243,0.35)',
              color: '#c8a8ff',
              fontFamily: 'var(--font-mono,monospace)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            ← OVERVIEW [ESC]
          </motion.button>
        )}
      </AnimatePresence>

      {/* SVG Scene */}
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}
      >
        <defs>
          <radialGradient id="floorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(155,110,243,0.22)" />
            <stop offset="60%" stopColor="rgba(155,110,243,0.06)" />
            <stop offset="100%" stopColor="rgba(155,110,243,0)" />
          </radialGradient>
          <radialGradient id="depthGlow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="rgba(255,215,0,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="agentShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="hexgrid" patternUnits="userSpaceOnUse" width="60" height="52">
            <path d="M30 0 L60 17 L60 35 L30 52 L0 35 L0 17 Z" fill="none" stroke="rgba(155,110,243,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Camera group — translate + scale via motion values */}
        <motion.g style={{ x: camera.x, y: camera.y, scale: camera.zoom, originX: 600, originY: 350 }}>
          {/* Layer 0: depth glow (atmosphere) */}
          <rect x="0" y="0" width="1200" height="700" fill="url(#depthGlow)" opacity="0.7" />
          {/* Layer 1: hex grid for depth perception */}
          <rect x="0" y="0" width="1200" height="700" fill="url(#hexgrid)" opacity="0.6" />
          {/* Layer 2: floor glow under Pepe */}
          <ellipse cx="600" cy="370" rx="540" ry="240" fill="url(#floorGlow)" opacity="0.55" />
          {/* Layer 3: outer hex ring connecting agents */}
          <polygon points="600,170 924,250 924,450 600,530 276,450 276,250"
            fill="none" stroke="rgba(155,110,243,0.12)" strokeWidth="1.5" strokeDasharray="4 8" />
          <IsometricGround />
          <DataStreams selectedAgent={selectedAgent} />
          <HotLeadRadar leads={leads} />

          {/* 6 Agent stations on hexagon (symmetric) */}
          {[1, 2, 3, 4, 5, 6].map(id => (
            <AgentStation
              key={id}
              agentId={id}
              leads={leads}
              executions={executions}
              onClick={() => handleAgentClick(id)}
              focused={selectedAgent === id}
              dimmed={selectedAgent !== null && selectedAgent !== id}
            />
          ))}

          {/* PEPE Core in center */}
          <PepeCommandCore
            pepe={pepe}
            onClick={() => handleAgentClick(8)}
            focused={selectedAgent === 8}
            dimmed={selectedAgent !== null && selectedAgent !== 8}
          />
        </motion.g>
      </svg>

      {/* Minimap (top-right corner of scene, below esc) */}
      <CommandMinimap
        selectedAgent={selectedAgent}
        onSelect={handleAgentClick}
        agentErrors={pepe.agentErrors}
      />

      {/* Agent Detail Panel */}
      <AnimatePresence>
        {selectedAgent !== null && selectedAgent !== 8 && (
          <AgentDetailPanel
            agentId={selectedAgent}
            leads={leads}
            executions={executions}
            activeLead={activeLead}
            onClose={handleClose}
            onOpenLeads={onOpenLeads}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
