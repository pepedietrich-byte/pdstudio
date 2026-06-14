import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IsometricGround from './IsometricGround'
import AgentStation from './AgentStation'
import PepeCommandCore from './PepeCommandCore'
import AgentDetailPanel from './AgentDetailPanel'
import HotLeadRadar from './HotLeadRadar'
import CommandMinimap from './CommandMinimap'
import DataStreams from './DataStreams'
import { useCamera, AGENT_POSITIONS, gridToScreen } from './useCamera'
import { usePepe } from '../../hooks/usePepe'
import { useTwin } from '../Twin/TwinContext'
import { getLeadStage } from '../../lib/sheets'

// New architecture: 6 agents visible + TWIN PEPE
const AGENT_NAMES = {
  1: 'Lead Qualifier',
  2: 'Claude Code Builder',
  3: 'Polish Agent',
  4: 'Human Writer',
  5: 'Pricing Agent',
  6: 'Fact Checker',
  8: 'TWIN PEPE',
}

const AGENT_COLORS = {
  1: '#00d4ff', 2: '#9b6ef3', 3: '#e8197f',
  4: '#f5a623', 5: '#2ddb72', 6: '#ff6b35', 8: '#ffd700',
}

export default function AgentCityScene({ leads = [], executions = [], activeLead, onOpenPepeRoom, onOpenLeads }) {
  const camera = useCamera()
  const pepe   = usePepe({ leads, executions })
  const { sendAgentContext, status: twinStatus, setIsOpen: openTwin } = useTwin()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [hoverAgent, setHoverAgent] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const containerRef = useRef(null)

  // ── Click-Handler — App-Verhalten ──────────────────────────────────────
  function handleAgentClick(agentId) {
    if (agentId === 8) {
      openTwin(true)
      if (twinStatus === 'connected') sendAgentContext(8, 'COMMAND_CORE', leads.length)
      setSelectedAgent(8)
      camera.focusAgent(8, 2.4)
      return
    }
    setSelectedAgent(agentId)
    camera.focusAgent(agentId)

    if (twinStatus === 'connected') {
      const agentErrors = pepe.agentErrors?.[agentId]
      const execStatus = agentErrors?.lastError ? 'Fehler' : 'OK'
      const stageLeads = leads.filter(l => getLeadStage(l) === agentId).length
      sendAgentContext(agentId, execStatus, stageLeads)
    }
  }

  function handleClose() {
    setSelectedAgent(null)
    setHoverAgent(null)
    camera.reset()
  }

  // ── Keyboard Shortcuts (1-6 für Agenten, 0/8 für TWIN, ESC reset, ? help)
  useEffect(() => {
    function onKey(e) {
      // Don't grab keys when user types in inputs
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable) return

      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return }
        if (selectedAgent !== null) handleClose()
        return
      }
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setShowHelp(s => !s)
        return
      }
      const num = parseInt(e.key, 10)
      if (Number.isInteger(num)) {
        if (num >= 1 && num <= 6) {
          handleAgentClick(num)
          e.preventDefault()
        } else if (num === 0 || num === 8) {
          handleAgentClick(8)
          e.preventDefault()
        }
      }
      // Arrow keys cycle through agents
      if (selectedAgent !== null && selectedAgent !== 8) {
        if (e.key === 'ArrowRight' || e.key === 'Tab') {
          const next = selectedAgent === 6 ? 1 : selectedAgent + 1
          handleAgentClick(next); e.preventDefault()
        }
        if (e.key === 'ArrowLeft') {
          const prev = selectedAgent === 1 ? 6 : selectedAgent - 1
          handleAgentClick(prev); e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedAgent, showHelp]) // eslint-disable-line

  // ── Focus-Ring Position für Connection-Line ────────────────────────────
  const focusedPos = useMemo(() => {
    if (selectedAgent === null) return null
    const p = AGENT_POSITIONS[selectedAgent]
    if (!p) return null
    return gridToScreen(p.gx, p.gy)
  }, [selectedAgent])

  const focusColor = selectedAgent ? AGENT_COLORS[selectedAgent] : '#9b6ef3'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        // Etwas größer damit Photo-Zoom mehr "Bühne" hat
        height: 'min(82vh, 780px)',
        minHeight: 520,
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(155,110,243,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,25,127,0.06) 0%, transparent 60%),
          linear-gradient(180deg, #07051a 0%, #0a0716 60%, #060410 100%)
        `,
        border: `1px solid ${selectedAgent ? focusColor + '40' : 'rgba(155,110,243,0.18)'}`,
        boxShadow: selectedAgent
          ? `inset 0 0 120px ${focusColor}15, 0 0 60px ${focusColor}15`
          : 'inset 0 0 80px rgba(155,110,243,0.06)',
        transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
      }}
    >
      {/* Scanlines bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        zIndex: 1,
      }} />

      {/* Section label + Active Agent Indicator */}
      <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 5, pointerEvents: 'none' }}>
        <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(155,110,243,0.55)' }}>
          ◈ PDSTUDIO // COMMAND CENTER
        </div>
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <motion.div key="focused"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  width: 8, height: 8, borderRadius: '50%', background: focusColor,
                  boxShadow: `0 0 12px ${focusColor}`,
                }} />
              <div className="font-mono text-[10px]" style={{ color: focusColor, fontWeight: 700, letterSpacing: '0.06em' }}>
                FOCUSED · A{selectedAgent === 8 ? '8' : selectedAgent} {AGENT_NAMES[selectedAgent]}
              </div>
            </motion.div>
          ) : (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Klick Agent · Tasten 1-6 fokussieren · ? für Hilfe
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help-Toggle Button (top-right area, before reset button) */}
      <button
        onClick={() => setShowHelp(s => !s)}
        style={{
          position: 'absolute', top: 14, right: selectedAgent !== null ? 144 : 18, zIndex: 6,
          width: 24, height: 24, borderRadius: 12,
          background: showHelp ? `${focusColor}25` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${showHelp ? focusColor + '60' : 'rgba(255,255,255,0.1)'}`,
          color: showHelp ? focusColor : '#9ca3b5',
          fontFamily: 'var(--font-mono,monospace)',
          fontSize: 10, fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title="Shortcuts (?)"
      >
        ?
      </button>

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
              background: `${focusColor}18`,
              border: `1px solid ${focusColor}50`,
              color: focusColor,
              fontFamily: 'var(--font-mono,monospace)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            ← OVERVIEW [ESC]
          </motion.button>
        )}
      </AnimatePresence>

      {/* Shortcuts-Help Overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            style={{
              position: 'absolute', top: 46, right: 18, zIndex: 20,
              background: 'rgba(15,20,30,0.97)',
              border: '1px solid rgba(155,110,243,0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: 8, padding: 14,
              minWidth: 260, maxWidth: 320,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div className="font-mono text-[8px] uppercase tracking-widest mb-2" style={{ color: '#9b6ef3' }}>
              Keyboard Shortcuts
            </div>
            <div className="space-y-1.5 text-[10px]" style={{ color: '#cbd5e1' }}>
              {[
                ['1-6', 'Direkt-Fokus auf Agent'],
                ['0 / 8', 'TWIN PEPE öffnen'],
                ['←  →', 'Nächster / Vorheriger Agent'],
                ['Tab', 'Cyclen durch Agents'],
                ['ESC', 'Zurück zur Übersicht'],
                ['? / H', 'Diese Hilfe ein/aus'],
                ['Klick außerhalb', 'Zurück zur Übersicht'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{
                    background: 'rgba(155,110,243,0.15)',
                    border: '1px solid rgba(155,110,243,0.3)',
                    color: '#c8a8ff',
                    minWidth: 56, textAlign: 'center',
                  }}>{key}</kbd>
                  <span className="text-[10px]" style={{ color: '#cbd5e1' }}>{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover-Quickinfo (über non-focused Agent) */}
      <AnimatePresence>
        {hoverAgent !== null && hoverAgent !== selectedAgent && selectedAgent === null && (
          <HoverQuickInfo
            agentId={hoverAgent}
            leads={leads}
            executions={executions}
          />
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
          <radialGradient id="focusPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${focusColor}55`} />
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

        {/* ── BACKGROUND CLICK-CATCHER — APP-Verhalten ───────────────────
            Click auf den Hintergrund (außerhalb von Stations) → reset.
            Stations stoppen die Propagation in ihrem eigenen handler. */}
        <rect x="0" y="0" width="1200" height="700"
          fill="transparent"
          style={{ cursor: selectedAgent !== null ? 'zoom-out' : 'default' }}
          onClick={() => { if (selectedAgent !== null) handleClose() }}
        />

        {/* Background-Parallax-Group (Atmosphäre, hinter Hauptcam)
            transform-origin via CSS auf SVG-Koordinate-Mitte */}
        <motion.g style={{
            x: camera.parallaxBg, scale: camera.zoom,
            transformOrigin: '600px 350px',
          }}
          pointerEvents="none">
          <rect x="0" y="0" width="1200" height="700" fill="url(#depthGlow)" opacity="0.7" />
          <rect x="0" y="0" width="1200" height="700" fill="url(#hexgrid)" opacity="0.6" />
        </motion.g>

        {/* Main Camera-Group */}
        <motion.g style={{
            x: camera.x, y: camera.y, scale: camera.zoom,
            transformOrigin: '600px 350px',
          }}>
          {/* Layer 2: floor glow under Pepe */}
          <ellipse cx="600" cy="370" rx="540" ry="240" fill="url(#floorGlow)" opacity="0.55" pointerEvents="none" />
          {/* Layer 3: outer hex ring connecting agents */}
          <polygon points="600,170 924,250 924,450 600,530 276,450 276,250"
            fill="none" stroke={selectedAgent ? `${focusColor}25` : "rgba(155,110,243,0.12)"}
            strokeWidth="1.5" strokeDasharray="4 8"
            style={{ transition: 'stroke 0.6s ease' }}
            pointerEvents="none" />
          <IsometricGround />
          <DataStreams selectedAgent={selectedAgent} />
          <HotLeadRadar leads={leads} />

          {/* ── FOCUS PULSE — radial glow um focused Agent ────────────── */}
          {focusedPos && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} pointerEvents="none">
              {/* Outer pulsing ring */}
              <motion.circle
                cx={focusedPos.x} cy={focusedPos.y} r={70}
                fill="none" stroke={focusColor} strokeWidth="1.5"
                animate={{ r: [70, 100, 70], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Inner static glow */}
              <circle cx={focusedPos.x} cy={focusedPos.y} r={55}
                fill="url(#focusPulse)" />
              {/* Center crosshair */}
              <g stroke={focusColor} strokeWidth="0.6" opacity="0.55">
                <line x1={focusedPos.x - 8} y1={focusedPos.y} x2={focusedPos.x + 8} y2={focusedPos.y} />
                <line x1={focusedPos.x} y1={focusedPos.y - 8} x2={focusedPos.x} y2={focusedPos.y + 8} />
              </g>
            </motion.g>
          )}

          {/* 6 Agent stations */}
          {[1, 2, 3, 4, 5, 6].map(id => (
            <g key={id}
              onMouseEnter={() => setHoverAgent(id)}
              onMouseLeave={() => setHoverAgent(null)}>
              <AgentStation
                agentId={id}
                leads={leads}
                executions={executions}
                onClick={(e) => {
                  if (e?.stopPropagation) e.stopPropagation()
                  handleAgentClick(id)
                }}
                focused={selectedAgent === id}
                dimmed={selectedAgent !== null && selectedAgent !== id}
              />
            </g>
          ))}

          {/* PEPE Core */}
          <g onMouseEnter={() => setHoverAgent(8)}
             onMouseLeave={() => setHoverAgent(null)}>
            <PepeCommandCore
              pepe={pepe}
              onClick={(e) => {
                if (e?.stopPropagation) e.stopPropagation()
                handleAgentClick(8)
              }}
              focused={selectedAgent === 8}
              dimmed={selectedAgent !== null && selectedAgent !== 8}
            />
          </g>
        </motion.g>
      </svg>

      {/* ── Connection-Line Overlay (außerhalb SVG, in DOM) ──────────────
          Eine subtile gestrichelte Linie vom focused Station zum
          Detail-Panel-Rand rechts. */}
      <AnimatePresence>
        {selectedAgent !== null && selectedAgent !== 8 && focusedPos && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9,
            }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1200 700">
              <motion.path
                d={`M ${focusedPos.x + 30} ${focusedPos.y} Q ${(focusedPos.x + 700) / 2} ${focusedPos.y - 40} 700 ${focusedPos.y - 20}`}
                fill="none" stroke={focusColor} strokeWidth="1" strokeDasharray="4 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap */}
      <CommandMinimap
        selectedAgent={selectedAgent}
        onSelect={handleAgentClick}
        agentErrors={pepe.agentErrors}
      />

      {/* Agent Detail Panel */}
      <AnimatePresence>
        {selectedAgent !== null && selectedAgent !== 8 && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}>
              <AgentDetailPanel
                agentId={selectedAgent}
                leads={leads}
                executions={executions}
                activeLead={activeLead}
                onClose={handleClose}
                onOpenLeads={onOpenLeads}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── HoverQuickInfo Component ─────────────────────────────────────────────
// Floating Tooltip oberhalb des AgentCity-Containers wenn man über eine
// Station hovert (nur im Overview, nicht wenn schon was selected ist).
function HoverQuickInfo({ agentId, leads, executions }) {
  const name = AGENT_NAMES[agentId] || `Agent ${agentId}`
  const color = AGENT_COLORS[agentId] || '#9b6ef3'
  const stageCount = leads.filter(l => getLeadStage(l) === agentId).length
  const totalAtOrPast = leads.filter(l => getLeadStage(l) >= agentId).length
  const recent = executions.slice(0, 5)
  const errCount = recent.filter(e => e.status === 'error').length
  const okCount = recent.filter(e => e.status === 'success').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute', top: 50, left: 18, zIndex: 7,
        background: `linear-gradient(135deg, ${color}10 0%, rgba(15,20,30,0.96) 100%)`,
        border: `1px solid ${color}50`,
        backdropFilter: 'blur(8px)',
        borderRadius: 6, padding: '8px 12px',
        minWidth: 200,
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      }}>
      <div className="flex items-center gap-2 mb-1">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <div className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color }}>
          A{agentId === 8 ? '8' : agentId} · {name}
        </div>
      </div>
      <div className="text-[10px] grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ color: '#9ca3b5' }}>
        <div>Stage: <span style={{ color: '#e8edf4' }}>{stageCount}</span></div>
        <div>Total: <span style={{ color: '#e8edf4' }}>{totalAtOrPast}</span></div>
        <div>OK 5x: <span style={{ color: '#39ff88' }}>{okCount}</span></div>
        <div>Err 5x: <span style={{ color: errCount > 0 ? '#ef4444' : '#6b7a90' }}>{errCount}</span></div>
      </div>
      <div className="text-[9px] mt-1.5" style={{ color: color, opacity: 0.7 }}>
        ↵ klicken oder {agentId} drücken für Details
      </div>
    </motion.div>
  )
}
