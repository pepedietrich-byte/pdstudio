import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Activity, AlertTriangle, CheckCircle, Clock, ArrowRight, Cpu } from 'lucide-react'
import { AGENT_NAMES, WORKFLOW_AGENT_MAP } from '../../lib/n8n'
import { getLeadStage } from '../../lib/sheets'
import { useAgentDiagnostics } from '../../hooks/useAgentDiagnostics'
import { usePepe } from '../../hooks/usePepe'
import { useTwin } from '../Twin/TwinContext'
import Agent2Monitor from '../Panels/Agent2Monitor'
import Agent7Monitor from '../Panels/Agent7Monitor'

const COLORS = {
  1: '#00d4ff',  // SIGN
  2: '#9b6ef3',  // CODÊ
  3: '#e8197f',  // ELON
  4: '#f5a623',  // GOETHE
  5: '#2ddb72',  // OMID
  6: '#ff6b35',  // SERKAN
}
const GOLD = '#ffd700'
const EASE = [0.23, 1, 0.32, 1]

// PDSTUDIO 6-Agent-Architektur (matches lib/agents.js)
const AGENT_ROLES = {
  1: 'Score + Confidence berechnen',
  2: 'Website bauen + deployen',
  3: 'Bilder generieren + polishen',
  4: 'Verkaufs-Mails schreiben',
  5: 'Preise berechnen',
  6: 'Fakten verifizieren',
}

function agentHealth(agentId, executions) {
  const wfId = Object.keys(WORKFLOW_AGENT_MAP).find(k => WORKFLOW_AGENT_MAP[k] === agentId)
  const runs = executions.filter(e => e.workflowId === wfId).slice(0, 10)
  return {
    err: runs.filter(e => e.status === 'error').length,
    lastStatus: runs[0]?.status || null,
    running: runs.some(e => e.status === 'running'),
    lastRun: runs[0]?.startedAt || null,
  }
}

// ── Mobile Agent Station Card ────────────────────────────────────
function MobileAgentCard({ agentId, leads, executions, onSelect, isSelected }) {
  const color = COLORS[agentId]
  const name  = AGENT_NAMES[agentId]
  const { err, lastStatus, running } = agentHealth(agentId, executions)
  const count = leads.filter(l => getLeadStage(l) >= agentId).length

  const statusColor = running ? color
    : lastStatus === 'success' ? '#2ddb72'
    : lastStatus === 'error'   ? '#f03a3a'
    : 'rgba(255,255,255,0.18)'

  const statusLabel = running ? 'RUNNING'
    : lastStatus === 'success' ? 'OK'
    : lastStatus === 'error'   ? 'FEHLER'
    : 'IDLE'

  return (
    <motion.button
      onClick={() => onSelect(agentId)}
      whileTap={{ scale: 0.97 }}
      style={{
        position: 'relative',
        background: isSelected ? `${color}0a` : 'rgba(12,12,26,0.9)',
        border: `1px solid ${isSelected ? color + '55' : color + '22'}`,
        borderTop: `2px solid ${color}`,
        borderRadius: 8,
        padding: '12px 12px 10px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        backdropFilter: 'blur(8px)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Running pulse ring */}
      {running && (
        <motion.div style={{
          position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
          borderRadius: 8, border: `1px solid ${color}`,
          pointerEvents: 'none',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Status dot */}
          <motion.div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColor, flexShrink: 0,
            boxShadow: running ? `0 0 6px ${color}` : 'none',
          }}
          animate={running ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          />
          {/* Agent ID chip */}
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
            color, padding: '1px 5px',
            background: `${color}10`,
            borderRadius: 3,
            border: `1px solid ${color}30`,
          }}>
            A{agentId}
          </span>
        </div>

        {/* Status label */}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
          color: statusColor,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Agent name */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
        color: '#eeeeff', marginBottom: 2,
      }}>
        {name?.toUpperCase()}
      </div>

      {/* Role */}
      <div style={{
        fontFamily: 'Geist, sans-serif',
        fontSize: 10, color: 'var(--text-dim)',
        marginBottom: 8, lineHeight: 1.3,
      }}>
        {AGENT_ROLES[agentId]}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6 }}>
        {count > 0 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, fontWeight: 700,
            color, background: `${color}14`,
            border: `1px solid ${color}30`,
            borderRadius: 4, padding: '2px 6px',
          }}>
            {count} Leads
          </span>
        )}
        {err > 0 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, fontWeight: 700,
            color: '#f03a3a', background: 'rgba(240,58,58,0.1)',
            border: '1px solid rgba(240,58,58,0.3)',
            borderRadius: 4, padding: '2px 6px',
          }}>
            {err} Fehler
          </span>
        )}
        {!count && !err && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, color: 'var(--text-muted)',
          }}>
            ○ Keine Daten
          </span>
        )}
      </div>
    </motion.button>
  )
}

// ── Mobile Agent Detail Bottom Sheet ────────────────────────────
function MobileAgentSheet({ agentId, leads, executions, onClose, onOpenLeads }) {
  const diag  = useAgentDiagnostics(agentId, { leads, executions })
  const color = COLORS[agentId] || '#9b6ef3'
  const name  = AGENT_NAMES[agentId]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function formatDuration(ms) {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms / 1000)}s`
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(4,4,12,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, rgba(7,5,26,0.99) 0%, rgba(10,6,28,0.99) 100%)',
          borderTop: `2px solid ${color}`,
          borderRadius: '14px 14px 0 0',
          overflowY: 'auto',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        <div style={{ padding: '8px 18px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.14em', color: `${color}99`, marginBottom: 3 }}>
                AGENT {agentId} · DIAGNOSTICS
              </div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 900, fontSize: 22, color: '#eeeeff', letterSpacing: '-0.01em' }}>
                {name}
              </div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {AGENT_ROLES[agentId]}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-dim)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={13} />
            </button>
          </div>

          {/* Health summary */}
          <div style={{
            background: `${color}07`, border: `1px solid ${color}22`,
            borderRadius: 8, padding: '10px 12px', marginBottom: 14,
          }}>
            <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 12, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              {diag.healthMessage}
            </p>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { label: 'Runs heute', val: diag.todayRunCount, color },
              { label: 'Erfolge', val: diag.ok, color: '#2ddb72' },
              { label: 'Fehler', val: diag.err, color: diag.err > 0 ? '#f03a3a' : 'var(--text-dim)' },
            ].map(({ label, val, color: c }) => (
              <div key={label} style={{
                background: `rgba(255,255,255,0.02)`,
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 7, padding: '8px 10px',
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: c, lineHeight: 1 }}>
                  {val ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline state */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 14,
          }}>
            <div style={{ flex: 1, padding: '8px 10px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 7 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 4 }}>IN STAGE A{agentId}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color }}>{diag.leadsAtStage.length}</div>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(45,219,114,0.06)', border: '1px solid rgba(45,219,114,0.2)', borderRadius: 7 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 4 }}>FERTIG</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#2ddb72' }}>{diag.leadsCompleted.length}</div>
            </div>
          </div>

          {/* Recent runs */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 14,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={8} /> LETZTE EXECUTIONS
            </div>
            {diag.runs.length === 0 ? (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-muted)' }}>Keine Runs gefunden.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {diag.runs.slice(0, 6).map(r => {
                  const ok = r.status === 'success', er = r.status === 'error'
                  const c = ok ? '#2ddb72' : er ? '#f03a3a' : r.status === 'running' ? color : 'var(--text-dim)'
                  const dur = r.stoppedAt && r.startedAt
                    ? new Date(r.stoppedAt).getTime() - new Date(r.startedAt).getTime() : null
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text-dim)', flex: 1 }}>#{r.id}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: c, fontWeight: 700 }}>{r.status?.toUpperCase()}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text-dim)', tabularNums: true }}>
                        {dur !== null ? formatDuration(dur) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deep monitors */}
          {agentId === 2 && <Agent2Monitor leads={leads} executions={executions} />}
          {agentId === 7 && <Agent7Monitor leads={leads} executions={executions} />}

          {onOpenLeads && diag.leadsAtStage.length > 0 && (
            <button onClick={onOpenLeads} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: color, background: `${color}0a`,
              border: `1px solid ${color}30`, borderRadius: 7,
              padding: '10px 14px', cursor: 'pointer', width: '100%',
              marginTop: 6,
            }}>
              <ArrowRight size={11} /> Leads in diesem Stage ansehen
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── Main MobileAgentCity ─────────────────────────────────────────
export default function MobileAgentCity({ leads = [], executions = [], onOpenPepeRoom, onOpenLeads }) {
  const [selectedAgent, setSelectedAgent] = useState(null)
  const pepe = usePepe({ leads, executions })
  const { sendAgentContext, status: twinStatus, setIsOpen: openTwin } = useTwin()

  function handleSelect(agentId) {
    setSelectedAgent(prev => prev === agentId ? null : agentId)
    if (twinStatus === 'connected') {
      const { err, lastStatus } = agentHealth(agentId, executions)
      const execStatus = err > 0 ? 'Fehler' : (lastStatus || 'unbekannt')
      const stageLeads = leads.filter(l => getLeadStage(l) >= agentId).length
      sendAgentContext(agentId, execStatus, stageLeads)
    }
  }

  return (
    <div style={{
      position: 'relative',
      marginBottom: 20,
      borderRadius: 12,
      overflow: 'hidden',
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(155,110,243,0.10) 0%, transparent 60%),
        linear-gradient(180deg, #07051a 0%, #060410 100%)
      `,
      border: '1px solid rgba(155,110,243,0.15)',
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '14px 14px 12px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.16em', color: 'rgba(155,110,243,0.55)', marginBottom: 2 }}>
              ◈ PDSTUDIO // AGENT CITY
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
              7 Agenten aktiv · Tippe für Details
            </div>
          </div>
          {/* System health badge */}
          {pepe?.systemHealth > 0 && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
              color: GOLD, padding: '3px 8px',
              background: `${GOLD}0a`,
              border: `1px solid ${GOLD}25`,
              borderRadius: 5,
            }}>
              {pepe.systemHealth}% HEALTH
            </div>
          )}
        </div>

        {/* Agent 2×N grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10,
        }}>
          {[1, 2, 3, 4, 5, 6].map(id => (
            <MobileAgentCard
              key={id}
              agentId={id}
              leads={leads}
              executions={executions}
              onSelect={handleSelect}
              isSelected={selectedAgent === id}
            />
          ))}

          {/* TWIN PEPE — spans full width in last row */}
          <motion.button
            onClick={() => {
              openTwin(true)
              if (twinStatus === 'connected') sendAgentContext(8, 'COMMAND_CORE', leads.length)
            }}
            whileTap={{ scale: 0.97 }}
            style={{
              gridColumn: '1 / -1',
              background: `rgba(255,215,0,0.04)`,
              border: `1px solid ${GOLD}30`,
              borderTop: `2px solid ${GOLD}`,
              borderRadius: 8,
              padding: '12px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.12em', color: `${GOLD}88`, marginBottom: 3 }}>
                A8 · CENTRAL INTELLIGENCE
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.04em' }}>
                TWIN PEPE
              </div>
              {pepe?.lastDecision && (
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 10, color: 'var(--text-dim)', marginTop: 3, lineHeight: 1.4, maxWidth: 220 }}>
                  {pepe.lastDecision.slice(0, 80)}{pepe.lastDecision.length > 80 ? '…' : ''}
                </div>
              )}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
              color: GOLD, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ENTER <ArrowRight size={10} />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {selectedAgent !== null && (
          <MobileAgentSheet
            key={selectedAgent}
            agentId={selectedAgent}
            leads={leads}
            executions={executions}
            onClose={() => setSelectedAgent(null)}
            onOpenLeads={onOpenLeads}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
