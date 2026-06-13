import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, PenTool, Calculator, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react'
import { triggerPolish, triggerWriter, triggerPricing, triggerFactCheck } from '../lib/n8n'

const AGENT_META = {
  3: { id: 3, name: 'Polish Agent',  short: 'A3', color: '#e8197f', icon: Sparkles,    desc: 'Bilder, Typo, Code polishen — Site wird neu deployed' },
  4: { id: 4, name: 'Human Writer',  short: 'A4', color: '#f5a623', icon: PenTool,     desc: 'Verkaufstexte in Pepes Stimme — E-Mail, SMS, WhatsApp' },
  5: { id: 5, name: 'Pricing Agent', short: 'A5', color: '#2ddb72', icon: Calculator,  desc: 'Preis, Closing-Chance, Pitch-Focus berechnen' },
  6: { id: 6, name: 'Fact Checker',  short: 'A6', color: '#ff6b35', icon: ShieldCheck, desc: 'Website/Telefon/E-Mail verifizieren, Trust Score' },
}

function AgentBlock({ agent, children, isExpanded, onToggle }) {
  const Icon = agent.icon
  return (
    <div className="rounded-lg overflow-hidden" style={{
      background: `${agent.color}08`,
      border: `1px solid ${agent.color}30`,
    }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div style={{ color: agent.color }}><Icon size={18} /></div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#e8edf4' }}>
              <span className="opacity-50 mr-2 font-mono text-xs">{agent.short}</span>
              {agent.name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7a90' }}>{agent.desc}</div>
          </div>
        </div>
        <div className="text-xs" style={{ color: agent.color }}>{isExpanded ? '▾' : '▸'}</div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResultBox({ result, color, children }) {
  return (
    <div className="mt-3 p-3 rounded text-sm space-y-2" style={{
      background: `${color}06`,
      border: `1px solid ${color}30`,
    }}>
      {children}
    </div>
  )
}

// ─── A3 Polish Panel ─────────────────────────────────────────────────────────
function A3Panel({ lead }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [opts, setOpts] = useState({ level: 'normal', focus: 'images' })
  const agent = AGENT_META[3]

  async function run() {
    if (state === 'building') return
    if (!lead?.demo_url && !lead?.build?.demo_url) {
      setError('Demo-URL fehlt — erst A2 ausführen'); setState('error'); return
    }
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerPolish(lead, opts)
      setResult(r)
      setState(r.deploy_status === 'success' ? 'done' : 'error')
      if (r.error) setError(r.error)
    } catch (e) {
      setState('error'); setError(e.message)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[10px] block mb-1.5 uppercase tracking-widest" style={{ color: '#6b7a90' }}>Level</label>
          <div className="flex gap-1">
            {['light', 'normal', 'deep'].map(l => (
              <button key={l} onClick={() => setOpts(o => ({ ...o, level: l }))}
                className="flex-1 py-1.5 text-xs rounded capitalize"
                style={{
                  background: opts.level === l ? `${agent.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${opts.level === l ? agent.color : 'rgba(255,255,255,0.08)'}`,
                  color: opts.level === l ? agent.color : '#9ca3b5',
                }}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] block mb-1.5 uppercase tracking-widest" style={{ color: '#6b7a90' }}>Focus</label>
          <select value={opts.focus} onChange={e => setOpts(o => ({ ...o, focus: e.target.value }))}
            className="w-full py-1.5 px-2 text-xs rounded"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8edf4' }}>
            <option value="images">Bilder</option>
            <option value="typography">Typographie</option>
            <option value="color">Farbe</option>
            <option value="layout">Layout</option>
            <option value="all">Alles</option>
          </select>
        </div>
      </div>
      <button onClick={run} disabled={state === 'building'}
        className="w-full py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2"
        style={{
          background: state === 'building' ? 'rgba(232,25,127,0.15)' : `linear-gradient(135deg, ${agent.color}, #b01464)`,
          color: '#fff', opacity: state === 'building' ? 0.7 : 1,
        }}>
        {state === 'building' ? <><Loader2 size={14} className="animate-spin" /> Polish läuft auf VPS...</> : <><Sparkles size={14} /> Site polishen + redeploy</>}
      </button>
      {result && (
        <ResultBox color={agent.color}>
          <div className="flex items-center gap-2" style={{ color: state === 'done' ? '#39ff88' : '#ef4444' }}>
            {state === 'done' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span className="font-medium text-xs">{state === 'done' ? 'Polished + Live' : 'Polish failed'}</span>
          </div>
          <div className="text-xs space-y-1" style={{ color: '#9ca3b5' }}>
            <div>Level: <span style={{ color: '#e8edf4' }}>{result.polish_level}</span> · Focus: <span style={{ color: '#e8edf4' }}>{result.polish_focus}</span></div>
            <div>Build: <span style={{ color: '#e8edf4' }}>{result.build_status}</span> · Deploy: <span style={{ color: '#e8edf4' }}>{result.deploy_status}</span></div>
            <div>Dauer: <span style={{ color: '#e8edf4' }}>{result.duration_s}s</span></div>
          </div>
          {result.polished_url && (
            <a href={result.polished_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#39ff88' }}>
              <ExternalLink size={12} /> {result.polished_url}
            </a>
          )}
          {error && <div className="text-xs" style={{ color: '#ef4444' }}>{error}</div>}
        </ResultBox>
      )}
    </>
  )
}

// ─── A4 Writer Panel ─────────────────────────────────────────────────────────
function A4Panel({ lead }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [channel, setChannel] = useState('email')
  const agent = AGENT_META[4]

  async function run() {
    if (state === 'building') return
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerWriter(lead, { channel })
      setResult(r); setState(r.error ? 'error' : 'done')
      if (r.error) setError(r.error)
    } catch (e) { setState('error'); setError(e.message) }
  }

  async function copyText() {
    if (!result?.body) return
    const text = result.subject ? `Betreff: ${result.subject}\n\n${result.body}` : result.body
    await navigator.clipboard.writeText(text)
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-1 mb-3">
        {['email', 'sms', 'whatsapp', 'call_script'].map(c => (
          <button key={c} onClick={() => setChannel(c)}
            className="py-1.5 text-[11px] rounded capitalize"
            style={{
              background: channel === c ? `${agent.color}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${channel === c ? agent.color : 'rgba(255,255,255,0.08)'}`,
              color: channel === c ? agent.color : '#9ca3b5',
            }}>{c === 'call_script' ? 'Script' : c}</button>
        ))}
      </div>
      <button onClick={run} disabled={state === 'building'}
        className="w-full py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2"
        style={{
          background: state === 'building' ? 'rgba(245,166,35,0.15)' : `linear-gradient(135deg, ${agent.color}, #d18816)`,
          color: '#fff', opacity: state === 'building' ? 0.7 : 1,
        }}>
        {state === 'building' ? <><Loader2 size={14} className="animate-spin" /> Schreibe...</> : <><PenTool size={14} /> Text schreiben</>}
      </button>
      {result && (
        <ResultBox color={agent.color}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: state === 'done' ? '#39ff88' : '#ef4444' }}>
              {state === 'done' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span className="font-medium text-xs">{result.channel} · {result.word_count} Wörter</span>
            </div>
            <button onClick={copyText} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3b5' }}>
              <Copy size={10} /> kopieren
            </button>
          </div>
          {result.subject && (
            <div className="text-xs"><span style={{ color: '#6b7a90' }}>Betreff: </span><span style={{ color: '#e8edf4' }}>{result.subject}</span></div>
          )}
          {result.body && (
            <pre className="text-xs whitespace-pre-wrap p-2 rounded font-sans" style={{ background: 'rgba(0,0,0,0.25)', color: '#cbd5e1', lineHeight: 1.6 }}>{result.body}</pre>
          )}
          {error && <div className="text-xs" style={{ color: '#ef4444' }}>{error}</div>}
        </ResultBox>
      )}
    </>
  )
}

// ─── A5 Pricing Panel ─────────────────────────────────────────────────────────
function A5Panel({ lead }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const agent = AGENT_META[5]

  async function run() {
    if (state === 'building') return
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerPricing(lead)
      setResult(r); setState(r.error ? 'error' : 'done')
      if (r.error) setError(r.error)
    } catch (e) { setState('error'); setError(e.message) }
  }

  return (
    <>
      <button onClick={run} disabled={state === 'building'}
        className="w-full py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2"
        style={{
          background: state === 'building' ? 'rgba(45,219,114,0.15)' : `linear-gradient(135deg, ${agent.color}, #1faa55)`,
          color: '#08090f', opacity: state === 'building' ? 0.7 : 1,
        }}>
        {state === 'building' ? <><Loader2 size={14} className="animate-spin" /> Rechne...</> : <><Calculator size={14} /> Preis berechnen</>}
      </button>
      {result && result.pricing && (
        <ResultBox color={agent.color}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>Minimum</div>
              <div className="text-lg font-bold font-mono" style={{ color: '#9ca3b5' }}>€{result.pricing.minimum}</div>
            </div>
            <div className="rounded p-1" style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: agent.color }}>Empfehlung</div>
              <div className="text-2xl font-bold font-mono" style={{ color: '#e8edf4' }}>€{result.pricing.recommended}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>Premium</div>
              <div className="text-lg font-bold font-mono" style={{ color: '#9ca3b5' }}>€{result.pricing.premium}</div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t" style={{ borderColor: `${agent.color}20` }}>
            <span style={{ color: '#6b7a90' }}>Setup einmalig:</span>
            <span style={{ color: '#e8edf4' }} className="font-mono">€{result.pricing.setup_min}–{result.pricing.setup_premium}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: '#6b7a90' }}>Closing-Chance:</span>
            <span className="font-bold font-mono text-base" style={{ color: result.closing_chance >= 0.7 ? '#39ff88' : result.closing_chance >= 0.4 ? '#f5a623' : '#ef4444' }}>
              {Math.round(result.closing_chance * 100)}%
            </span>
          </div>
          {result.pitch_focus && result.pitch_focus.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest pt-2 border-t" style={{ color: '#6b7a90', borderColor: `${agent.color}20` }}>Pitch Focus</div>
              {result.pitch_focus.map((p, i) => (
                <div key={i} className="text-xs italic" style={{ color: '#cbd5e1' }}>"{p}"</div>
              ))}
            </div>
          )}
          {error && <div className="text-xs" style={{ color: '#ef4444' }}>{error}</div>}
        </ResultBox>
      )}
    </>
  )
}

// ─── A6 Fact Check Panel ─────────────────────────────────────────────────────
function A6Panel({ lead }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const agent = AGENT_META[6]

  async function run() {
    if (state === 'building') return
    setState('building'); setError(''); setResult(null)
    try {
      const r = await triggerFactCheck(lead)
      setResult(r); setState(r.error ? 'error' : 'done')
      if (r.error) setError(r.error)
    } catch (e) { setState('error'); setError(e.message) }
  }

  return (
    <>
      <button onClick={run} disabled={state === 'building'}
        className="w-full py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2"
        style={{
          background: state === 'building' ? 'rgba(255,107,53,0.15)' : `linear-gradient(135deg, ${agent.color}, #d44a17)`,
          color: '#fff', opacity: state === 'building' ? 0.7 : 1,
        }}>
        {state === 'building' ? <><Loader2 size={14} className="animate-spin" /> Verifiziere...</> : <><ShieldCheck size={14} /> Daten verifizieren</>}
      </button>
      {result && (
        <ResultBox color={agent.color}>
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: `${agent.color}20` }}>
            <div className="text-xs uppercase tracking-widest" style={{ color: '#6b7a90' }}>Trust Score</div>
            <div className="font-bold text-2xl font-mono"
              style={{ color: result.trust_score >= 70 ? '#39ff88' : result.trust_score >= 50 ? '#f5a623' : '#ef4444' }}>
              {result.trust_score}/100
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {(result.checks || []).map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <span style={{ color: c.ok ? '#39ff88' : '#ef4444' }}>{c.ok ? '✓' : '✗'}</span>
                <span style={{ color: '#9ca3b5' }}>{c.name.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
          {result.red_flags && result.red_flags.length > 0 && (
            <div className="text-xs" style={{ color: '#ef4444' }}>
              Red flags: {result.red_flags.join(', ')}
            </div>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <div className="text-xs" style={{ color: '#f5a623' }}>
              Warnings: {result.warnings.join(', ')}
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t text-xs" style={{ borderColor: `${agent.color}20` }}>
            <span style={{ color: '#6b7a90' }}>Empfehlung:</span>
            <span className="font-bold uppercase font-mono"
              style={{ color: result.recommendation === 'proceed' ? '#39ff88' : result.recommendation === 'review' ? '#f5a623' : '#ef4444' }}>
              {result.recommendation} · {result.send_status}
            </span>
          </div>
          {error && <div className="text-xs" style={{ color: '#ef4444' }}>{error}</div>}
        </ResultBox>
      )}
    </>
  )
}

// ─── Main Agents Panel ────────────────────────────────────────────────────────
export default function AgentsPanel({ lead }) {
  const [expanded, setExpanded] = useState(null)

  const panels = [
    { id: 3, comp: A3Panel },
    { id: 4, comp: A4Panel },
    { id: 5, comp: A5Panel },
    { id: 6, comp: A6Panel },
  ]

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#6b7a90' }}>
        Agenten A3–A6 · Autonom auf VPS
      </div>
      {panels.map(({ id, comp: Panel }) => (
        <AgentBlock
          key={id}
          agent={AGENT_META[id]}
          isExpanded={expanded === id}
          onToggle={() => setExpanded(expanded === id ? null : id)}
        >
          <Panel lead={lead} />
        </AgentBlock>
      ))}
    </div>
  )
}
