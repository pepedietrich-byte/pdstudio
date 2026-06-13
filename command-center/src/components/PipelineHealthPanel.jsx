// A8 Twin Control Agent — Pipeline Health Panel
// Zeigt blockierte Builds, Agent-Fehler, nächste beste Aktion.
// Echte Funktion: liest aus sites-Filter, fresh-builds, gate-reports.
import { useMemo } from 'react'
import { Activity, AlertTriangle, CheckCircle2, XCircle, Wrench, ExternalLink } from 'lucide-react'
import { filterRelevantSites, getSitesDiagnostics } from '../lib/sites'

const SEVERITY = { critical: '#ef4444', major: '#f5a623', minor: '#9ca3b5', ok: '#39ff88' }

export default function PipelineHealthPanel({ leads = [] }) {
  const sites = useMemo(() => filterRelevantSites(leads), [leads])
  const diag = useMemo(() => getSitesDiagnostics(leads), [leads])

  // Klassifiziere Sites nach Stand
  const classified = useMemo(() => {
    const out = { ready: [], stuck: [], no_demo: [], legacy: [] }
    for (const lead of leads) {
      const url = lead.build?.demo_url
      const buildStatus = lead.build?.build_status
      const source = lead.build?.source || ''

      if (!url) {
        out.no_demo.push(lead)
      } else if (buildStatus === 'failed' || buildStatus === 'blocked' || buildStatus === 'timeout') {
        out.stuck.push(lead)
      } else if (source.includes('stufe2') || source.includes('5-styles') || source.includes('10-build')) {
        out.ready.push(lead)
      } else {
        out.legacy.push(lead)
      }
    }
    return out
  }, [leads])

  const totalProblems = classified.stuck.length

  return (
    <div className="rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(57,255,136,0.04)', border: '1px solid rgba(57,255,136,0.25)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: '#39ff88' }} />
          <h3 className="font-semibold" style={{ color: '#e8edf4' }}>A8 Pipeline Health</h3>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: totalProblems > 0 ? '#f5a623' : '#39ff88' }}>
          {totalProblems > 0 ? `${totalProblems} stuck` : 'all healthy'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Stat label="Ready" value={classified.ready.length} color="#39ff88" icon={CheckCircle2} />
        <Stat label="Stuck" value={classified.stuck.length} color="#ef4444" icon={XCircle} />
        <Stat label="Legacy" value={classified.legacy.length} color="#9ca3b5" icon={AlertTriangle} />
        <Stat label="Sites-Tab" value={diag.total} color="#9b6ef3" icon={Activity} />
      </div>

      {classified.stuck.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>
            Builds die hängen / failed (Repair nötig)
          </div>
          <div className="space-y-1">
            {classified.stuck.slice(0, 5).map(lead => (
              <div key={lead.lead_id} className="flex items-center justify-between p-2 rounded"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div>
                  <div className="text-xs" style={{ color: '#e8edf4' }}>{lead.business_name || lead.lead_id}</div>
                  <div className="text-[10px]" style={{ color: '#9ca3b5' }}>
                    Status: <span style={{ color: '#ef4444' }}>{lead.build?.build_status || 'unknown'}</span>
                  </div>
                </div>
                <button className="px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1"
                  style={{ background: 'rgba(155,110,243,0.15)', color: '#c5a5ff' }}>
                  <Wrench size={9} /> Repair
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {classified.ready.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#39ff88' }}>
            Aktuelle Demos ({classified.ready.length})
          </div>
          <div className="grid grid-cols-1 gap-1">
            {classified.ready.slice(0, 6).map(lead => (
              <a key={lead.lead_id} href={lead.build.demo_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded text-xs"
                style={{ background: 'rgba(57,255,136,0.04)', border: '1px solid rgba(57,255,136,0.2)' }}>
                <span style={{ color: '#e8edf4' }}>{lead.business_name || lead.lead_id}</span>
                <span className="flex items-center gap-1" style={{ color: '#39ff88' }}>
                  <ExternalLink size={10} /> {lead.build.demo_url?.replace('https://', '')}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] pt-2 border-t" style={{ color: '#6b7a90', borderColor: 'rgba(255,255,255,0.06)' }}>
        Pipeline-Diagnose: {diag.persisted} persistent · {diag.session_only} session-only · {diag.fresh_session} fresh
      </div>
    </div>
  )
}

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded p-2" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
      <div className="flex items-center justify-between mb-1">
        <Icon size={11} style={{ color }} />
        <span className="text-xl font-bold font-mono" style={{ color }}>{value}</span>
      </div>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>{label}</div>
    </div>
  )
}
