import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react'

const ROSE = '#e8197f'
const EASE = [0.23, 1, 0.32, 1]

/**
 * Agent 2 (Shakespeare / Text Extractor) Deep Monitor.
 * Checks against real leads + executions data — no extra fetch.
 */
export default function Agent2Monitor({ leads = [], executions = [] }) {
  const a2Runs = executions.filter(e => e.workflowId === '04XC92MJvaYKtjbi').slice(0, 10)

  // Lead-level diagnostics
  const total = leads.length
  const withContent = leads.filter(l => l.content?.name || l.content?.ueber_uns || l.content?.claim_slogan).length
  const emptyContent = leads.filter(l => l.content && Object.keys(l.content).length === 0 && (l.lead_id || l.website)).length
  const withWarnings = leads.filter(l => {
    const w = l.content?.warnings
    if (Array.isArray(w)) return w.length > 0
    return !!w
  }).length
  const parseFails = leads.filter(l => {
    const w = l.content?.warnings || ''
    const s = Array.isArray(w) ? w.join(',') : w
    return s.includes('llm_json_failed') || s.includes('parse')
  }).length

  // Recent errors
  const recentErrors = a2Runs.filter(e => e.status === 'error')

  const checks = [
    { label: 'Webhook erreichbar',     ok: !!import.meta.env.VITE_N8N_AGENT2_WEBHOOK,
      hint: 'VITE_N8N_AGENT2_WEBHOOK gesetzt' },
    { label: 'Letzter Run = Erfolg',   ok: a2Runs[0]?.status === 'success',
      hint: a2Runs[0] ? `Status: ${a2Runs[0].status}` : 'Keine Runs gefunden' },
    { label: 'Mind. 1 Lead mit Content', ok: withContent > 0,
      hint: `${withContent}/${total} Leads haben extrahierten Text` },
    { label: 'Keine Parse-Fehler',     ok: parseFails === 0,
      hint: parseFails === 0 ? 'OK' : `${parseFails} Leads mit llm_json_failed` },
    { label: 'Keine Webhook-Errors',   ok: recentErrors.length === 0,
      hint: recentErrors.length === 0 ? 'OK' : `${recentErrors.length}× Error in letzten 10 Runs` },
  ]

  const allOk = checks.every(c => c.ok)

  return (
    <div style={{ background: `rgba(232,25,127,0.04)`, border: `1px solid rgba(232,25,127,0.2)`, borderRadius: 7, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <FileText size={11} style={{ color: ROSE }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: ROSE }}>
          A2 SHAKESPEARE — DEEP MONITOR
        </span>
        <span className="font-mono text-[9px] ml-auto px-2 py-0.5 rounded"
          style={{ background: allOk ? 'rgba(45,219,114,0.1)' : 'rgba(245,166,35,0.1)', color: allOk ? '#2ddb72' : '#f5a623', border: `1px solid ${allOk ? 'rgba(45,219,114,0.2)' : 'rgba(245,166,35,0.2)'}` }}>
          {allOk ? '✓ HEALTHY' : '⚠ ATTENTION'}
        </span>
      </div>

      {/* Check list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {checks.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.16, ease: EASE }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4 }}>
            {c.ok
              ? <CheckCircle size={10} style={{ color: '#2ddb72', flexShrink: 0 }} />
              : <XCircle    size={10} style={{ color: '#f5a623', flexShrink: 0 }} />}
            <span className="font-ui text-xs" style={{ color: 'var(--text)', flex: 1 }}>{c.label}</span>
            <span className="font-mono text-[9px]" style={{ color: c.ok ? 'var(--text-dim)' : '#f5a623' }}>{c.hint}</span>
          </motion.div>
        ))}
      </div>

      {/* Metric pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <Metric label="Leads gesamt" value={total} color={ROSE} />
        <Metric label="Mit Content" value={withContent} color="#2ddb72" />
        <Metric label="Leer" value={emptyContent} color={emptyContent > 0 ? '#f5a623' : 'var(--text-dim)'} />
        <Metric label="Warnings" value={withWarnings} color={withWarnings > 0 ? '#f5a623' : 'var(--text-dim)'} />
      </div>

      {/* Recent errors */}
      {recentErrors.length > 0 && (
        <div style={{ background: 'rgba(240,58,58,0.05)', border: '1px solid rgba(240,58,58,0.15)', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AlertTriangle size={10} style={{ color: '#f03a3a' }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#f03a3a' }}>RECENT ERRORS</span>
          </div>
          {recentErrors.slice(0, 3).map(e => (
            <div key={e.id} className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
              #{e.id} · {new Date(e.startedAt).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ padding: '6px 10px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 5 }}>
      <div className="font-mono text-[8px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="font-mono text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  )
}
