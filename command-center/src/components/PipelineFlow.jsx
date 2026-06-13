import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLeadStage } from '../lib/sheets'
import StatusBadge from './StatusBadge'

const STAGES = ['A1 Lead Scanner','A2 Text','A3 Images','A4 Validate','A5 Concept','A6 Build']
const STAGE_COLORS = ['#00e5ff','#ff2d9b','#39ff88','#ffb800','#a855f7','#00e5ff']

export default function PipelineFlow({ leads = [], onSelectLead }) {
  const [filter, setFilter] = useState('all')
  const [scoreMin, setScoreMin] = useState(0)

  const filtered = leads.filter(l => {
    if (filter !== 'all' && getLeadStage(l) !== +filter) return false
    if (+scoreMin > 0 && (+l.score || 0) < +scoreMin) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[9px] font-mono tracking-widest text-white/30">FILTER:</span>
        {['all','1','2','3','4','5','6'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-2.5 py-1 rounded font-mono text-[10px] tracking-wider transition-all"
            style={{
              background: filter === f ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#00e5ff' : '#6b6b8a',
              border: `1px solid ${filter === f ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {f === 'all' ? 'ALLE' : `A${f}`}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] font-mono text-white/30">MIN SCORE</span>
          <input
            type="number" value={scoreMin} onChange={e => setScoreMin(e.target.value)}
            className="w-16 bg-white/[0.04] border border-white/[0.1] rounded px-2 py-1 font-mono text-xs text-white/80 outline-none focus:border-cyan/50"
          />
        </div>
      </div>

      {/* Stage headers */}
      <div className="grid grid-cols-6 gap-1 mb-2">
        {STAGES.map((s, i) => (
          <div key={s} className="text-center">
            <div className="text-[9px] font-mono tracking-wider pb-1 border-b"
              style={{ color: STAGE_COLORS[i], borderColor: `${STAGE_COLORS[i]}33` }}>
              {s.toUpperCase()}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: STAGE_COLORS[i] }}>
              {leads.filter(l => getLeadStage(l) === i + 1).length}
            </div>
          </div>
        ))}
      </div>

      {/* Lead chips */}
      {filtered.length === 0 ? (
        <EmptyPipeline />
      ) : (
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filtered.map((lead, idx) => (
              <LeadRow key={lead.lead_id || idx} lead={lead} onClick={() => onSelectLead?.(lead)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function LeadRow({ lead, onClick }) {
  const stage    = getLeadStage(lead)
  const progress = (stage / 6) * 100
  const color    = STAGE_COLORS[stage - 1] ?? '#6b6b8a'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group"
    >
      {/* Lead name */}
      <div className="flex-1 min-w-0">
        <div className="font-ui text-sm text-white/90 truncate group-hover:text-white">{lead.name || lead.lead_id || '—'}</div>
        <div className="text-[10px] font-mono text-white/30 truncate">{lead.lead_id}</div>
      </div>

      {/* Score */}
      <div className="text-sm font-mono font-bold w-10 text-right" style={{ color }}>
        {lead.score || '—'}
      </div>

      {/* Progress bar */}
      <div className="w-24 hidden md:block">
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color, boxShadow: `0 0 4px ${color}` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="text-[9px] font-mono text-white/30 text-center mt-0.5">A{stage}/6</div>
      </div>

      {/* Stage dot */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
        style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
        {stage}
      </div>
    </motion.div>
  )
}

function EmptyPipeline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="text-4xl mb-3 opacity-20">◈</div>
      <div className="font-mono text-sm text-white/20 tracking-widest">AWAITING DATA</div>
      <div className="font-mono text-xs text-white/10 mt-1">Keine Leads entsprechen dem Filter</div>
    </motion.div>
  )
}
