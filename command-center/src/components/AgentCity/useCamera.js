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

// 6 agents + TWIN PEPE positions (grid coords)
export const AGENT_POSITIONS = {
  1: { gx: -2, gy: -2 },   // Lead Qualifier — NW
  2: { gx:  0, gy: -3 },   // Claude Code Builder — N (deep)
  3: { gx:  2, gy: -2 },   // Polish Agent — NE
  4: { gx:  3, gy:  0 },   // Human Writer — E
  5: { gx:  2, gy:  2 },   // Pricing Agent — SE
  6: { gx:  0, gy:  3 },   // Fact Checker — S
  8: { gx:  0, gy:  0 },   // TWIN PEPE — center
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
