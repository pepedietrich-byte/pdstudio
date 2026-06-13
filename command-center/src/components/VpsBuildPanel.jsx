import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, ExternalLink, Loader2, CheckCircle2, AlertCircle, Server } from 'lucide-react'
import { triggerVpsBuild, updateBuildMetadata } from '../lib/n8n'
import { markSiteFresh } from '../lib/sites'

// Build-Style Optionen (Pepe wählt im UI)
const STYLES = [
  { id: 'restaurant-premium', label: 'Restaurant · Premium',   desc: 'Klassisch elegant, drenched Farben, dunkle Surfaces' },
  { id: 'cafe-warm',          label: 'Café · Warm',             desc: 'Helle warme Töne, Vintage, einladend' },
  { id: 'bar-dark',           label: 'Bar · Dark Luxury',       desc: 'Tiefe Töne, Gold, Cocktailbar-Atmosphäre' },
  { id: 'bistro-modern',      label: 'Bistro · Modern',         desc: 'Clean, Sans-Serif, viel Whitespace' },
]

const COLOR_DIRECTIONS = [
  { id: 'auto',          label: 'Auto (passend zum Style)' },
  { id: 'drenched-warm', label: 'Drenched · Warm Erdfarben' },
  { id: 'drenched-cool', label: 'Drenched · Tiefer Blau-Ton' },
  { id: 'gold-dark',     label: 'Gold + Tiefes Schwarz' },
  { id: 'cinnabar',      label: 'Cinnabar (wie Project Napoli)' },
  { id: 'cream-soft',    label: 'Creme + Soft Pastel' },
]

export default function VpsBuildPanel({ lead }) {
  const [open, setOpen]   = useState(false)
  const [state, setState] = useState('idle') // idle | building | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [opts, setOpts]   = useState({
    style: 'restaurant-premium',
    colorDirection: 'auto',
    quality: 'premium',
  })

  async function build() {
    if (state === 'building') return
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerVpsBuild(lead, opts)
      setResult(r)
      setState(r.deploy_status === 'success' ? 'done' : 'error')
      if (r.deploy_status === 'success' && r.demo_url) {
        markSiteFresh(lead.lead_id, r.demo_url)
        // Persist metadata into BUILD sheet so the site survives reload
        try {
          await updateBuildMetadata(lead.lead_id, {
            demo_url:      r.demo_url,
            build_status:  r.build_status,
            deploy_status: r.deploy_status,
            site_dir:      r.site_dir || `sites/${lead.lead_id}`,
            run_id:        r.run_id,
            source:        'a2-vps-builder',
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div style={{ color: '#9b6ef3' }}><Server size={20} /></div>
          <div>
            <div className="text-base font-semibold" style={{ color: '#e8edf4' }}>VPS Builder · Agent 2</div>
            <div className="text-xs" style={{ color: '#6b7a90' }}>Autonomer Build auf Hostinger VPS · Claude Code → Vercel</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ background: 'rgba(155,110,243,0.12)', color: '#c5a5ff' }}
        >
          {open ? 'Optionen ausblenden' : 'Optionen ▾'}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-xs block mb-2" style={{ color: '#6b7a90', letterSpacing: '0.12em' }}>STYLE</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setOpts(o => ({ ...o, style: s.id }))}
                      className="text-left p-3 rounded transition-all"
                      style={{
                        background: opts.style === s.id ? 'rgba(155,110,243,0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${opts.style === s.id ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: '#e8edf4' }}>{s.label}</div>
                      <div className="text-xs mt-1" style={{ color: '#6b7a90' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs block mb-2" style={{ color: '#6b7a90', letterSpacing: '0.12em' }}>FARB-DIRECTION</label>
                <select
                  value={opts.colorDirection}
                  onChange={e => setOpts(o => ({ ...o, colorDirection: e.target.value }))}
                  className="w-full p-2 rounded text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8edf4' }}
                >
                  {COLOR_DIRECTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs block mb-2" style={{ color: '#6b7a90', letterSpacing: '0.12em' }}>QUALITÄT</label>
                <div className="flex gap-2">
                  {['standard', 'premium'].map(q => (
                    <button
                      key={q}
                      onClick={() => setOpts(o => ({ ...o, quality: q }))}
                      className="flex-1 py-2 rounded text-sm font-medium transition-all"
                      style={{
                        background: opts.quality === q ? 'rgba(155,110,243,0.18)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${opts.quality === q ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        color: opts.quality === q ? '#c5a5ff' : '#6b7a90',
                      }}
                    >
                      {q === 'premium' ? 'Premium (volle Qualität)' : 'Standard (schneller)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={build}
        disabled={state === 'building'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded font-medium transition-all"
        style={{
          background: state === 'building' ? 'rgba(155,110,243,0.15)' : 'linear-gradient(135deg, #9b6ef3, #7a4fd5)',
          color: state === 'building' ? '#c5a5ff' : '#fff',
          opacity: state === 'building' ? 0.7 : 1,
          cursor: state === 'building' ? 'not-allowed' : 'pointer',
        }}
      >
        {state === 'building' && <Loader2 size={18} className="animate-spin" />}
        {state !== 'building' && <Rocket size={18} />}
        {state === 'building' ? 'Build läuft auf VPS...' : 'Build & Deploy auf VPS'}
      </button>

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
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: '#9ca3b5' }}>
              <div>Build: <span style={{ color: '#e8edf4' }}>{result.build_status}</span></div>
              <div>Deploy: <span style={{ color: '#e8edf4' }}>{result.deploy_status}</span></div>
              <div>Run-ID: <span style={{ color: '#e8edf4', fontFamily: 'monospace' }}>{result.run_id}</span></div>
              <div>Dauer: <span style={{ color: '#e8edf4' }}>{result.duration_s}s</span></div>
            </div>
            {result.demo_url && (
              <a
                href={result.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm font-medium"
                style={{ color: '#39ff88' }}
              >
                <ExternalLink size={14} />
                {result.demo_url}
              </a>
            )}
            {error && <div className="mt-2 text-xs" style={{ color: '#ef4444' }}>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'idle' && (
        <div className="mt-3 text-xs" style={{ color: '#6b7a90' }}>
          Der Runner pullt das Repo, lässt Claude Code die Site bauen, baut npm, committet und deployt auf Vercel — komplett autonom.
          Erwartete Dauer: 1-3 Min ohne Claude · 5-10 Min mit Claude-Generierung.
        </div>
      )}
    </motion.div>
  )
}
