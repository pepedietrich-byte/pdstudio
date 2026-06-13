import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  ArrowLeft, Brain, Activity, TrendingUp, AlertTriangle, CheckCircle,
  MessageSquare, Target, Shield, BarChart2, Zap, ExternalLink,
  ChevronDown, ChevronUp, Send, User, Clock, XCircle,
  DollarSign, Eye, Cpu, Layers, GitBranch,
} from 'lucide-react'
import { usePepe } from '../hooks/usePepe'
import { getLeadStage } from '../lib/sheets'
import { WORKFLOW_AGENT_MAP, AGENT_NAMES } from '../lib/n8n'
import RevenueBriefing from './Panels/RevenueBriefing'
import RunTimeline from './Panels/RunTimeline'
import SalesActionQueue from './Panels/SalesActionQueue'
import Agent2Monitor from './Panels/Agent2Monitor'
import Agent7Monitor from './Panels/Agent7Monitor'

const EASE  = [0.23, 1, 0.32, 1]
const GOLD  = '#ffd700'
const STAGE_LABELS = ['', 'LEAD', 'TEXT', 'IMG', 'VALID', 'CONCEPT', 'BUILD', 'LIVE']
const STAGE_COLORS = ['', '#00d4ff', '#e8197f', '#2ddb72', '#f5a623', '#9b6ef3', '#00d4ff', '#e8197f']
const AGENT_COLORS = { 1: '#00d4ff', 2: '#e8197f', 3: '#2ddb72', 4: '#f5a623', 5: '#9b6ef3', 6: '#00d4ff', 7: '#e8197f' }

// ── Reusable sub-components ──────────────────────────────────────────────────

function AnimNum({ value, color, size = 28 }) {
  const spring  = useSpring(0, { stiffness: 80, damping: 18 })
  const display = useTransform(spring, v => Math.round(v).toString())
  const prev    = useRef(0)
  useEffect(() => {
    if (value !== prev.current) { spring.set(value); prev.current = value }
  }, [value, spring])
  return <motion.span style={{ color, fontSize: size, fontFamily: 'var(--font-mono,monospace)', fontWeight: 700, lineHeight: 1 }}>{display}</motion.span>
}

function Card({ title, icon: Icon, color = GOLD, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: 'transparent', border: 'none' }}
      >
        {Icon && <Icon size={11} style={{ color, opacity: 0.7, flexShrink: 0 }} />}
        <span className="font-mono text-[10px] tracking-widest flex-1 text-left" style={{ color: 'var(--text-dim)' }}>{title}</span>
        {open ? <ChevronUp size={10} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={10} style={{ color: 'var(--text-dim)' }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-dim)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatTile({ label, value, suffix = '', color, icon: Icon }) {
  return (
    <div style={{ background: `${color}07`, border: `1px solid ${color}18`, borderRadius: 7, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        {Icon && <Icon size={9} style={{ color, opacity: 0.6 }} />}
        <span className="font-mono text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      </div>
      <AnimNum value={+value || 0} color={color} size={24} />
      {suffix && <span className="font-mono text-[9px] ml-0.5" style={{ color: `${color}80` }}>{suffix}</span>}
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = { HIGH: ['#f03a3a', 'rgba(240,58,58,0.1)'], MED: ['#f5a623', 'rgba(245,166,35,0.1)'], LOW: ['#484868', 'rgba(72,72,104,0.1)'] }
  const [color, bg] = map[priority] || map.LOW
  return (
    <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ color, background: bg, border: `1px solid ${color}30`, letterSpacing: '0.05em' }}>
      {priority}
    </span>
  )
}

// ── Mock Ask PEPE responses ──────────────────────────────────────────────────
function getMockAnswer(question, pepe) {
  const q = question.toLowerCase()
  if (q.includes('wertvoll') || q.includes('best') || q.includes('hot') || q.includes('lead')) {
    if (pepe.hotLeads.length === 0) return { answer: 'Ich habe aktuell keine Leads mit Score ≥ 60 gefunden.', sources: [] }
    const top = pepe.hotLeads.slice(0, 3)
    return {
      answer: `Die wertvollsten Leads sind: ${top.map(l => `"${l.name || l.lead_id}" (Score ${l.score || 0})`).join(', ')}.`,
      sources: top.map(l => ({ type: 'lead', id: l.lead_id, label: l.name || l.lead_id })),
    }
  }
  if (q.includes('bug') || q.includes('fehler') || q.includes('error')) {
    if (pepe.criticalBugs.length === 0) return { answer: 'Keine kritischen Fehler in den letzten 2 Stunden. Pipeline läuft sauber.', sources: [] }
    return {
      answer: `${pepe.criticalBugs.length} kritische Fehler in den letzten 2h erkannt. Betroffen: ${[...new Set(pepe.criticalBugs.map(e => AGENT_NAMES[WORKFLOW_AGENT_MAP[e.workflowId]] || e.workflowId))].join(', ')}.`,
      sources: pepe.criticalBugs.slice(0, 3).map(e => ({ type: 'execution', id: e.id, label: `Execution #${e.id}` })),
    }
  }
  if (q.includes('demo') || q.includes('versand') || q.includes('revenue') || q.includes('geld')) {
    if (pepe.revenueOpps.length === 0) return { answer: 'Keine fertigen Demos gefunden. Leads durch A7 laufen lassen.', sources: [] }
    const top = pepe.revenueOpps[0]
    return {
      answer: `${pepe.revenueOpps.length} Demo${pepe.revenueOpps.length > 1 ? 's' : ''} sind live. Empfehlung: "${top?.name || top?.lead_id}" zuerst kontaktieren.`,
      sources: pepe.revenueOpps.slice(0, 3).map(l => ({ type: 'demo', id: l.lead_id, label: l.name || l.lead_id, url: l.build?.demo_url })),
    }
  }
  if (q.includes('health') || q.includes('system') || q.includes('pipeline')) {
    return {
      answer: `System Health liegt bei ${pepe.systemHealth}%. Pipeline-Erfolgsrate: ${pepe.pipelineScore}%. ${pepe.activeAudits > 0 ? `${pepe.activeAudits} Agenten aktiv.` : 'Keine Agenten aktiv.'}`,
      sources: [],
    }
  }
  return {
    answer: `⚡ Phase 1 — Ask PEPE läuft noch mit Mock-Daten. Echte Gemini-Antworten kommen in Phase 8. Frage erkannt: "${question.slice(0, 60)}"`,
    sources: [],
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PepeControlRoom({ leads = [], executions = [], onBack }) {
  const pepe = usePepe({ leads, executions })
  const [chatMessages, setChatMessages] = useState([
    { role: 'pepe', text: 'PEPE online. Ich überwache alle Agenten, Leads, Demos und Bugs. Was möchtest du wissen?', ts: new Date() },
  ])
  const [chatInput,   setChatInput]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function sendChat(e) {
    e?.preventDefault()
    const q = chatInput.trim()
    if (!q || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: q, ts: new Date() }])
    setChatLoading(true)

    // Try real Gemini via serverless endpoint
    let answer = null
    let model  = null
    let sources = []
    let usedFallback = false

    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 15000)
      const r = await fetch('/api/pepe-ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body: JSON.stringify({
          question: q,
          context: {
            totalLeads:    pepe.total,
            hotLeads:      pepe.hotLeads.length,
            revenueOpps:   pepe.revenueOpps.length,
            criticalBugs:  pepe.criticalBugs.length,
            systemHealth:  pepe.systemHealth,
            pipelineScore: pepe.pipelineScore,
            topLead:       pepe.topLead ? { lead_id: pepe.topLead.lead_id, name: pepe.topLead.name, score: pepe.topLead.score } : null,
            agentErrors:   pepe.agentErrors,
          },
        }),
      })
      clearTimeout(t)
      const data = await r.json()
      if (data?.answer) {
        answer = data.answer
        model  = data.model
      } else {
        usedFallback = true
      }
    } catch {
      usedFallback = true
    }

    // Fallback: mock pattern-match
    if (!answer) {
      const mock = getMockAnswer(q, pepe)
      answer  = mock.answer
      sources = mock.sources || []
    }

    setChatMessages(prev => [...prev, {
      role: 'pepe', text: answer, sources, model,
      mock: usedFallback,
      ts: new Date(),
    }])
    setChatLoading(false)
  }

  const healthColor = pepe.systemHealth >= 80 ? '#2ddb72' : pepe.systemHealth >= 50 ? '#f5a623' : '#f03a3a'

  // Agent health derived from executions (last 10 per agent)
  const agentHealth = Object.entries(AGENT_NAMES).map(([id, name]) => {
    const wfId  = Object.keys(WORKFLOW_AGENT_MAP).find(k => WORKFLOW_AGENT_MAP[k] === +id)
    const runs  = executions.filter(e => e.workflowId === wfId).slice(0, 10)
    const ok    = runs.filter(e => e.status === 'success').length
    const err   = runs.filter(e => e.status === 'error').length
    const rate  = runs.length > 0 ? Math.round((ok / runs.length) * 100) : null
    const last  = runs[0]
    const color = AGENT_COLORS[+id] || '#00d4ff'
    return { id: +id, name, wfId, runs: runs.length, ok, err, rate, last, color }
  })

  // Top leads for intelligence section
  const topLeads = [...leads]
    .sort((a, b) => (+b.score || 0) - (+a.score || 0))
    .slice(0, 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="space-y-3"
    >
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 font-mono text-xs transition-colors"
        style={{ color: 'var(--text-dim)' }}
        onMouseEnter={e => e.currentTarget.style.color = GOLD}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
      >
        <ArrowLeft size={11} /> ZURÜCK ZUM CONTROL CENTER
      </button>

      {/* ── HERO HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.07) 0%, rgba(255,215,0,0.02) 60%, transparent 100%)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 32px rgba(255,215,0,0.15)', flexShrink: 0 }}>
            <Brain size={28} style={{ color: GOLD }} />
          </div>

          {/* Title block */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,215,0,0.5)' }}>PDSTUDIO // AGENT 8</div>
            <h1 className="font-ui font-black" style={{ fontSize: 32, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>PEPE</h1>
            <p className="font-ui text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Command Captain · System Brain · Revenue Supervisor · Auto-Fix Controller</p>
            {/* Status chips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'STUFE 1 — READ ONLY', color: '#2ddb72' },
                { label: 'Gemini 2.5 Pro', color: GOLD },
                { label: 'Vertex AI / pdstudio-ai', color: '#00d4ff' },
                { label: 'Mock AI — Phase 1', color: '#9b6ef3' },
              ].map(({ label, color }) => (
                <span key={label} className="font-mono text-[9px] px-2 py-0.5 rounded"
                  style={{ color, background: `${color}12`, border: `1px solid ${color}25`, letterSpacing: '0.04em' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Health score */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>SYSTEM HEALTH</div>
            <AnimNum value={pepe.systemHealth} color={healthColor} size={48} />
            <div className="font-mono text-[9px]" style={{ color: `${healthColor}80` }}>%</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: System Overview ── */}
      <Card title="SYSTEM OVERVIEW" icon={Activity} color="#00d4ff" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, paddingTop: 10 }}>
          <StatTile label="TOTAL LEADS"   value={pepe.total}               color="#00d4ff" icon={Layers}    />
          <StatTile label="HOT LEADS"     value={pepe.hotLeads.length}     color={GOLD}    icon={TrendingUp} />
          <StatTile label="PIPELINE"      value={pepe.pipelineActive}      color="#9b6ef3" icon={GitBranch} />
          <StatTile label="REVENUE DEMOS" value={pepe.revenueOpps.length}  color="#e8197f" icon={DollarSign} />
          <StatTile label="AKTIVE RUNS"   value={pepe.activeAudits}        color="#2ddb72" icon={Cpu}       />
          <StatTile label="PIPELINE %"    value={pepe.pipelineScore} suffix="%" color={pepe.pipelineScore >= 80 ? '#2ddb72' : '#f5a623'} icon={BarChart2} />
        </div>
      </Card>

      {/* ── SECTION 2: Lead Intelligence ── */}
      <Card title="LEAD INTELLIGENCE" icon={TrendingUp} color={GOLD} defaultOpen>
        <div style={{ paddingTop: 10 }}>
          {topLeads.length === 0 ? (
            <EmptyState>Keine Leads gefunden. Daten werden nach nächstem Refresh geladen.</EmptyState>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 48px 80px 90px', gap: 8, padding: '4px 8px', marginBottom: 2 }}>
                {['#', 'NAME', 'SCORE', 'STAGE', 'EMPFEHLUNG'].map(h => (
                  <span key={h} className="font-mono text-[8px] tracking-wider" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>{h}</span>
                ))}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {topLeads.map((lead, i) => {
                  const score = +lead.score || 0
                  const stage = getLeadStage(lead)
                  const sc    = score >= 60 ? '#2ddb72' : score >= 40 ? '#f5a623' : '#f03a3a'
                  const hasDemo = !!(lead.build?.demo_url && /^https?:\/\//.test(lead.build.demo_url))
                  const tag   = hasDemo ? ['VERSAND BEREIT', '#2ddb72'] : score >= 60 ? ['HOT', GOLD] : stage >= 4 ? ['IN PIPELINE', '#9b6ef3'] : ['NEEDS WORK', '#f5a623']
                  return (
                    <motion.div key={lead.lead_id || i}
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.14, ease: EASE }}
                      style={{ display: 'grid', gridTemplateColumns: '24px 1fr 48px 80px 90px', gap: 8, padding: '7px 8px', borderRadius: 5, borderBottom: '1px solid var(--border-dim)', alignItems: 'center' }}
                      whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="font-mono text-[9px] tabular-nums text-right" style={{ color: 'var(--text-dim)' }}>{i + 1}</span>
                      <span className="font-ui text-xs truncate" style={{ color: 'var(--text-hi)' }}>{lead.name || lead.lead_id}</span>
                      <span className="font-mono text-sm font-black tabular-nums text-right" style={{ color: sc }}>{score || '—'}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded w-fit"
                        style={{ color: STAGE_COLORS[stage] || 'var(--text-dim)', background: `${STAGE_COLORS[stage] || '#888'}10`, border: `1px solid ${STAGE_COLORS[stage] || '#888'}22` }}>
                        A{stage} {STAGE_LABELS[stage]}
                      </span>
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                        style={{ color: tag[1], background: `${tag[1]}10`, border: `1px solid ${tag[1]}22` }}>
                        {tag[0]}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── SECTION 3: Agent Health ── */}
      <Card title="AGENT HEALTH" icon={Shield} color="#2ddb72">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, paddingTop: 10 }}>
          {agentHealth.map(a => {
            const ok    = a.rate !== null
            const rate  = a.rate ?? 100
            const rc    = rate >= 80 ? '#2ddb72' : rate >= 50 ? '#f5a623' : '#f03a3a'
            const lastStatus = a.last?.status
            return (
              <div key={a.id} style={{ background: `${a.color}06`, border: `1px solid ${a.color}18`, borderRadius: 7, padding: '9px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: lastStatus === 'success' ? '#2ddb72' : lastStatus === 'error' ? '#f03a3a' : lastStatus === 'running' ? a.color : 'rgba(255,255,255,0.2)', boxShadow: lastStatus === 'running' ? `0 0 6px ${a.color}` : 'none' }} />
                  <span className="font-mono text-[9px] tracking-wider flex-1 truncate" style={{ color: a.color }}>{a.name}</span>
                  <span className="font-mono text-[8px]" style={{ color: 'var(--text-dim)' }}>A{a.id}</span>
                </div>
                {ok ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>{a.runs} runs</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: rc }}>{rate}%</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                      <motion.div style={{ height: '100%', background: rc, borderRadius: 1 }}
                        initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                        transition={{ duration: 0.6, ease: EASE }} />
                    </div>
                  </>
                ) : (
                  <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>Keine Runs heute</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── SECTION 4: Bug & Fix Center ── */}
      <Card title="BUG & FIX CENTER" icon={AlertTriangle} color="#f03a3a">
        <div style={{ paddingTop: 10 }}>
          {pepe.criticalBugs.length === 0 && pepe.agentErrors.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
              <CheckCircle size={14} style={{ color: '#2ddb72' }} />
              <span className="font-mono text-xs" style={{ color: '#2ddb72' }}>Keine kritischen Bugs in den letzten 2 Stunden. System läuft sauber.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pepe.agentErrors.map(ae => (
                <div key={ae.agentId} style={{ background: 'rgba(240,58,58,0.05)', border: '1px solid rgba(240,58,58,0.2)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <XCircle size={11} style={{ color: '#f03a3a', flexShrink: 0 }} />
                    <span className="font-ui text-sm font-medium" style={{ color: '#f03a3a' }}>Agent {ae.agentId} — {ae.agentName}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ color: '#f03a3a', background: 'rgba(240,58,58,0.1)', border: '1px solid rgba(240,58,58,0.2)' }}>
                      {ae.count} Fehler heute
                    </span>
                  </div>
                  <p className="font-mono text-[10px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    ⚡ PEPE Analyse (Phase 1 Mock): Fehler in Agent {ae.agentId} erkannt. Letzte Execution ID: {ae.lastError?.id || '—'}. Status: {ae.lastError?.status || '—'}. Fix-Task-Generierung ab Phase 6 verfügbar.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── A2 + A7 DEEP MONITORS ── */}
      <Card title="A2 + A7 DEEP MONITORS" icon={Shield} color="#e8197f">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, paddingTop: 10 }}>
          <Agent2Monitor leads={leads} executions={executions} />
          <Agent7Monitor leads={leads} executions={executions} />
        </div>
      </Card>

      {/* ── DAILY REVENUE BRIEFING ── */}
      <Card title="DAILY REVENUE BRIEFING" icon={DollarSign} color={GOLD}>
        <div style={{ paddingTop: 10 }}>
          <RevenueBriefing leads={leads} executions={executions} />
        </div>
      </Card>

      {/* ── SECTION 5: Revenue Opportunities ── */}
      <Card title="REVENUE OPPORTUNITIES" icon={DollarSign} color="#e8197f">
        <div style={{ paddingTop: 10 }}>
          {pepe.revenueOpps.length === 0 ? (
            <EmptyState>Keine Live-Demos gefunden. Nach A7-Build erscheinen Demos hier.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pepe.revenueOpps.map((lead, i) => {
                const score = +lead.score || 0
                const offer = score >= 70 ? '1.500 € Premium' : score >= 50 ? '900 € Redesign' : '500 € Starter'
                return (
                  <motion.div key={lead.lead_id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.16, ease: EASE }}
                    style={{ background: 'rgba(232,25,127,0.04)', border: '1px solid rgba(232,25,127,0.18)', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div className="font-ui text-sm font-medium" style={{ color: 'var(--text-hi)' }}>{lead.name || lead.lead_id}</div>
                      <div className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>Score {score} · A7 LIVE</div>
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: '#e8197f' }}>{offer}</span>
                    <a href={lead.build?.demo_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded transition-opacity hover:opacity-80"
                      style={{ color: '#e8197f', background: 'rgba(232,25,127,0.1)', border: '1px solid rgba(232,25,127,0.25)' }}>
                      <ExternalLink size={9} /> Demo
                    </a>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* ── SECTION 6: Demo Quality Gate ── */}
      <Card title="DEMO QUALITY GATE" icon={Eye} color="#9b6ef3">
        <div style={{ paddingTop: 10 }}>
          {pepe.revenueOpps.length === 0 ? (
            <EmptyState>Keine Demos vorhanden. Nach A7-Build erscheinen Demos hier zur Qualitätsprüfung.</EmptyState>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {pepe.revenueOpps.map(lead => {
                const heroUrl = lead.images?.hero_url || ''
                const score = +lead.score || 0
                const approved = score >= 50
                return (
                  <div key={lead.lead_id} style={{ background: 'var(--bg-card)', border: `1px solid ${approved ? 'rgba(45,219,114,0.25)' : 'rgba(245,166,35,0.25)'}`, borderRadius: 7, overflow: 'hidden' }}>
                    <div style={{ height: 80, background: heroUrl ? `url(${heroUrl}) center/cover` : 'rgba(255,255,255,0.03)', position: 'relative' }}>
                      {!heroUrl && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={20} style={{ color: 'rgba(255,255,255,0.1)' }} /></div>}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div className="font-ui text-xs font-medium truncate" style={{ color: 'var(--text-hi)' }}>{lead.name || lead.lead_id}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>Score {score}</span>
                        <span className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                          style={{ color: approved ? '#2ddb72' : '#f5a623', background: approved ? 'rgba(45,219,114,0.1)' : 'rgba(245,166,35,0.1)', border: `1px solid ${approved ? 'rgba(45,219,114,0.2)' : 'rgba(245,166,35,0.2)'}` }}>
                          {approved ? '✓ APPROVED' : '⚠ REVIEW'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="font-mono text-[9px] mt-3" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            ⚡ Vollständige Qualitätsprüfung (Design, Copy, Mobile, CTA, Trust) ab Phase 9.
          </p>
        </div>
      </Card>

      {/* ── SECTION 7: Recommended Actions ── */}
      <Card title="RECOMMENDED ACTIONS" icon={Target} color="#00d4ff" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
          {pepe.recommendations.map((rec, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.16, ease: EASE }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: 6 }}
            >
              <PriorityBadge priority={rec.priority} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-ui text-xs font-medium" style={{ color: 'var(--text-hi)' }}>{rec.title}</div>
                <div className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{rec.reason}</div>
              </div>
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)' }}>
                {rec.target}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* ── SALES ACTION QUEUE ── */}
      <Card title="SALES ACTION QUEUE" icon={Target} color="#2ddb72">
        <div style={{ paddingTop: 10 }}>
          <SalesActionQueue leads={leads} />
        </div>
      </Card>

      {/* ── AGENT RUN TIMELINE ── */}
      <Card title="AGENT RUN TIMELINE" icon={Clock} color="#9b6ef3">
        <div style={{ paddingTop: 10 }}>
          <RunTimeline executions={executions} />
        </div>
      </Card>

      {/* ── SECTION 8: Ask PEPE Chat ── */}
      <Card title="ASK PEPE" icon={MessageSquare} color={GOLD} defaultOpen>
        <div style={{ paddingTop: 10 }}>
          {/* Messages */}
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {chatMessages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: EASE }}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: msg.role === 'pepe' ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${msg.role === 'pepe' ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
                  {msg.role === 'pepe' ? <Brain size={11} style={{ color: GOLD }} /> : <User size={11} style={{ color: 'var(--text-dim)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: msg.role === 'pepe' ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'pepe' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '8px 10px' }}>
                    <p className="font-ui text-xs leading-relaxed" style={{ color: msg.role === 'pepe' ? 'var(--text)' : 'var(--text-dim)' }}>{msg.text}</p>
                    {msg.sources?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {msg.sources.map((s, si) => (
                          <span key={si} className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                            style={{ color: '#00d4ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-[8px] mt-1 px-1" style={{ color: 'var(--text-dim)', opacity: 0.4, textAlign: msg.role === 'user' ? 'right' : 'left', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                    <span>{msg.ts.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'pepe' && msg.model && !msg.mock && (
                      <span style={{ color: '#9b6ef3' }}>· {msg.model}</span>
                    )}
                    {msg.role === 'pepe' && msg.mock && (
                      <span style={{ color: '#f5a623' }}>· mock fallback</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}>
                  <Brain size={11} style={{ color: GOLD }} />
                </div>
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendChat} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Frag PEPE... (z.B. Welche Leads sind am wertvollsten?)"
              disabled={chatLoading}
              className="flex-1 rounded px-3 py-2 font-mono text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,215,0,0.2)`, color: 'var(--text)', transition: 'border-color 200ms' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,215,0,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,215,0,0.2)' }}
            />
            <motion.button type="submit" disabled={!chatInput.trim() || chatLoading}
              whileHover={chatInput.trim() && !chatLoading ? { scale: 1.05, boxShadow: `0 0 16px rgba(255,215,0,0.3)` } : {}}
              whileTap={chatInput.trim() && !chatLoading ? { scale: 0.96 } : {}}
              style={{ width: 36, height: 36, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: chatInput.trim() && !chatLoading ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${chatInput.trim() && !chatLoading ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed', transition: 'all 150ms' }}>
              <Send size={12} style={{ color: chatInput.trim() && !chatLoading ? GOLD : 'var(--text-dim)' }} />
            </motion.button>
          </form>
          <p className="font-mono text-[8px] mt-2" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>
            ⚡ Live Gemini via /api/pepe-ask (Routing: pro/flash/lite). Fallback auf Mock wenn GEMINI_API_KEY fehlt.
          </p>
        </div>
      </Card>

      {/* ── SECTION 9: Model Routing ── */}
      <Card title="MODEL ROUTING — GEMINI TIER SYSTEM" icon={Zap} color="#9b6ef3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10 }}>
          {[
            { model: 'gemini-2.5-pro', tier: 'SPITZENMODELL', usage: 'Schwere Entscheidungen, Verkaufsstrategie, komplexe Fehleranalyse, Demo-Qualitätskontrolle, Auto-Fix Planung', color: GOLD, status: 'KONFIGURIERT' },
            { model: 'gemini-2.5-flash', tier: 'ALLROUNDER', usage: 'Normale Audits, Lead-Bewertung, Agent-Prüfung, Dashboard-Antworten, Bugzusammenfassung', color: '#00d4ff', status: 'KONFIGURIERT' },
            { model: 'gemini-2.5-flash-lite', tier: 'BASIC', usage: 'Schnelle Klassifizierung, Lead-Vorsortierung, kurze Checks, günstige Routineaufgaben', color: '#9b6ef3', status: 'KONFIGURIERT' },
          ].map(({ model, tier, usage, color, status }) => (
            <div key={model} style={{ background: `${color}06`, border: `1px solid ${color}18`, borderRadius: 7, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 160 }}>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}>{tier}</span>
                <div className="font-mono text-xs font-bold mt-1" style={{ color }}>{model}</div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p className="font-ui text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{usage}</p>
              </div>
              <span className="font-mono text-[8px] px-2 py-1 rounded flex-shrink-0" style={{ color: '#2ddb72', background: 'rgba(45,219,114,0.08)', border: '1px solid rgba(45,219,114,0.2)' }}>
                ✓ {status}
              </span>
            </div>
          ))}
          <p className="font-mono text-[9px] mt-2" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            ⚡ Aktive Gemini-Calls ab Phase 7. Projekt: pdstudio-ai · Region: us-central1 · Quota: 1000 RPM
          </p>
        </div>
      </Card>

      {/* ── SECTION 10: Audit History ── */}
      <Card title="AUDIT HISTORY" icon={Clock} color="var(--text-dim)" defaultOpen={false}>
        <div style={{ paddingTop: 10 }}>
          <EmptyState>
            Audit-History wird ab Phase 6 in Supabase (Tabelle: pepe_audits) gespeichert.
            Nach jedem n8n-Agentenlauf speichert PEPE Verdict, Quality-Score, Risk-Level und Empfehlungen.
          </EmptyState>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: 6 }}>
            <div className="font-mono text-[9px] tracking-widest mb-3" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>GEPLANTE TABELLEN</div>
            {['pepe_audits', 'pepe_memory', 'pepe_fix_queue', 'pepe_revenue_opportunities', 'pepe_demo_reviews'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>{t}</span>
                <span className="font-mono text-[8px] ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>Phase 6</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function EmptyState({ children }) {
  return (
    <div style={{ padding: '16px 0', textAlign: 'center' }}>
      <p className="font-mono text-[10px] leading-relaxed" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{children}</p>
    </div>
  )
}
