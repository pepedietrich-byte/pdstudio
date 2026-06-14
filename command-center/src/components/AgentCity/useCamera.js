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

// Cinematic dual-phase animation:
// Phase A: Pan smoothly toward target while zoom builds slowly
// Phase B: Zoom deepens with subtle overshoot for "diving in" feel
const PAN_SPRING  = { type: 'spring', stiffness: 60,  damping: 26, mass: 1.1 }
const ZOOM_SPRING = { type: 'spring', stiffness: 70,  damping: 24, mass: 1.0 }
const RESET_SPRING = { type: 'spring', stiffness: 80, damping: 28, mass: 1.0 }

// Default cinematic zoom: pushed from 2.0 to 2.6 → fühlbar "näher dran"
const DEFAULT_ZOOM = 2.6

export function useCamera() {
  const x    = useMotionValue(0)
  const y    = useMotionValue(0)
  const zoom = useMotionValue(1)
  // Parallax-Tiefe: Foreground stations bewegen sich leicht über die Scene-Cam
  // hinaus, Background-Layer (depthGlow, hex-grid) leicht hinter ihr.
  const parallaxFg = useMotionValue(0)
  const parallaxBg = useMotionValue(0)
  const lastFocus = useRef(null)

  const focusAgent = useCallback((agentId, targetZoom = DEFAULT_ZOOM) => {
    const pos = AGENT_POSITIONS[agentId]
    if (!pos) return
    const { x: sx, y: sy } = gridToScreen(pos.gx, pos.gy)
    // Move so that (sx,sy) lands at viewport center, then scale.
    const dx = -(sx - CX) * targetZoom
    const dy = -(sy - CY) * targetZoom

    // Phase A: Pan startet sofort, zoom mit kurzer Verzögerung (cinematic dive-in)
    animate(x,    dx, PAN_SPRING)
    animate(y,    dy, PAN_SPRING)
    animate(parallaxFg, dx * 0.06, PAN_SPRING)  // Foreground hint forward
    animate(parallaxBg, dx * -0.04, PAN_SPRING) // Background hint backward
    animate(zoom, targetZoom, { ...ZOOM_SPRING, delay: 0.08 })
    lastFocus.current = agentId
  }, [x, y, zoom, parallaxFg, parallaxBg])

  const reset = useCallback(() => {
    animate(x,    0, RESET_SPRING)
    animate(y,    0, RESET_SPRING)
    animate(parallaxFg, 0, RESET_SPRING)
    animate(parallaxBg, 0, RESET_SPRING)
    animate(zoom, 1, RESET_SPRING)
    lastFocus.current = null
  }, [x, y, zoom, parallaxFg, parallaxBg])

  return { x, y, zoom, parallaxFg, parallaxBg, focusAgent, reset, lastFocus }
}
