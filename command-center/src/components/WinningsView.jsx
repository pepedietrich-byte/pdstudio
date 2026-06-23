import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Trophy, Target, TrendingUp, Calendar, Minus, Plus, RotateCcw, Coins } from 'lucide-react'

const EASE = [0.23, 1, 0.32, 1]
const STORE_KEY = 'pdstudio_winnings_v1'

const DEFAULTS = {
  closed: 0,       // bereits abgeschlossene Standorte
  price: 40,       // € pro Standort / Monat
  goal: 227,       // Ziel-Standorte (Gesamtmarkt)
  growth: 4,       // neue Standorte / Monat (Annahme)
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
    return { ...DEFAULTS, ...raw }
  } catch { return { ...DEFAULTS } }
}

function eur(n) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

// Animierte Zahl (zählt weich hoch/runter)
function AnimNum({ value, format = v => Math.round(v).toString(), color, size = 28 }) {
  const spring  = useSpring(value, { stiffness: 70, damping: 22 })
  const display = useTransform(spring, v => format(v))
  const prev    = useRef(value)
  useEffect(() => {
    if (value !== prev.current) { spring.set(value); prev.current = value }
  }, [value, spring])
  return (
    <motion.span style={{ color, fontSize: size, fontFamily: 'var(--font-mono,monospace)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  )
}

function BigStat({ label, sub, value, color, format }) {
  return (
    <motion.div
      className="relative flex flex-col gap-2 px-4 pt-4 pb-4 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}0c 0%, ${color}03 100%)`,
        border: `1px solid ${color}28`,
        borderRadius: 10,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      <div className="absolute top-2.5 right-3 font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {sub}
      </div>
      <div className="leading-none mt-1">
        <AnimNum value={value} color={color} format={format} size={30} />
      </div>
      <div className="font-mono text-[10px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </div>
      <motion.div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }} />
    </motion.div>
  )
}

// Stepper-Eingabe (Touch-freundlich fürs Handy)
function Stepper({ label, value, onChange, min = 0, max = 9999, step = 1, suffix = '' }) {
  function set(v) { onChange(Math.max(min, Math.min(max, v))) }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <div className="flex items-stretch rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <button onClick={() => set(value - step)}
          className="w-9 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
          <Minus size={13} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 px-2" style={{ background: 'var(--bg-card)' }}>
          <input
            type="number"
            value={value}
            onChange={e => set(Number(e.target.value))}
            className="w-full bg-transparent text-center font-mono font-bold tabular-nums outline-none"
            style={{ color: 'var(--text-hi)', fontSize: 16 }}
          />
          {suffix && <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>{suffix}</span>}
        </div>
        <button onClick={() => set(value + step)}
          className="w-9 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

export default function WinningsView() {
  const [state, setState] = useState(load)
  const { closed, price, goal, growth } = state
  const set = (patch) => setState(s => ({ ...s, ...patch }))

  // Auto-Persist: jede Änderung wird sofort gespeichert
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch { /* noop */ }
  }, [state])

  // Auto-Sync: live aktualisieren wenn sich die Daten in einem anderen
  // Tab / Fenster ändern (z.B. Desktop + Handy gleichzeitig offen)
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORE_KEY || !e.newValue) return
      try {
        const next = { ...DEFAULTS, ...JSON.parse(e.newValue) }
        setState(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      } catch { /* noop */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const safeClosed = Math.min(closed, goal)
  const pct        = goal > 0 ? Math.min(100, (safeClosed / goal) * 100) : 0

  const mrr        = safeClosed * price            // aktueller monatlicher Umsatz
  const arr        = mrr * 12                       // aktueller Jahresumsatz
  const potMrr     = goal * price                   // Potenzial bei vollem Markt
  const potArr     = potMrr * 12
  const remaining  = (goal - safeClosed) * price    // verbleibendes monatliches Potenzial

  // Wachstums-Projektion: wann ist das Ziel erreicht?
  const monthsToGoal = growth > 0 ? Math.ceil((goal - safeClosed) / growth) : Infinity
  const goalDate = useMemo(() => {
    if (!isFinite(monthsToGoal)) return null
    const d = new Date()
    d.setMonth(d.getMonth() + monthsToGoal)
    return d
  }, [monthsToGoal])

  // Meilensteine — psychologische Etappenziele
  const milestones = useMemo(() => {
    const base = [10, 25, 50, 100, 150, goal].filter((v, i, a) => v <= goal && a.indexOf(v) === i)
    return base.map(m => ({ count: m, mrr: m * price, reached: safeClosed >= m }))
  }, [goal, price, safeClosed])

  const nextMilestone = milestones.find(m => !m.reached)

  // 227-Punkte-Raster: jeder Punkt = ein Standort
  const dots = useMemo(() => Array.from({ length: goal }, (_, i) => i < safeClosed), [goal, safeClosed])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(45,219,114,0.12)', border: '1px solid rgba(45,219,114,0.3)' }}>
          <Coins size={14} style={{ color: '#2ddb72' }} />
        </div>
        <div className="flex-1">
          <h2 className="font-ui font-semibold text-base tracking-tight" style={{ color: 'var(--text-hi)' }}>
            Gewinn-Rechner
          </h2>
          <p className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {goal} Standorte · {eur(price)} / Monat pro Standort
          </p>
        </div>
        <button
          onClick={() => setState({ ...DEFAULTS })}
          title="Zurücksetzen"
          className="flex items-center gap-1.5 px-2.5 h-8 rounded font-mono text-[10px] transition-colors"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}>
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Große Zahlen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <BigStat label="MRR aktuell"     sub="/Monat"  value={mrr}       color="#2ddb72" format={eur} />
        <BigStat label="ARR aktuell"     sub="/Jahr"   value={arr}       color="#00d4ff" format={eur} />
        <BigStat label="Voll-Potenzial"  sub="MRR max" value={potMrr}    color="#9b6ef3" format={eur} />
        <BigStat label="Noch offen"      sub="/Monat"  value={remaining} color="#f5a623" format={eur} />
      </div>

      {/* Fortschritt */}
      <div className="px-4 py-4 rounded-xl" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <div className="flex items-end justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Target size={12} style={{ color: '#2ddb72' }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>FORTSCHRITT</span>
          </div>
          <div className="font-mono tabular-nums" style={{ color: 'var(--text-hi)' }}>
            <span className="font-black text-lg" style={{ color: '#2ddb72' }}>{safeClosed}</span>
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}> / {goal}</span>
            <span className="text-xs ml-2" style={{ color: '#2ddb72' }}>{pct.toFixed(1)}%</span>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2ddb72, #00d4ff)' }}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: EASE }} />
        </div>
        {nextMilestone && (
          <p className="font-mono text-[10px] mt-2.5" style={{ color: 'var(--text-dim)' }}>
            Nächstes Ziel: <span style={{ color: 'var(--text-hi)' }}>{nextMilestone.count} Standorte</span>
            {' '}= <span style={{ color: '#2ddb72' }}>{eur(nextMilestone.mrr)}/Monat</span>
            {' '}· noch <span style={{ color: '#f5a623' }}>{nextMilestone.count - safeClosed}</span> zu schließen
          </p>
        )}
      </div>

      {/* 227-Punkte-Raster — jeder Punkt ein Standort */}
      <div className="px-4 py-4 rounded-xl" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>DER MARKT</span>
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
            ({safeClosed} gewonnen · {goal - safeClosed} offen)
          </span>
        </div>
        <div className="flex flex-wrap gap-[3px]">
          {dots.map((on, i) => (
            <motion.div
              key={i}
              title={`Standort ${i + 1}${on ? ' · gewonnen' : ''}`}
              initial={false}
              animate={{
                backgroundColor: on ? '#2ddb72' : 'rgba(255,255,255,0.06)',
                boxShadow: on ? '0 0 6px rgba(45,219,114,0.5)' : 'none',
                scale: on ? 1 : 0.85,
              }}
              transition={{ duration: 0.3, delay: on ? Math.min(i, safeClosed) * 0.004 : 0, ease: EASE }}
              style={{ width: 9, height: 9, borderRadius: 2 }}
            />
          ))}
        </div>
      </div>

      {/* Steuerung */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-4 rounded-xl"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <Stepper label="GESCHLOSSEN"      value={closed} onChange={v => set({ closed: v })} min={0} max={goal} />
        <Stepper label="PREIS / STANDORT" value={price}  onChange={v => set({ price: v })}  min={0} max={9999} suffix="€" />
        <Stepper label="ZIEL-STANDORTE"   value={goal}   onChange={v => set({ goal: v })}   min={1} max={5000} />
        <Stepper label="NEU / MONAT"       value={growth} onChange={v => set({ growth: v })} min={0} max={500} />
      </div>

      {/* Wachstums-Projektion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06), transparent)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <Calendar size={18} style={{ color: '#00d4ff' }} className="flex-shrink-0" />
          <div>
            <div className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>ZIEL ERREICHT IN</div>
            {isFinite(monthsToGoal) ? (
              <div className="font-ui" style={{ color: 'var(--text-hi)' }}>
                <span className="font-black text-lg" style={{ color: '#00d4ff' }}>{monthsToGoal}</span>
                <span className="text-sm"> Monaten</span>
                {goalDate && (
                  <span className="font-mono text-[10px] ml-2" style={{ color: 'var(--text-dim)' }}>
                    ~ {goalDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            ) : (
              <div className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>Wachstum &gt; 0 setzen</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(155,110,243,0.06), transparent)', border: '1px solid rgba(155,110,243,0.2)' }}>
          <TrendingUp size={18} style={{ color: '#9b6ef3' }} className="flex-shrink-0" />
          <div>
            <div className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>VOLL-POTENZIAL / JAHR</div>
            <div className="font-ui" style={{ color: 'var(--text-hi)' }}>
              <span className="font-black text-lg" style={{ color: '#9b6ef3' }}>{eur(potArr)}</span>
              <span className="font-mono text-[10px] ml-2" style={{ color: 'var(--text-dim)' }}>bei {goal} Standorten</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meilensteine */}
      <div className="px-4 py-4 rounded-xl" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={12} style={{ color: '#f5a623' }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>MEILENSTEINE</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {milestones.map(m => (
            <div key={m.count}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
              style={{
                background: m.reached ? 'rgba(45,219,114,0.06)' : 'transparent',
                border: `1px solid ${m.reached ? 'rgba(45,219,114,0.2)' : 'var(--border-dim)'}`,
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: m.reached ? '#2ddb72' : 'rgba(255,255,255,0.05)',
                  color: m.reached ? '#06110a' : 'var(--text-dim)',
                }}>
                {m.reached ? <Trophy size={10} /> : <span className="font-mono text-[9px]">{m.count}</span>}
              </div>
              <span className="font-ui text-sm flex-1" style={{ color: m.reached ? 'var(--text-hi)' : 'var(--text)' }}>
                {m.count} Standorte
              </span>
              <span className="font-mono text-xs font-bold tabular-nums"
                style={{ color: m.reached ? '#2ddb72' : 'var(--text-dim)' }}>
                {eur(m.mrr)}<span className="text-[9px] font-normal">/Mon</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
