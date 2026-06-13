import { motion } from 'framer-motion'
import { gridToScreen, AGENT_POSITIONS, TILE_W, TILE_H } from './useCamera'

// Render the iso floor: a grid of diamond tiles + 8 station platforms.
// All coordinates use the same projection as useCamera.

const FLOOR_RADIUS = 5   // grid cells from center

function diamondPath(cx, cy, w = TILE_W, h = TILE_H) {
  // Iso diamond centered on (cx,cy)
  return `M ${cx} ${cy - h/2} L ${cx + w/2} ${cy} L ${cx} ${cy + h/2} L ${cx - w/2} ${cy} Z`
}

// Build the underlying tile grid
function buildGridTiles() {
  const tiles = []
  for (let gx = -FLOOR_RADIUS; gx <= FLOOR_RADIUS; gx++) {
    for (let gy = -FLOOR_RADIUS; gy <= FLOOR_RADIUS; gy++) {
      const dist = Math.abs(gx) + Math.abs(gy)
      if (dist > FLOOR_RADIUS) continue   // diamond-shaped floor
      const { x, y } = gridToScreen(gx, gy)
      tiles.push({ key: `${gx},${gy}`, x, y, gx, gy, dist })
    }
  }
  return tiles
}

const TILES = buildGridTiles()

export default function IsometricGround() {
  return (
    <g>
      {/* Floor tiles */}
      <g opacity="0.45">
        {TILES.map(t => (
          <path
            key={t.key}
            d={diamondPath(t.x, t.y)}
            fill="none"
            stroke={`rgba(155, 110, 243, ${0.16 - t.dist * 0.022})`}
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Subtle glow on diagonals */}
      <g opacity="0.4">
        {[-FLOOR_RADIUS, 0, FLOOR_RADIUS].map(d => {
          const a = gridToScreen(-FLOOR_RADIUS, d)
          const b = gridToScreen(FLOOR_RADIUS, d)
          return (
            <line
              key={`gd-${d}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={d === 0 ? 'rgba(155,110,243,0.22)' : 'rgba(155,110,243,0.08)'}
              strokeWidth="1"
            />
          )
        })}
      </g>

      {/* Station platforms — outer ring */}
      {Object.entries(AGENT_POSITIONS).map(([id, { gx, gy }]) => {
        const isPepe = id === '8'
        const { x, y } = gridToScreen(gx, gy)
        const w = isPepe ? TILE_W * 1.45 : TILE_W * 1.05
        const h = isPepe ? TILE_H * 1.45 : TILE_H * 1.05
        const fill = isPepe ? 'rgba(255,215,0,0.10)' : 'rgba(155,110,243,0.08)'
        const stroke = isPepe ? 'rgba(255,215,0,0.45)' : 'rgba(155,110,243,0.35)'
        return (
          <g key={`platform-${id}`}>
            {/* Platform glow ground halo */}
            <motion.ellipse
              cx={x} cy={y + h/2 + 6}
              rx={w/2} ry={h/4}
              fill={isPepe ? 'rgba(255,215,0,0.10)' : 'rgba(155,110,243,0.10)'}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3 + (+id) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Platform top */}
            <path
              d={diamondPath(x, y, w, h)}
              fill={fill}
              stroke={stroke}
              strokeWidth={isPepe ? '1.4' : '1'}
            />
            {/* Platform inner highlight */}
            <path
              d={diamondPath(x, y, w * 0.78, h * 0.78)}
              fill="none"
              stroke={isPepe ? 'rgba(255,215,0,0.18)' : 'rgba(155,110,243,0.16)'}
              strokeWidth="0.8"
            />
          </g>
        )
      })}
    </g>
  )
}
