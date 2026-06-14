import { useMotionValue, animate } from 'framer-motion'
import { useCallback, useRef } from 'react'

// Iso projection constants — must match IsometricGround.jsx
export const TILE_W = 160
export const TILE_H = 80
export const CX     = 600
export const CY     = 350

export function gridToScreen(gx, gy) {
  return {
    x: (gx - gy) * (TILE_W / 2) + CX,
    y: (gx + gy) * (TILE_H / 2) + CY,
  }
}

// 6 agents arranged in a perfect hexagon around TWIN PEPE (symmetrical).
// Hexagon math: r=2.8, angle increments of 60deg starting at -90deg (top).
const HEX_R = 2.8
function hexPos(idx) {
  const angle = (-90 + idx * 60) * Math.PI / 180
  return { gx: Math.round(Math.cos(angle) * HEX_R * 10) / 10, gy: Math.round(Math.sin(angle) * HEX_R * 10) / 10 }
}

export const AGENT_POSITIONS = {
  1: hexPos(0),   // 12:00 — Lead Qualifier (Pipeline-Eingang oben)
  2: hexPos(1),   //  2:00 — Claude Code Builder
  3: hexPos(2),   //  4:00 — Polish Agent
  4: hexPos(3),   //  6:00 — Human Writer (gegenüber Qualifier)
  5: hexPos(4),   //  8:00 — Pricing Agent
  6: hexPos(5),   // 10:00 — Fact Checker
  8: { gx: 0, gy: 0 },  // TWIN PEPE — center
}

const SPRING = { type: 'spring', stiffness: 90, damping: 22, mass: 0.9 }

export function useCamera() {
  const x    = useMotionValue(0)
  const y    = useMotionValue(0)
  const zoom = useMotionValue(1)
  const lastFocus = useRef(null)

  const focusAgent = useCallback((agentId, targetZoom = 2) => {
    const pos = AGENT_POSITIONS[agentId]
    if (!pos) return
    const { x: sx, y: sy } = gridToScreen(pos.gx, pos.gy)
    // Move so that (sx,sy) lands at viewport center, then scale.
    // In SVG: translate THEN scale → final tx = -(sx-CX)*z, ty = -(sy-CY)*z
    animate(x,    -(sx - CX) * targetZoom, SPRING)
    animate(y,    -(sy - CY) * targetZoom, SPRING)
    animate(zoom, targetZoom, SPRING)
    lastFocus.current = agentId
  }, [x, y, zoom])

  const reset = useCallback(() => {
    animate(x,    0, SPRING)
    animate(y,    0, SPRING)
    animate(zoom, 1, SPRING)
    lastFocus.current = null
  }, [x, y, zoom])

  return { x, y, zoom, focusAgent, reset, lastFocus }
}
