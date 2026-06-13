import { motion } from 'framer-motion'
import { X, Activity, AlertTriangle, CheckCircle, Clock, Cpu, ArrowRight, Target, ExternalLink } from 'lucide-react'
import { AGENT_NAMES } from '../../lib/n8n'
import { AGENTS } from '../../lib/agents'
import { useAgentDiagnostics } from '../../hooks/useAgentDiagnostics'
import { getAllLeadResults } from '../../hooks/useLeadResults'

const COLORS = {
  1: '#00d4ff',  // Lead Qualifier
  2: '#9b6ef3',  // Claude Code Builder
  3: '#e8197f',  // Polish Agent
  4: '#f5a623',  // Human Writer
  5: '#2ddb72',  // Pricing Agent
  6: '#ff6b35',  // Fact Checker
}

const AGENT_DESCRIPTIONS = {
  1: 'Analysiert Lead-Website technisch. Berechnet Score, Confidence und Pain Points. Startet mit Google Maps URL oder Website-URL.',
  2: 'Generiert Claude-Code-Build-Prompt. Deployt Premium-Restaurant-Website auf Vercel. Design-Referenz: Project Napoli Premium.',
  3: 'Generiert Bilder via Poe/Nano Banana. Polisht CSS, Animationen und Microinteractions der bestehenden Demo-Site.',
  4: 'Schreibt personalisierte Verkaufs-E-Mails, DMs, Follow-ups und Call Scripts auf Deutsch. Keine generischen KI-Texte.',
  5: 'Berechnet Min/Empfehlung/Premium Preis basierend auf Score, Rating, Branche. Schätzt Closing-Chance.',
  6: 'Prüft Website-URL, Telefon, E-Mail, Name, Adresse. Gibt Trust Score und Versandstatus zurück.',
}

const AGENT_STATUS_FIELD = {
  1: null,
  2: (r) => r.a5Result ? null : null,
  4: (r) => r.a4Texts ? 'Texte vorhanden' : 'Noch keine Texte',
  5: (r) => r.a5Result ? `€${r.a5Result.price_recommended} empfohlen, ${r.a5Result.closing_chance}% Closing` : 'Noch nicht berechnet',
  6: (r) => r.a6Result ? `Trust: ${r.a6Result.trust_score}% — ${r.a6Result.send_status}` : 'Noch nicht geprüft',
}

function formatDuration(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 1000)}s`
}

function StatusBadge({ status }) {
  const map = {
    excellent: ['#2ddb72', '✓ OK'],
    ok:        ['#2ddb72', '✓ OK'],
    warning:   ['#f5a623', '⚠ WARNING'],
    critical:  ['#f03a3a', '✗ CRITICAL'],
    idle:      ['#484868', '○ IDLE'],
    unknown:   ['#484868', '? UNKNOWN'],
  }
  const [color, label] = map[status] || map.unknown
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 rounded"
      style={{ color, background: `${color}12`, border: `1px solid ${color}30`, letterSpacing: '0.06em' }}>
      {label}
    </span>
  )
}

export default function AgentDetailPanel({ agentId, leads = [], executions = [], onClose, onOpenLeads, activeLead }) {
  const diag  = useAgentDiagnostics(agentId, { leads, executions })
  const color = COLORS[agentId] || '#9b6ef3'
  const name  = AGENT_NAMES[agentId]
  const agent = AGENTS[agentId]

  // Get active lead results for this agent
  const allResults = getAllLeadResults()
  const activeResults = activeLead?.lead_id ? (allResults[activeLead.lead_id] || {}) : null
  const statusFn = AGENT_STATUS_FIELD[agentId]
  const agentResultSummary = (activeResults && statusFn) ? statusFn(activeResults) : null

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '42%', minWidth: 340, maxWidth: 480, zIndex: 10,
        background: 'linear-gradient(180deg, rgba(7,5,26,0.97) 0%, rgba(10,6,28,0.97) 100%)',
        borderLeft: `1px solid ${color}40`,
        backdropFilter: 'blur(8px)',
        boxShadow: `-20px 0 60px rgba(0,0,0,0.5), inset 1px 0 0 ${color}10`,
        padding: '18px 18px 24px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: `${color}aa` }}>
            {agent?.glyph || `A${agentId}`} · PDSTUDIO COMMAND CENTER
          </div>
          <div className="font-ui font-black" style={{ color: '#fff', fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {name}
          </div>
          {agent?.role && (
            <div className="font-mono text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {agent.role}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusBadge status={diag.healthStatus} />
            {diag.successRate !== null && (
              <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
                {diag.successRate}% OK
              </span>
            )}
            {!agent?.webhookConfigured && !agent?.statusNote?.includes('Poe') && !agent?.statusNote?.includes('Client') && (
              <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                style={{ color: '#f5a623', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                needs_setup
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, width: 28, height: 28, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-dim)', flexShrink: 0,
          }}>
          <X size={11} />
        </button>
      </div>

      {/* Agent description */}
      <div style={{
        background: `${color}06`, border: `1px solid ${color}20`,
        borderRadius: 6, padding: '8px 10px', marginBottom: 12,
      }}>
        <p className="font-mono text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {AGENT_DESCRIPTIONS[agentId] || 'Agent description not available.'}
        </p>
      </div>

      {/* Active Lead section */}
      {activeLead ? (
        <div style={{
          background: 'rgba(155,110,243,0.08)', border: '1px solid rgba(155,110,243,0.25)',
          borderRadius: 6, padding: '10px 12px', marginBottom: 12,
        }}>
          <div className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: 'rgba(155,110,243,0.7)' }}>
            AKTIVER LEAD
          </div>
          <div className="font-ui font-semibold text-sm" style={{ color: '#fff' }}>
            {activeLead.name || activeLead.lead_id}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs font-bold" style={{
              color: (+activeLead.score || 0) >= 60 ? '#2ddb72' : (+activeLead.score || 0) >= 40 ? '#f5a623' : '#ff3b3b'
            }}>
              Score: {activeLead.score || '—'}
            </span>
            {activeLead.website && (
              <a href={activeLead.website} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[9px] flex items-center gap-1"
                style={{ color: '#00d4ff' }}>
                <ExternalLink size={8} />
                {activeLead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 22)}
              </a>
            )}
          </div>
          {agentResultSummary && (
            <div className="font-mono text-[9px] mt-2 px-2 py-1 rounded"
              style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
              {agentResultSummary}
            </div>
          )}
          {onOpenLeads && (
            <button onClick={onOpenLeads}
              className="flex items-center gap-1 font-mono text-[9px] mt-2"
              style={{ color: 'var(--text-dim)' }}>
              Lead Detail öffnen <ArrowRight size={8} />
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '8px 12px', marginBottom: 12,
        }}>
          <div className="flex items-center gap-2">
            <Target size={9} style={{ color: 'rgba(155,110,243,0.5)' }} />
            <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
              Kein aktiver Lead — Lead aus der Liste wählen
            </span>
          </div>
          {onOpenLeads && (
            <button onClick={onOpenLeads}
              className="flex items-center gap-1 font-mono text-[9px] mt-2"
              style={{ color: '#9b6ef3' }}>
              Leads öffnen <ArrowRight size={8} />
            </button>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        <Tile label="Heute Runs" value={diag.todayRunCount} icon={Activity} color={color} />
        <Tile label="Letzte 20"  value={diag.total}         icon={Cpu}      color={color} />
        <Tile label="Erfolg"     value={diag.ok}            icon={CheckCircle} color="#2ddb72" />
        <Tile label="Fehler"     value={diag.err}           icon={AlertTriangle} color={diag.err > 0 ? '#f03a3a' : 'var(--text-dim)'} />
        <Tile label="Ø Dauer"    value={formatDuration(diag.avgDurationMs)} color="#00d4ff" />
        <Tile label="Webhook"    value={diag.webhookConfigured ? 'OK' : 'OFF'} color={diag.webhookConfigured ? '#2ddb72' : '#f5a623'} />
      </div>

      {/* Lead pipeline state */}
      <Section title="LEADS AN DIESER STAGE" icon={ArrowRight} color={color}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <PipeStat label={`Stage A${agentId}`}    value={diag.leadsAtStage.length}  color={color} />
          <PipeStat label={`Nach A${agentId}`}     value={diag.leadsCompleted.length} color="#2ddb72" />
        </div>
        {onOpenLeads && (
          <button onClick={onOpenLeads}
            className="font-mono text-[9px] flex items-center gap-1 mt-1"
            style={{ color: 'var(--text-dim)' }}>
            Leads ansehen <ArrowRight size={8} />
          </button>
        )}
      </Section>

      {/* Recent runs */}
      <Section title="LETZTE RUNS" icon={Clock} color={color}>
        {diag.runs.length === 0 ? (
          <div className="font-mono text-[9px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            Keine Executions gefunden.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {diag.runs.slice(0, 6).map(r => {
              const ok = r.status === 'success', err = r.status === 'error'
              const c = ok ? '#2ddb72' : err ? '#f03a3a' : r.status === 'running' ? color : 'var(--text-dim)'
              const dur = r.stoppedAt && r.startedAt
                ? new Date(r.stoppedAt).getTime() - new Date(r.startedAt).getTime()
                : null
              return (
                <div key={r.id}
                  style={{ display: 'grid', gridTemplateColumns: '10px 56px 1fr 48px', gap: 8, alignItems: 'center', padding: '2px 0' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                  <span className="font-mono text-[8px] tabular-nums" style={{ color: 'var(--text-dim)' }}>#{r.id}</span>
                  <span className="font-mono text-[8px]" style={{ color: c }}>{r.status?.toUpperCase()}</span>
                  <span className="font-mono text-[8px] text-right tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {dur !== null ? formatDuration(dur) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </motion.div>
  )
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div style={{ marginBottom: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        {Icon && <Icon size={8} style={{ color, opacity: 0.7 }} />}
        <span className="font-mono text-[8px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Tile({ label, value, color, icon: Icon }) {
  return (
    <div style={{ background: `${color}06`, border: `1px solid ${color}18`, borderRadius: 6, padding: '7px 9px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        {Icon && <Icon size={8} style={{ color, opacity: 0.6 }} />}
        <span className="font-mono text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      </div>
      <div className="font-mono font-bold tabular-nums" style={{ color, fontSize: 15, lineHeight: 1 }}>{value ?? '—'}</div>
    </div>
  )
}

function PipeStat({ label, value, color }) {
  return (
    <div style={{ flex: 1, padding: '5px 8px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 5 }}>
      <div className="font-mono text-[8px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="font-mono text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  )
}
