import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { WORKFLOW_AGENT_MAP, AGENT_NAMES } from '../../lib/n8n'

const COLORS = {
  1: '#00d4ff', 2: '#e8197f', 3: '#2ddb72', 4: '#f5a623',
  5: '#9b6ef3', 6: '#00d4ff', 7: '#e8197f',
}

const STATUS_COLOR = {
  success: '#2ddb72', error: '#f03a3a', running: '#00d4ff',
  crashed: '#f03a3a', waiting: '#f5a623',
}

/**
 * Horizontal timeline of recent agent executions.
 * Real data from useExecutions hook.
 */
export default function RunTimeline({ executions = [] }) {
  const [filter, setFilter] = useState('all')   // all | success | error

  const runs = useMemo(() => {
    let list = executions.slice(0, 50)
    if (filter === 'success') list = list.filter(e => e.status === 'success')
    if (filter === 'error')   list = list.filter(e => e.status === 'error')
    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }, [executions, filter])

  // Compute timeline window
  const oldest = runs[runs.length - 1] ? new Date(runs[runs.length - 1].startedAt).getTime() : null
  const newest = runs[0]                ? new Date(runs[0].startedAt).getTime()                : null
  const span   = (newest && oldest) ? Math.max(newest - oldest, 60000) : 60000

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[['all', `Alle (${executions.length})`], ['success', 'Erfolg'], ['error', 'Fehler']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className="px-2 py-1 rounded font-mono text-[9px] font-medium"
            style={{
              background: filter === v ? 'rgba(155,110,243,0.12)' : 'transparent',
              color:      filter === v ? '#c8a8ff' : 'var(--text-dim)',
              border: `1px solid ${filter === v ? 'rgba(155,110,243,0.3)' : 'var(--border-dim)'}`,
              cursor: 'pointer',
            }}>
            {l}
          </button>
        ))}
      </div>

      {runs.length === 0 ? (
        <div className="font-mono text-[10px] py-4 text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
          Keine Executions gefunden.
        </div>
      ) : (
        <>
          {/* Timeline track */}
          <div style={{ position: 'relative', height: 60, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: 6, padding: '8px', overflow: 'hidden' }}>
            {/* Center axis line */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(155,110,243,0.12)' }} />

            {runs.map((r, i) => {
              const t = new Date(r.startedAt).getTime()
              const pct = newest && oldest ? ((newest - t) / span) * 100 : 50
              const left = `${Math.min(98, Math.max(0, 100 - pct))}%`
              const agentId = WORKFLOW_AGENT_MAP[r.workflowId]
              const agentColor = COLORS[agentId] || '#888'
              const statusColor = STATUS_COLOR[r.status] || '#888'
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.4), duration: 0.14 }}
                  title={`${AGENT_NAMES[agentId] || '?'} · ${r.status} · ${new Date(r.startedAt).toLocaleString('de-DE')}`}
                  style={{
                    position: 'absolute',
                    left, top: '50%', transform: 'translate(-50%, -50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: statusColor,
                    border: `1.5px solid ${agentColor}`,
                    boxShadow: r.status === 'running' ? `0 0 8px ${agentColor}` : 'none',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </div>

          {/* Bottom: time labels */}
          {newest && oldest && (
            <div className="flex justify-between font-mono text-[8px] mt-1" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
              <span>{new Date(oldest).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
              <span>jetzt</span>
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,7].map(id => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[id], border: `1.5px solid ${COLORS[id]}` }} />
                <span className="font-mono text-[8px]" style={{ color: 'var(--text-dim)' }}>A{id} {AGENT_NAMES[id]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
