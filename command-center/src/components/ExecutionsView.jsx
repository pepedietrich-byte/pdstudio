import { motion, AnimatePresence } from 'framer-motion'
import { Activity, RefreshCw, CheckCircle2, XCircle, Loader2, Clock, Square } from 'lucide-react'
import { WORKFLOW_AGENT_MAP, AGENT_NAMES } from '../lib/n8n'

const EASE_OUT = [0.23, 1, 0.32, 1]

function statusColor(status) {
  if (status === 'success') return '#39ff88'
  if (status === 'error')   return '#ff3b3b'
  if (status === 'running') return '#00e5ff'
  if (status === 'crashed') return '#ff3b3b'
  return '#6b6b8a'
}

function StatusIcon({ status, size = 11 }) {
  if (status === 'success') return <CheckCircle2 size={size} style={{ color: '#39ff88' }} />
  if (status === 'error' || status === 'crashed')
    return <XCircle size={size} style={{ color: '#ff3b3b' }} />
  if (status === 'running')
    return (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Loader2 size={size} style={{ color: '#00e5ff' }} />
      </motion.div>
    )
  return <Clock size={size} style={{ color: '#6b6b8a' }} />
}

function formatDuration(started, stopped) {
  if (!started) return ''
  const s = new Date(started)
  const e = stopped ? new Date(stopped) : new Date()
  const ms = e - s
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function agentLabel(workflowId) {
  const agentNum = WORKFLOW_AGENT_MAP[workflowId]
  if (!agentNum) return workflowId ? `WF ${workflowId.slice(0, 6)}` : 'Unknown'
  return `A${agentNum.toString().padStart(2, '0')} ${AGENT_NAMES[agentNum]}`
}

function agentColor(workflowId) {
  const agentNum = WORKFLOW_AGENT_MAP[workflowId]
  const colors = [null, '#00e5ff','#ff2d9b','#39ff88','#ffb800','#a855f7','#00e5ff','#ff2d9b']
  return colors[agentNum] || '#6b6b8a'
}

export default function ExecutionsView({ executions = [], stop, stopping = new Set(), refresh }) {
  const running = executions.filter(e => e.status === 'running')

  return (
    <div className="hud-border p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-3">
        <Activity size={12} className="text-cyan/60" />
        <span className="font-mono text-[10px] tracking-widest text-cyan/60">N8N EXECUTIONS</span>

        {running.length > 0 && (
          <div className="flex items-center gap-1.5 ml-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00e5ff' }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: EASE_OUT }}
            />
            <span className="font-mono text-[9px] text-cyan">{running.length} RUNNING</span>
          </div>
        )}

        {/* Stop all running */}
        {running.length > 0 && stop && (
          <button
            onClick={() => running.forEach(e => stop(e.id))}
            className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] transition-colors"
            style={{ background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.3)', color: '#ff3b3b' }}
            title="Alle laufenden stoppen"
          >
            <Square size={8} />
            STOP ALL
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] text-white/30">{executions.length} TOTAL</span>
          <button
            onClick={refresh}
            className="p-1 rounded hover:text-cyan text-white/30 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* List */}
      {executions.length === 0 ? (
        <div className="text-center py-10 text-white/20 font-mono text-xs tracking-wider">
          NO EXECUTIONS // CONFIGURE N8N_API_KEY
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {executions.map((exec, i) => {
              const color    = statusColor(exec.status)
              const aColor   = agentColor(exec.workflowId)
              const label    = agentLabel(exec.workflowId)
              const isRunning = exec.status === 'running'
              const isStopping = stopping.has(exec.id)

              return (
                <motion.div
                  key={exec.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, delay: i * 0.015, ease: EASE_OUT }}
                  className="relative flex items-center gap-3 py-1.5 px-2 rounded group hover:bg-white/[0.03] transition-colors"
                  style={isRunning ? { background: 'rgba(0,229,255,0.04)' } : {}}
                >
                  <div className="flex-shrink-0 w-3 flex items-center justify-center">
                    <StatusIcon status={exec.status} size={11} />
                  </div>

                  <span className="font-mono text-[10px] text-white/20 flex-shrink-0 tabular-nums w-8">
                    #{exec.id}
                  </span>

                  <div
                    className="font-mono text-[10px] font-bold flex-shrink-0 w-32 truncate"
                    style={{ color: aColor }}
                  >
                    {label}
                  </div>

                  <div
                    className="font-mono text-[9px] tracking-wider flex-shrink-0 w-16"
                    style={{ color }}
                  >
                    {exec.status?.toUpperCase()}
                  </div>

                  <div className="font-mono text-[9px] text-white/30 flex-shrink-0 w-14 tabular-nums">
                    {formatDuration(exec.startedAt, exec.stoppedAt)}
                  </div>

                  <div className="font-mono text-[9px] text-white/20 flex-shrink-0 ml-auto tabular-nums">
                    {formatTime(exec.startedAt)}
                  </div>

                  {/* Stop button for running executions */}
                  {isRunning && stop && (
                    <button
                      onClick={() => stop(exec.id)}
                      disabled={isStopping}
                      className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] transition-all opacity-0 group-hover:opacity-100"
                      style={{
                        background: isStopping ? 'rgba(107,107,138,0.2)' : 'rgba(255,59,59,0.15)',
                        border: `1px solid ${isStopping ? 'rgba(107,107,138,0.3)' : 'rgba(255,59,59,0.4)'}`,
                        color: isStopping ? '#6b6b8a' : '#ff3b3b',
                      }}
                      title="Execution stoppen"
                    >
                      {isStopping ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Loader2 size={8} />
                        </motion.div>
                      ) : (
                        <Square size={8} />
                      )}
                      STOP
                    </button>
                  )}

                  {isRunning && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l"
                      style={{ background: '#00e5ff' }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: EASE_OUT }}
                    />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center gap-1.5">
        <motion.div
          className="w-1 h-1 rounded-full bg-white/20"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <span className="font-mono text-[9px] text-white/20">AUTO-REFRESH // 8s</span>
      </div>
    </div>
  )
}
