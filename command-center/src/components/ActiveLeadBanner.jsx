import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, ChevronRight, X, Zap, ChevronDown, ChevronUp,
  DollarSign, FileText, Shield, Rocket, Search,
} from 'lucide-react'
import { getLeadStage } from '../lib/sheets'
import { AGENTS } from '../lib/agents'
import { JOB_STATUS } from '../lib/status'

const EASE = [0.23, 1, 0.32, 1]

const STAGE_LABELS = ['', 'LEAD', 'TEXT', 'IMG', 'VALID', 'CONCEPT', 'BUILD', 'LIVE']
const STAGE_COLORS = ['', '#00d4ff', '#e8197f', '#2ddb72', '#f5a623', '#9b6ef3', '#00d4ff', '#e8197f']

function scoreColor(n) {
  if (n >= 60) return '#2ddb72'
  if (n >= 40) return '#f5a623'
  return '#ff3b3b'
}

const AGENT_ICONS = {
  1: <Search size={9} />,
  2: <Rocket size={9} />,
  3: <Zap size={9} />,
  4: <FileText size={9} />,
  5: <DollarSign size={9} />,
  6: <Shield size={9} />,
}

export default function ActiveLeadBanner({ lead, onOpenDetail, onClear, onOpenLeads }) {
  const [expanded, setExpanded] = useState(false)

  const stage      = lead ? getLeadStage(lead) : 0
  const score      = lead ? (+lead.score || 0) : 0
  const stageColor = STAGE_COLORS[stage] || 'var(--text-dim)'
  const sc         = scoreColor(score)

  const hasDemo = !!(lead?.build?.demo_url && /^https?:\/\//.test(lead.build.demo_url))

  if (!lead) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4"
      >
        <motion.button
          onClick={onOpenLeads}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 10,
          }}
          whileHover={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155,110,243,0.3)' }}
          transition={{ duration: 0.15 }}
        >
          <Target size={12} style={{ color: 'rgba(155,110,243,0.5)', flexShrink: 0 }} />
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            Kein aktiver Lead — Lead auswählen um Agenten zu starten
          </span>
          <ChevronRight size={10} style={{ color: 'var(--text-dim)', marginLeft: 'auto' }} />
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(155,110,243,0.08) 0%, rgba(0,212,255,0.04) 100%)',
        border: '1px solid rgba(155,110,243,0.28)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Top pulse line */}
      <motion.div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(155,110,243,0.6), rgba(0,212,255,0.4), transparent)' }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Main row */}
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Pulse + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: '#9b6ef3' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="font-mono text-[9px] tracking-widest hidden md:block" style={{ color: 'rgba(155,110,243,0.8)' }}>
            AKTIV
          </span>
        </div>

        <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Score + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="font-mono font-black tabular-nums text-lg flex-shrink-0" style={{ color: sc }}>
            {score || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-ui font-semibold text-sm truncate" style={{ color: 'var(--text-hi)' }}>
              {lead.name || lead.lead_id || 'Unbekanntes Lokal'}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {lead.website && (
                <span className="font-mono text-[9px] truncate hidden md:block" style={{ color: 'var(--text-dim)' }}>
                  {lead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 28)}
                </span>
              )}
              <span
                className="font-mono text-[9px] px-1.5 py-0 rounded flex-shrink-0"
                style={{ color: stageColor, background: `${stageColor}12`, border: `1px solid ${stageColor}25` }}
              >
                {STAGE_LABELS[stage] || `A${stage}`}
              </span>
              {hasDemo && (
                <span className="font-mono text-[9px] px-1.5 py-0 rounded flex-shrink-0"
                  style={{ color: '#2ddb72', background: 'rgba(45,219,114,0.1)', border: '1px solid rgba(45,219,114,0.25)' }}>
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.button
            onClick={onOpenDetail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold"
            style={{ color: '#9b6ef3', background: 'rgba(155,110,243,0.1)', border: '1px solid rgba(155,110,243,0.3)' }}
            whileHover={{ scale: 1.03, background: 'rgba(155,110,243,0.16)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <Zap size={9} /> DETAIL
          </motion.button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}
            title="Agenten-Quickstart"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          <button
            onClick={onClear}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}
            title="Lead deselektieren"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Expanded: Agent quick-actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(155,110,243,0.15)' }}
          >
            <div className="px-4 py-3">
              <div className="font-mono text-[9px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                AGENTEN FÜR DIESEN LEAD — im Lead Detail starten
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(id => {
                  const agent = AGENTS[id]
                  const isReady = agent.webhookConfigured || agent.statusNote?.includes('Poe API') || agent.statusNote?.includes('Client-side')
                  return (
                    <motion.button
                      key={id}
                      onClick={onOpenDetail}
                      title={agent.role}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded text-center"
                      style={{
                        background: `${agent.color}08`,
                        border: `1px solid ${agent.color}${isReady ? '30' : '15'}`,
                        opacity: isReady ? 1 : 0.55,
                      }}
                      whileHover={{ scale: 1.04, background: `${agent.color}14` }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="flex items-center justify-center" style={{ color: agent.color }}>
                        {AGENT_ICONS[id]}
                      </div>
                      <span className="font-mono text-[8px] font-bold" style={{ color: agent.color }}>
                        {agent.glyph}
                      </span>
                      <span className="font-mono text-[8px] leading-tight text-center" style={{ color: 'var(--text-dim)' }}>
                        {agent.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                      {!isReady && (
                        <span className="font-mono text-[7px]" style={{ color: '#f5a623' }}>needs setup</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              <div className="mt-2 font-mono text-[9px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
                Klicke auf einen Agenten → öffnet Lead Detail mit dem entsprechenden Abschnitt
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
