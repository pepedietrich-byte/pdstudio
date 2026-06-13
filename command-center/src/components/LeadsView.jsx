import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ChevronRight, Search, Archive, ArchiveRestore, Target } from 'lucide-react'
import { getLeadStage, getConfidence } from '../lib/sheets'
import { SCORE_THRESHOLD } from '../lib/status'

const EASE = [0.23, 1, 0.32, 1]
const ARCHIVE_KEY = 'pdstudio_archived_leads_v1'

const STAGE_LABELS = ['', 'LEAD', 'TEXT', 'IMG', 'VALID', 'CONCEPT', 'BUILD', 'LIVE']
const STAGE_COLORS = ['', '#00d4ff', '#e8197f', '#2ddb72', '#f5a623', '#9b6ef3', '#00d4ff', '#e8197f']

function scoreColor(n) {
  if (n >= 60) return '#2ddb72'
  if (n >= 40) return '#f5a623'
  return '#f03a3a'
}
function confColor(c) {
  if (c >= 0.8) return '#2ddb72'
  if (c >= 0.5) return '#f5a623'
  return '#f03a3a'
}

function loadArchived() {
  try { return new Set(JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]')) }
  catch { return new Set() }
}
function saveArchived(set) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...set]))
}

export default function LeadsView({ leads = [], onSelectLead, activeLead, onSetActive }) {
  const [filter,       setFilter]       = useState('active')   // active = score >= 50
  const [sort,         setSort]         = useState('score')
  const [search,       setSearch]       = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archived,     setArchived]     = useState(loadArchived)

  const archiveLead = useCallback((lead, e) => {
    e?.stopPropagation()
    if (!lead.lead_id) return
    setArchived(prev => {
      const next = new Set(prev)
      next.add(lead.lead_id)
      saveArchived(next)
      return next
    })
  }, [])

  const unarchiveLead = useCallback((lead, e) => {
    e?.stopPropagation()
    if (!lead.lead_id) return
    setArchived(prev => {
      const next = new Set(prev)
      next.delete(lead.lead_id)
      saveArchived(next)
      return next
    })
  }, [])

  const isArchived = (lead) => archived.has(lead.lead_id)

  // Score-based partition
  const activeLeads   = leads.filter(l => !isArchived(l) && (+l.score || 0) >= SCORE_THRESHOLD.ACTIVE)
  const lowLeads      = leads.filter(l => !isArchived(l) && (+l.score || 0) < SCORE_THRESHOLD.ACTIVE && (+l.score || 0) > 0)
  const archivedLeads = leads.filter(l => isArchived(l))

  // Source set based on view mode
  const sourceLeads = showArchived ? archivedLeads
    : filter === 'active' ? activeLeads
    : filter === 'low'    ? lowLeads
    : leads.filter(l => !isArchived(l))

  const stageFiltered = sourceLeads.filter(l => {
    const stage = getLeadStage(l)
    if (filter === 'live')    return stage === 7
    if (filter === 'built')   return stage >= 6
    if (filter === 'content') return stage >= 2
    return true
  })

  const searchFiltered = stageFiltered.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (l.name || '').toLowerCase().includes(q) ||
      (l.website || '').toLowerCase().includes(q) ||
      (l.address || '').toLowerCase().includes(q) ||
      (l.lead_id || '').toLowerCase().includes(q)
    )
  })

  const sorted = [...searchFiltered].sort((a, b) => {
    if (sort === 'score')      return (+b.score || 0) - (+a.score || 0)
    if (sort === 'stage')      return getLeadStage(b) - getLeadStage(a)
    if (sort === 'confidence') return getConfidence(b) - getConfidence(a)
    return (+b.score || 0) - (+a.score || 0)
  })

  const pills = [
    ['active',  `Aktiv (≥${SCORE_THRESHOLD.ACTIVE})`, activeLeads.length],
    ['low',     'Schwach (<50)',                        lowLeads.length],
    ['content', 'Content+',                             activeLeads.filter(l => getLeadStage(l) >= 2).length],
    ['live',    'Live',                                 leads.filter(l => getLeadStage(l) === 7).length],
  ]

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
      {/* Archive notice banner */}
      {archivedLeads.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 font-mono text-[9px]"
          style={{ borderBottom: '1px solid var(--border-dim)', color: '#f5a623', background: 'rgba(245,166,35,0.04)' }}
        >
          <Archive size={9} />
          {archivedLeads.length} archivierte Leads (nur localStorage — needs_webhook für Sheets-Sync)
          <button
            onClick={() => setShowArchived(v => !v)}
            className="ml-auto px-2 py-0.5 rounded font-mono text-[9px]"
            style={{
              color: showArchived ? '#f5a623' : 'var(--text-dim)',
              border: '1px solid currentColor',
              opacity: showArchived ? 1 : 0.6,
            }}
          >
            {showArchived ? 'Archiv ausblenden' : 'Archiv anzeigen'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
          {showArchived ? 'ARCHIV' : 'LEADS'}
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {sorted.length}/{leads.length}
        </span>

        {!showArchived && lowLeads.length > 0 && (
          <button
            onClick={() => { setFilter('low') }}
            className="px-2 py-0.5 rounded font-mono text-[9px] flex items-center gap-1"
            style={{
              color: '#ff3b3b',
              background: 'rgba(255,59,59,0.06)',
              border: '1px solid rgba(255,59,59,0.2)',
            }}
            title="Leads mit Score < 50 anzeigen und archivieren"
          >
            <Archive size={8} />
            {lowLeads.length} archivierbar
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suchen..."
              className="pl-6 pr-2 h-6 rounded font-mono text-[10px] outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-dim)',
                color: 'var(--text)',
                width: search ? 120 : 80,
                transition: 'width 200ms',
              }}
            />
          </div>

          {!showArchived && (
            <>
              <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border)' }} />
              {pills.map(([v, l, count]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className="px-2.5 h-6 rounded font-mono text-[10px] font-medium transition-colors flex items-center gap-1"
                  style={{
                    background: filter === v ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color:      filter === v ? 'var(--text-hi)' : 'var(--text-dim)',
                    border:     `1px solid ${filter === v ? 'rgba(255,255,255,0.15)' : 'var(--border-dim)'}`,
                  }}>
                  {l}
                  {count > 0 && (
                    <span className="font-mono text-[9px] opacity-60 tabular-nums">{count}</span>
                  )}
                </button>
              ))}
            </>
          )}

          <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border)' }} />
          {[['score', 'Score'], ['stage', 'Stage'], ['confidence', 'Conf']].map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)}
              className="px-2.5 h-6 rounded font-mono text-[10px] font-medium transition-colors"
              style={{
                background: sort === v ? 'rgba(232,25,127,0.1)' : 'transparent',
                color:      sort === v ? '#e8197f' : 'var(--text-dim)',
                border:     `1px solid ${sort === v ? 'rgba(232,25,127,0.25)' : 'var(--border-dim)'}`,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk archive low-score banner */}
      {filter === 'low' && lowLeads.length > 0 && !showArchived && (
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,59,59,0.04)' }}
        >
          <Archive size={10} style={{ color: '#ff3b3b' }} />
          <span className="font-mono text-[10px] flex-1" style={{ color: '#ff3b3b' }}>
            {lowLeads.length} Leads mit Score &lt; 50 — zu schwach für aktive Pipeline
          </span>
          <button
            onClick={() => {
              setArchived(prev => {
                const next = new Set(prev)
                lowLeads.forEach(l => l.lead_id && next.add(l.lead_id))
                saveArchived(next)
                return next
              })
              setFilter('active')
            }}
            className="px-3 py-1 rounded font-mono text-[9px] font-bold"
            style={{ color: '#ff3b3b', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)' }}
          >
            Alle {lowLeads.length} archivieren
          </button>
        </div>
      )}

      {/* Column headers */}
      <div className="grid px-4 py-1.5 gap-3"
        style={{ gridTemplateColumns: '24px 1fr 44px 44px 110px 110px', borderBottom: '1px solid var(--border-dim)' }}>
        {['', 'NAME', 'SCORE', 'CONF', 'STAGE', 'WEBSITE'].map((h, i) => (
          <span key={i} className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-1.5">
          <div className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {search ? 'Keine Treffer' : showArchived ? 'Kein Archiv' : 'Keine Leads'}
          </div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            {search ? 'Suche anpassen' : showArchived ? 'Archiv ist leer' : 'Pipeline starten oder URL eingeben'}
          </div>
        </div>
      ) : (
        <div className="max-h-[640px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {sorted.map((lead, i) => (
              <LeadRow
                key={lead.lead_id || i}
                lead={lead}
                index={i}
                onClick={() => onSelectLead?.(lead)}
                isActive={activeLead?.lead_id === lead.lead_id}
                onSetActive={() => onSetActive?.(lead)}
                isArchived={isArchived(lead)}
                onArchive={(e) => archiveLead(lead, e)}
                onUnarchive={(e) => unarchiveLead(lead, e)}
                showArchiveAction={!showArchived && (+lead.score || 0) < SCORE_THRESHOLD.ACTIVE}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function LeadRow({ lead, index, onClick, isActive, onSetActive, isArchived, onArchive, onUnarchive, showArchiveAction }) {
  const stage       = getLeadStage(lead)
  const score       = +lead.score || 0
  const conf        = getConfidence(lead)
  const sc          = scoreColor(score)
  const cc          = confColor(conf)
  const stageColor  = STAGE_COLORS[stage] || 'var(--text-dim)'
  const stageLabel  = STAGE_LABELS[stage] || ''
  const website     = lead.website || ''
  const demoUrl     = lead.build?.demo_url || ''
  const hasDemo     = demoUrl && !demoUrl.startsWith('/files') && /^https?:\/\//.test(demoUrl)
  const rawArgs     = lead.verkaufsargumente
  const args        = Array.isArray(rawArgs)
    ? rawArgs
    : typeof rawArgs === 'string' && rawArgs
      ? rawArgs.split('|').map(s => s.trim()).filter(Boolean)
      : []
  const claimSlogan = lead.content?.claim_slogan || ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, delay: Math.min(index, 12) * 0.01, ease: EASE }}
      className="grid items-center px-4 py-2.5 cursor-pointer group"
      style={{
        gridTemplateColumns: '24px 1fr 44px 44px 110px 110px',
        borderBottom: '1px solid var(--border-dim)',
        gap: '12px',
        background: isActive ? 'rgba(155,110,243,0.05)' : 'transparent',
        outline: isActive ? '1px solid rgba(155,110,243,0.15)' : 'none',
        outlineOffset: -1,
      }}
    >
      {/* Active indicator + archive action */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onSetActive?.() }}
          title={isActive ? 'Deselektieren' : 'Als aktiven Lead setzen'}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ color: isActive ? '#9b6ef3' : 'rgba(255,255,255,0.15)' }}
        >
          <Target size={9} />
        </button>
        {showArchiveAction && !isArchived && (
          <button
            onClick={onArchive}
            title="Archivieren (Score < 50)"
            className="w-5 h-5 rounded flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            style={{ color: 'rgba(255,59,59,0.5)' }}
          >
            <Archive size={8} />
          </button>
        )}
        {isArchived && (
          <button
            onClick={onUnarchive}
            title="Wiederherstellen"
            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
            style={{ color: '#f5a623' }}
          >
            <ArchiveRestore size={8} />
          </button>
        )}
      </div>

      {/* Name + claim + args */}
      <div className="min-w-0 pr-2" onClick={onClick}>
        <div className="font-ui text-sm font-medium truncate" style={{ color: isActive ? 'var(--text-hi)' : 'var(--text-hi)', opacity: isArchived ? 0.4 : 1 }}>
          {lead.name || lead.lead_id || '—'}
        </div>
        {claimSlogan ? (
          <div className="font-ui text-xs truncate mt-0.5 italic" style={{ color: 'var(--text-dim)' }}>
            {claimSlogan}
          </div>
        ) : lead.address ? (
          <div className="font-mono text-[10px] truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {lead.address.replace(', Deutschland', '').slice(0, 45)}
          </div>
        ) : null}
        {args.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {args.slice(0, 2).map((a, i) => (
              <span key={i} className="px-1.5 py-0 rounded-full font-mono text-[9px]"
                style={{ background: 'rgba(255,59,59,0.07)', color: '#ff6b6b', border: '1px solid rgba(255,59,59,0.15)' }}>
                {a.length > 28 ? a.slice(0, 28) + '…' : a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="font-mono text-sm font-black tabular-nums text-right" style={{ color: sc, opacity: isArchived ? 0.4 : 1 }} onClick={onClick}>
        {score || '—'}
      </div>

      {/* Confidence */}
      <div className="flex flex-col items-end gap-0.5" onClick={onClick}>
        {conf > 0 ? (
          <>
            <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: cc }}>
              {Math.round(conf * 100)}%
            </span>
            <div className="h-[2px] w-8 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(conf * 100)}%`, background: cc }} />
            </div>
          </>
        ) : (
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>—</span>
        )}
      </div>

      {/* Stage */}
      <div onClick={onClick}>
        {stageLabel ? (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded w-fit"
            style={{ color: stageColor, background: `${stageColor}10`, border: `1px solid ${stageColor}22` }}>
            A{stage} {stageLabel}
          </span>
        ) : (
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>—</span>
        )}
      </div>

      {/* Website / Demo */}
      <div className="min-w-0">
        {hasDemo ? (
          <a href={demoUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 font-mono text-[10px] transition-colors"
            style={{ color: '#e8197f' }}>
            <ExternalLink size={8} className="flex-shrink-0" />
            <span className="truncate">Demo ↗</span>
          </a>
        ) : website ? (
          <a href={website} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="font-mono text-[10px] truncate block transition-colors hover:opacity-80"
            style={{ color: 'var(--text-dim)' }}>
            {website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 28)}
          </a>
        ) : (
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)', opacity: 0.3 }}>—</span>
        )}
      </div>
    </motion.div>
  )
}
