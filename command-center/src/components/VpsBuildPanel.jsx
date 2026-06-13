import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ExternalLink, Loader2, CheckCircle2, AlertCircle,
  Server, ChevronRight, Sparkles, Info,
} from 'lucide-react'
import { triggerVpsBuild, updateBuildMetadata } from '../lib/n8n'
import { markSiteFresh } from '../lib/sites'
import { BUILD_STYLES, STYLE_ORDER, recommendStyle, getStylePromptBlock } from '../lib/buildStyles'

// ─── Style Card ──────────────────────────────────────────────────────────────
function StyleCard({ style, selected, recommended, onSelect }) {
  return (
    <button
      onClick={() => onSelect(style.id)}
      className="text-left rounded-lg overflow-hidden transition-all relative"
      style={{
        background: selected ? 'rgba(155,110,243,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(155,110,243,0.6)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected ? '0 0 24px rgba(155,110,243,0.18)' : 'none',
      }}
    >
      {/* Color preview bar */}
      <div
        className="h-16 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${style.color_primary} 0%, ${style.color_accent} 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)',
          }} />
        {selected && (
          <div className="absolute top-2 right-2 rounded-full p-0.5"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <CheckCircle2 size={14} style={{ color: '#fff' }} />
          </div>
        )}
        {recommended && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            empfohlen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-bold" style={{ color: '#e8edf4' }}>{style.name}</span>
          <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: '#6b7a90' }}>
            {style.fonts[0].split(' ')[0]}
          </span>
        </div>
        <div className="text-[10px] italic mb-2" style={{ color: '#9b6ef3' }}>{style.tagline}</div>
        <div className="text-[10px] leading-relaxed" style={{ color: '#9ca3b5' }}>{style.description}</div>
        <div className="text-[9px] mt-2 font-mono" style={{ color: '#6b7a90' }}>
          {style.image_slots.length} Image-Slots · Pflicht
        </div>
      </div>
    </button>
  )
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
export default function VpsBuildPanel({ lead }) {
  const recommended = useMemo(() => recommendStyle(lead?.cuisine || ''), [lead])
  const [styleId, setStyleId]   = useState(recommended)
  const [quality, setQuality]   = useState('premium')
  const [reservationMode, setReservationMode] = useState(
    /bar|cocktail|brunch|café|cafe/i.test(lead?.cuisine || '') ? 'contact' :
    /lieferando|wolt|delivery/i.test(lead?.website_url || '') ? 'ordering' :
    'reservation'
  )

  const [state, setState]   = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  async function build() {
    if (state === 'building') return
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerVpsBuild(lead, {
        style: styleId,
        colorDirection: BUILD_STYLES[styleId].palette_brief.split(/[.,]/)[0],
        quality,
        reservation_mode: reservationMode,
        style_prompt: getStylePromptBlock(styleId),
      })
      setResult(r)
      setState(r.deploy_status === 'success' ? 'done' : 'error')
      if (r.deploy_status === 'success' && r.demo_url) {
        markSiteFresh(lead.lead_id, r.demo_url)
        try {
          await updateBuildMetadata(lead.lead_id, {
            demo_url:      r.demo_url,
            build_status:  r.build_status,
            deploy_status: r.deploy_status,
            site_dir:      r.site_dir || `sites/${lead.lead_id}`,
            run_id:        r.run_id,
            source:        `a2-vps-${styleId}`,
            kind:          'build',
          })
        } catch (e) { console.warn('BUILD meta persist failed', e) }
      }
      if (r.deploy_status !== 'success' && !error) setError(r.error || 'Deploy fehlgeschlagen')
    } catch (e) {
      setState('error'); setError(e.message)
    }
  }

  return (
    <motion.div
      className="relative rounded-lg p-5"
      style={{
        background: 'rgba(155,110,243,0.05)',
        border: '1px solid rgba(155,110,243,0.35)',
        boxShadow: '0 0 36px rgba(155,110,243,0.08)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div style={{ color: '#9b6ef3' }}><Server size={22} /></div>
          <div>
            <div className="text-base font-semibold" style={{ color: '#e8edf4' }}>VPS Builder · Agent 2</div>
            <div className="text-xs" style={{ color: '#6b7a90' }}>
              5 Design-Varianten · Autonom auf Hostinger VPS · Claude Code → Vercel
            </div>
          </div>
        </div>
      </div>

      {/* Style Picker — 5 Cards */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>
            Design-Variante
          </label>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#9ca3b5' }}>
            <Info size={10} />
            Empfohlen für „{lead?.cuisine || '—'}": <span style={{ color: '#9b6ef3', fontWeight: 600 }}>{BUILD_STYLES[recommended].name}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STYLE_ORDER.map(id => (
            <StyleCard
              key={id}
              style={BUILD_STYLES[id]}
              selected={styleId === id}
              recommended={id === recommended}
              onSelect={setStyleId}
            />
          ))}
        </div>
      </div>

      {/* Other options */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="text-[10px] uppercase tracking-widest mb-2 block" style={{ color: '#6b7a90' }}>Reservierungs-Logik</label>
          <div className="flex gap-1">
            {[
              { id: 'reservation', label: 'Tisch', desc: 'Reservierung als CTA' },
              { id: 'ordering',    label: 'Bestellen', desc: 'Lieferando/Wolt' },
              { id: 'contact',     label: 'Anfrage', desc: 'Kontakt-Form' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setReservationMode(opt.id)}
                className="flex-1 py-2 rounded text-[11px] font-medium"
                title={opt.desc}
                style={{
                  background: reservationMode === opt.id ? 'rgba(155,110,243,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${reservationMode === opt.id ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: reservationMode === opt.id ? '#c5a5ff' : '#9ca3b5',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest mb-2 block" style={{ color: '#6b7a90' }}>Qualitäts-Niveau</label>
          <div className="flex gap-1">
            {[
              { id: 'standard', label: 'Standard',  desc: '~5 Min, kürzerer Build' },
              { id: 'premium',  label: 'Premium',   desc: '~10 Min, volle Tiefe' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setQuality(opt.id)}
                className="flex-1 py-2 rounded text-[11px] font-medium"
                title={opt.desc}
                style={{
                  background: quality === opt.id ? 'rgba(155,110,243,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${quality === opt.id ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: quality === opt.id ? '#c5a5ff' : '#9ca3b5',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Build button */}
      <button
        onClick={build}
        disabled={state === 'building' || !lead?.lead_id}
        className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold transition-all"
        style={{
          background: state === 'building'
            ? 'rgba(155,110,243,0.15)'
            : `linear-gradient(135deg, ${BUILD_STYLES[styleId].color_primary}, ${BUILD_STYLES[styleId].color_accent})`,
          color: '#fff',
          opacity: (state === 'building' || !lead?.lead_id) ? 0.5 : 1,
          cursor: (state === 'building' || !lead?.lead_id) ? 'not-allowed' : 'pointer',
        }}
      >
        {state === 'building' && <Loader2 size={18} className="animate-spin" />}
        {state !== 'building' && <Rocket size={18} />}
        {state === 'building' ? 'Build läuft auf VPS...' : `Build "${BUILD_STYLES[styleId].name}" auf VPS`}
        <ChevronRight size={16} style={{ opacity: 0.6 }} />
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded text-sm"
            style={{
              background: state === 'done' ? 'rgba(57,255,136,0.06)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${state === 'done' ? 'rgba(57,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: state === 'done' ? '#39ff88' : '#ef4444' }}>
              {state === 'done' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span className="font-medium">
                {state === 'done' ? 'Live deployed' : 'Build/Deploy fehlgeschlagen'}
                {' · '}
                <span style={{ color: '#9b6ef3' }}>{BUILD_STYLES[styleId].name}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: '#9ca3b5' }}>
              <div>Build: <span style={{ color: '#e8edf4' }}>{result.build_status}</span></div>
              <div>Deploy: <span style={{ color: '#e8edf4' }}>{result.deploy_status}</span></div>
              <div>Run-ID: <span style={{ color: '#e8edf4', fontFamily: 'monospace' }}>{result.run_id}</span></div>
              <div>Dauer: <span style={{ color: '#e8edf4' }}>{result.duration_s}s</span></div>
            </div>
            {result.demo_url && (
              <a href={result.demo_url} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm font-medium"
                style={{ color: '#39ff88' }}>
                <ExternalLink size={14} />
                {result.demo_url}
              </a>
            )}
            {error && <div className="mt-2 text-xs" style={{ color: '#ef4444' }}>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'idle' && (
        <div className="mt-3 flex items-start gap-2 text-xs" style={{ color: '#6b7a90' }}>
          <Sparkles size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#9b6ef3' }} />
          <span>
            Jede Variante hat <strong>pflicht-Bildslots</strong> — keine leeren Container mehr.
            Skills: taste-skill · emil-kowalski · impeccable.
            Erwartete Dauer: 5–10 Min mit Claude Code auf VPS.
          </span>
        </div>
      )}
    </motion.div>
  )
}
