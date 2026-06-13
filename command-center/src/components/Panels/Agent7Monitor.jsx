import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Globe, Rocket, ExternalLink } from 'lucide-react'

const PINK = '#e8197f'
const EASE = [0.23, 1, 0.32, 1]

/**
 * Agent 7 (Zuckerberg / Website Builder) Deep Monitor.
 * Verifies the build → deploy chain using real data.
 */
export default function Agent7Monitor({ leads = [], executions = [] }) {
  const a7Runs = executions.filter(e => e.workflowId === 'nTVZLymUEYRt1W86').slice(0, 10)

  const validDemo = (url) => url && !url.startsWith('/files') && /^https?:\/\//.test(url)

  const total = leads.length
  const withDemo = leads.filter(l => validDemo(l.build?.demo_url)).length
  const withBuildStatus = leads.filter(l => l.build?.build_status).length
  const blocked = leads.filter(l => {
    const s = String(l.build?.build_status || '').toLowerCase()
    return s.includes('blocker') || s.includes('cloudflare') || s.includes('rate_limit')
  }).length
  const recentErrors = a7Runs.filter(e => e.status === 'error')

  // Last successful demo
  const lastDemoLead = leads
    .filter(l => validDemo(l.build?.demo_url))
    .sort((a, b) => String(b.build?.website_built_at || '').localeCompare(String(a.build?.website_built_at || '')))[0]

  const checks = [
    { label: 'Webhook erreichbar',     ok: !!import.meta.env.VITE_N8N_AGENT7_WEBHOOK,
      hint: 'VITE_N8N_AGENT7_WEBHOOK gesetzt' },
    { label: 'Letzter Run = Erfolg',   ok: a7Runs[0]?.status === 'success',
      hint: a7Runs[0] ? `Status: ${a7Runs[0].status}` : 'Keine Runs gefunden' },
    { label: 'Mindestens 1 Live-Demo', ok: withDemo > 0,
      hint: `${withDemo}/${total} Leads mit demo_url` },
    { label: 'Keine externen Blocker', ok: blocked === 0,
      hint: blocked === 0 ? 'OK' : `${blocked} Leads mit Cloudflare/Rate-Limit Block` },
    { label: 'Keine Webhook-Errors',   ok: recentErrors.length === 0,
      hint: recentErrors.length === 0 ? 'OK' : `${recentErrors.length}× Error in letzten 10 Runs` },
  ]
  const allOk = checks.every(c => c.ok)

  return (
    <div style={{ background: `rgba(232,25,127,0.04)`, border: `1px solid rgba(232,25,127,0.2)`, borderRadius: 7, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Rocket size={11} style={{ color: PINK }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: PINK }}>
          A7 ZUCKERBERG — DEEP MONITOR
        </span>
        <span className="font-mono text-[9px] ml-auto px-2 py-0.5 rounded"
          style={{ background: allOk ? 'rgba(45,219,114,0.1)' : 'rgba(245,166,35,0.1)', color: allOk ? '#2ddb72' : '#f5a623', border: `1px solid ${allOk ? 'rgba(45,219,114,0.2)' : 'rgba(245,166,35,0.2)'}` }}>
          {allOk ? '✓ HEALTHY' : '⚠ ATTENTION'}
        </span>
      </div>

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

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <Metric label="Leads gesamt" value={total} color={PINK} />
        <Metric label="Live-Demos" value={withDemo} color="#2ddb72" />
        <Metric label="Mit Status" value={withBuildStatus} color="#00d4ff" />
        <Metric label="Blockiert" value={blocked} color={blocked > 0 ? '#f5a623' : 'var(--text-dim)'} />
      </div>

      {lastDemoLead && (
        <div style={{ background: 'rgba(45,219,114,0.05)', border: '1px solid rgba(45,219,114,0.15)', borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Globe size={10} style={{ color: '#2ddb72' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-mono text-[9px] tracking-widest" style={{ color: '#2ddb72' }}>LETZTE LIVE-DEMO</div>
            <div className="font-ui text-xs truncate" style={{ color: 'var(--text-hi)' }}>{lastDemoLead.name || lastDemoLead.lead_id}</div>
          </div>
          <a href={lastDemoLead.build?.demo_url} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[9px] flex items-center gap-1 px-2 py-1 rounded hover:opacity-80"
            style={{ color: '#2ddb72', background: 'rgba(45,219,114,0.1)', border: '1px solid rgba(45,219,114,0.2)' }}>
            <ExternalLink size={9} /> Demo
          </a>
        </div>
      )}

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
