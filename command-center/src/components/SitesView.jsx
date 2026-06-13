import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ExternalLink, Clock, Zap, Rocket, Image } from 'lucide-react'
import { getLeadStage } from '../lib/sheets'
import { triggerWebsiteBuild, triggerBuild } from '../lib/n8n'

const EASE = [0.23, 1, 0.32, 1]
const STAGE_LABELS = ['', 'LEAD', 'TEXT', 'IMG', 'VALID', 'CONCEPT', 'BUILD', 'LIVE']
const STAGE_COLORS = ['', '#00d4ff', '#e8197f', '#2ddb72', '#f5a623', '#9b6ef3', '#00d4ff', '#e8197f']

function scoreColor(n) {
  if (n >= 60) return '#2ddb72'
  if (n >= 40) return '#f5a623'
  return '#f03a3a'
}

export default function SitesView({ leads = [] }) {
  const sites = leads.filter(l => {
    const url = l.build?.demo_url || ''
    return url && !url.startsWith('/files') && /^https?:\/\//.test(url)
  })

  const buildable = leads.filter(l => {
    const stage = getLeadStage(l)
    return stage >= 1 && stage < 7
  })

  return (
    <div className="space-y-4">
      <LiveSites sites={sites} />
      {buildable.length > 0 && <BuildQueue leads={buildable} />}
    </div>
  )
}

function LiveSites({ sites }) {
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Globe size={11} style={{ color: '#e8197f', opacity: 0.8 }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
          DEPLOYED SITES
        </span>
        <span className="font-mono text-[10px] ml-1" style={{ color: 'var(--text-dim)' }}>({sites.length})</span>
      </div>

      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Globe size={20} style={{ color: 'var(--text-dim)', opacity: 0.3 }} />
          <div className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>Keine Sites gebaut</div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            URL eingeben und Pipeline starten
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          <AnimatePresence initial={false}>
            {sites.map((lead, i) => (
              <SiteCard key={lead.lead_id} lead={lead} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function SiteCard({ lead, index }) {
  const score   = +lead.score || 0
  const sc      = scoreColor(score)
  const demoUrl = lead.build?.demo_url || ''
  const builtAt = lead.build?.website_built_at || ''
  const heroUrl = lead.images?.hero_url || ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, delay: index * 0.04, ease: EASE }}
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Hero image / placeholder */}
      <div className="relative" style={{ aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)' }}>
        {heroUrl ? (
          <img src={heroUrl} alt={lead.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image size={24} style={{ color: 'rgba(255,255,255,0.1)' }} />
          </div>
        )}
        {/* Live badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8197f' }}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <span className="font-mono text-[9px]" style={{ color: '#e8197f' }}>LIVE</span>
        </div>
        {/* Score badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold"
          style={{ background: 'rgba(0,0,0,0.7)', color: sc, backdropFilter: 'blur(8px)' }}>
          {score}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="font-ui text-sm font-medium truncate mb-0.5" style={{ color: 'var(--text-hi)' }}>
          {lead.name || lead.lead_id}
        </div>
        {builtAt && (
          <div className="flex items-center gap-1 mb-2" style={{ color: 'var(--text-dim)' }}>
            <Clock size={8} />
            <span className="font-mono text-[9px]">
              {new Date(builtAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          </div>
        )}
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded font-mono text-xs font-bold transition-all"
          style={{
            background: 'rgba(232,25,127,0.1)',
            color: '#e8197f',
            border: '1px solid rgba(232,25,127,0.25)',
          }}
        >
          <ExternalLink size={10} />
          SITE ÖFFNEN
        </a>
      </div>
    </motion.div>
  )
}

function BuildQueue({ leads }) {
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Clock size={11} style={{ color: 'var(--text-dim)' }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
          IN PIPELINE
        </span>
        <span className="font-mono text-[10px] ml-1" style={{ color: 'var(--text-dim)' }}>({leads.length})</span>
      </div>
      <div className="p-1">
        {leads.slice(0, 12).map((lead, i) => (
          <BuildRow key={lead.lead_id || i} lead={lead} index={i} />
        ))}
        {leads.length > 12 && (
          <div className="text-center py-2 font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            +{leads.length - 12} weitere
          </div>
        )}
      </div>
    </div>
  )
}

function BuildRow({ lead, index }) {
  const [building, setBuilding] = useState(false)
  const [done,     setDone]     = useState(false)
  const [err,      setErr]      = useState('')

  const stage      = getLeadStage(lead)
  const score      = +lead.score || 0
  const sc         = scoreColor(score)
  const stageColor = STAGE_COLORS[stage] || 'var(--text-dim)'
  const stageLabel = STAGE_LABELS[stage] || ''
  const canBuild   = stage >= 5

  async function build() {
    setBuilding(true); setErr('')
    try {
      if (stage >= 6) await triggerWebsiteBuild(lead.lead_id)
      else            await triggerBuild(lead.lead_id)
      setDone(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBuilding(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.14, ease: EASE }}
      className="flex items-center gap-3 px-3 py-2 rounded"
      whileHover={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: `${stageColor}50` }} />

      <span className="flex-1 font-ui text-sm truncate" style={{ color: 'var(--text)' }}>
        {lead.name || lead.lead_id}
      </span>

      <span className="font-mono text-xs font-bold tabular-nums flex-shrink-0" style={{ color: sc }}>
        {score || '—'}
      </span>

      {stageLabel && (
        <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded"
          style={{ color: stageColor, background: `${stageColor}10`, border: `1px solid ${stageColor}20` }}>
          A{stage}
        </span>
      )}

      {err ? (
        <span className="font-mono text-[10px] flex-shrink-0" style={{ color: '#f03a3a' }}>ERROR</span>
      ) : done ? (
        <span className="font-mono text-[10px] flex-shrink-0" style={{ color: '#2ddb72' }}>STARTED ✓</span>
      ) : canBuild ? (
        <motion.button
          onClick={build}
          disabled={building}
          className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-bold flex-shrink-0 transition-colors"
          style={{
            background: building ? 'rgba(45,219,114,0.05)' : 'rgba(45,219,114,0.1)',
            color: '#2ddb72',
            border: '1px solid rgba(45,219,114,0.25)',
            cursor: building ? 'not-allowed' : 'pointer',
          }}
          whileTap={!building ? { scale: 0.95 } : {}}
        >
          {building ? (
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
              <Zap size={8} />
            </motion.span>
          ) : stage >= 6 ? (
            <><Zap size={8} /> A7</>
          ) : (
            <><Rocket size={8} /> BUILD</>
          )}
        </motion.button>
      ) : (
        <span className="font-mono text-[10px] flex-shrink-0" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>
          warten
        </span>
      )}
    </motion.div>
  )
}
