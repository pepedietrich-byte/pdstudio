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

// Photo-Viewer Zoom — wie ein Bild näher heranziehen, nicht reinscrollen.
// - Sanfter Zoom (1.65x), bewahrt Kontext rundherum
// - Pan nur partiell (60% des Weges), Agent rückt näher zur Mitte aber Nachbarn bleiben sichtbar
// - Detail-Panel offset: leichte Korrektur damit der Fokus-Punkt nicht
//   vom rechten Panel verdeckt wird → Pan nach LINKS verschoben
const PAN_SPRING   = { type: 'spring', stiffness: 70, damping: 26, mass: 1.0 }
const ZOOM_SPRING  = { type: 'spring', stiffness: 75, damping: 24, mass: 0.95 }
const RESET_SPRING = { type: 'spring', stiffness: 90, damping: 28, mass: 0.9 }

// Photo-Viewer Defaults
// „Wie ein Bild ranzoomen, nicht reinscrollen":
// - Sanfter Zoom (1.45x) — das ganze Bild wird größer
// - Nur sehr leichtes Pan in Richtung Agent (25%) — Nachbarn bleiben rundum sichtbar
// - Shift nach links damit Detail-Panel den Fokuspunkt nicht verdeckt
const DEFAULT_ZOOM    = 1.45
const PAN_FRACTION    = 0.25
const PANEL_OFFSET_X  = -140

export function useCamera() {
  const x    = useMotionValue(0)
  const y    = useMotionValue(0)
  const zoom = useMotionValue(1)
  const parallaxFg = useMotionValue(0)
  const parallaxBg = useMotionValue(0)
  const lastFocus = useRef(null)

  const focusAgent = useCallback((agentId, targetZoom = DEFAULT_ZOOM) => {
    const pos = AGENT_POSITIONS[agentId]
    if (!pos) return
    const { x: sx, y: sy } = gridToScreen(pos.gx, pos.gy)

    // Statt voll auf die Position zu zentrieren: nur einen Teil des Weges (PAN_FRACTION).
    // Das bewahrt die Wahrnehmung „das ganze Bild wird größer".
    // Plus: leichter Offset nach links (PANEL_OFFSET_X) damit der Agent nicht vom
    // Detail-Panel rechts verdeckt wird.
    const dx = -(sx - CX) * targetZoom * PAN_FRACTION + PANEL_OFFSET_X
    const dy = -(sy - CY) * targetZoom * PAN_FRACTION

    animate(x,    dx, PAN_SPRING)
    animate(y,    dy, PAN_SPRING)
    // Parallax leicht damit Layers sich nicht starr mitbewegen
    animate(parallaxFg, dx * 0.08, PAN_SPRING)
    animate(parallaxBg, dx * -0.05, PAN_SPRING)
    animate(zoom, targetZoom, { ...ZOOM_SPRING, delay: 0.05 })
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
