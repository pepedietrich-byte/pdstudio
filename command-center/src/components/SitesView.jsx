import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, ExternalLink, Sparkles, PenTool, ShieldCheck,
  ChevronRight, Loader2, CheckCircle2, AlertCircle, Calendar, Star,
} from 'lucide-react'
import {
  filterRelevantSites, getSiteDate, formatRelativeDate,
  useFreshSitesVersion, markSiteFresh, isFresh,
} from '../lib/sites'
import { triggerPolish, triggerWriter, triggerFactCheck } from '../lib/n8n'

const EASE = [0.23, 1, 0.32, 1]

function scoreColor(n) {
  if (n >= 60) return '#2ddb72'
  if (n >= 40) return '#f5a623'
  return '#f03a3a'
}

// ─── Site Card ──────────────────────────────────────────────────────────────
function SiteCard({ lead, onOpenLead }) {
  const [busy, setBusy]     = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  const url    = lead.build?.demo_url || ''
  const date   = getSiteDate(lead)
  const fresh  = isFresh(lead.lead_id)
  const score  = parseInt(lead.score || lead.audit_score || 0) || null
  const cuisine = lead.cuisine || lead.business?.cuisine || lead.branche || ''
  const name   = lead.business_name || lead.business?.name || lead.name || lead.lead_id

  async function doPolish() {
    setBusy('polish'); setError(''); setResult(null)
    try {
      const r = await triggerPolish(
        { ...lead, demo_url: url, business_name: name, cuisine, atmosphere: lead.atmosphere || lead.concept?.atmosphere || '' },
        { level: 'normal', focus: 'images' }
      )
      setResult({ kind: 'polish', data: r })
      if (r.polished_url) markSiteFresh(lead.lead_id, r.polished_url)
    } catch (e) { setError(e.message) }
    finally { setBusy(null) }
  }

  async function doWrite() {
    setBusy('write'); setError(''); setResult(null)
    try {
      const r = await triggerWriter(
        { ...lead, demo_url: url, business_name: name },
        { channel: 'email', context: 'demo_intro' }
      )
      setResult({ kind: 'write', data: r })
    } catch (e) { setError(e.message) }
    finally { setBusy(null) }
  }

  async function doCheck() {
    setBusy('check'); setError(''); setResult(null)
    try {
      const r = await triggerFactCheck({
        ...lead,
        business_name: name,
        website_url: lead.website_url || lead.business?.website || '',
        phone: lead.phone || lead.business?.phone || '',
        email: lead.email || lead.content?.email || '',
        address: lead.address || lead.business?.address || '',
      })
      setResult({ kind: 'check', data: r })
    } catch (e) { setError(e.message) }
    finally { setBusy(null) }
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t) } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(232,25,127,0.04)',
        border: '1px solid rgba(232,25,127,0.25)',
        boxShadow: fresh ? '0 0 28px rgba(232,25,127,0.18)' : 'none',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(232,25,127,0.15)' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate" style={{ color: '#e8edf4' }}>{name}</h3>
              {fresh && (
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-mono font-bold"
                  style={{ background: '#e8197f', color: '#fff' }}>NEU</span>
              )}
            </div>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono truncate hover:underline"
              style={{ color: '#e8197f' }}>
              <ExternalLink size={11} /> {url.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <div className="text-right text-[10px] space-y-0.5" style={{ color: '#6b7a90' }}>
            <div className="flex items-center gap-1 justify-end">
              <Calendar size={9} />
              <span>{formatRelativeDate(date)}</span>
            </div>
            {score !== null && (
              <div className="flex items-center gap-1 justify-end">
                <Star size={9} style={{ color: scoreColor(score) }} />
                <span style={{ color: scoreColor(score) }} className="font-mono font-bold">{score}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] mt-2" style={{ color: '#6b7a90' }}>
          {cuisine && (
            <div className="flex items-center gap-1">
              <span className="font-mono uppercase tracking-widest">{cuisine}</span>
            </div>
          )}
          {lead.build?.deploy_status && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: lead.build.deploy_status === 'success' ? '#39ff88' : '#f5a623' }} />
              <span>{lead.build.deploy_status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 grid grid-cols-2 gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium"
          style={{ background: 'rgba(232,25,127,0.15)', color: '#fff' }}>
          <Globe size={12} /> Seite öffnen
        </a>
        <button onClick={() => onOpenLead?.(lead)}
          className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ChevronRight size={12} /> Lead öffnen
        </button>
      </div>

      {/* Agent triggers */}
      <div className="p-3 pt-0 grid grid-cols-3 gap-2">
        <ActionButton
          onClick={doPolish} busy={busy === 'polish'} disabled={!!busy}
          color="#e8197f" icon={<Sparkles size={11} />} label="A3 Polish"
        />
        <ActionButton
          onClick={doWrite} busy={busy === 'write'} disabled={!!busy}
          color="#f5a623" icon={<PenTool size={11} />} label="A4 Email"
        />
        <ActionButton
          onClick={doCheck} busy={busy === 'check'} disabled={!!busy}
          color="#ff6b35" icon={<ShieldCheck size={11} />} label="A6 Check"
        />
      </div>

      {/* Result panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              <div className="p-3 rounded text-xs space-y-2"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {result.kind === 'polish' && <PolishResult data={result.data} />}
                {result.kind === 'write'  && <WriteResult  data={result.data} onCopy={copyText} />}
                {result.kind === 'check'  && <CheckResult  data={result.data} />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-3 pb-3">
          <div className="p-2 rounded text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</div>
        </div>
      )}
    </motion.div>
  )
}

function ActionButton({ onClick, busy, disabled, color, icon, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-all"
      style={{
        background: busy ? `${color}30` : `${color}12`,
        color: busy ? color : `${color}cc`,
        border: `1px solid ${color}35`,
        opacity: disabled && !busy ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      {busy ? <Loader2 size={11} className="animate-spin" /> : icon}
      {label}
    </button>
  )
}

function PolishResult({ data }) {
  const ok = data.deploy_status === 'success'
  return (
    <>
      <div className="flex items-center gap-2" style={{ color: ok ? '#39ff88' : '#ef4444' }}>
        {ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
        <span className="font-medium">A3 Polish · {data.duration_s}s</span>
      </div>
      {data.polished_url && (
        <a href={data.polished_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono" style={{ color: '#39ff88' }}>
          <ExternalLink size={10} /> {data.polished_url.replace(/^https?:\/\//, '')}
        </a>
      )}
      {data.error && <div style={{ color: '#ef4444' }}>{data.error}</div>}
    </>
  )
}

function WriteResult({ data, onCopy }) {
  const text = data.subject ? `Betreff: ${data.subject}\n\n${data.body}` : data.body
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: '#f5a623' }}>A4 Email · {data.word_count} Wörter</span>
        <button onClick={() => onCopy(text)} className="text-[10px] px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>kopieren</button>
      </div>
      {data.subject && (
        <div><span style={{ color: '#6b7a90' }}>Betreff:</span> <span style={{ color: '#e8edf4', fontWeight: 600 }}>{data.subject}</span></div>
      )}
      <pre className="whitespace-pre-wrap font-sans p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', lineHeight: 1.55, maxHeight: 200, overflowY: 'auto' }}>
        {data.body}
      </pre>
    </>
  )
}

function CheckResult({ data }) {
  const color = data.trust_score >= 70 ? '#39ff88' : data.trust_score >= 50 ? '#f5a623' : '#ef4444'
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: '#ff6b35' }}>A6 Fact Check</span>
        <span className="font-bold font-mono text-base" style={{ color }}>{data.trust_score}/100</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {(data.checks || []).map(c => (
          <div key={c.name} className="flex items-center gap-1.5">
            <span style={{ color: c.ok ? '#39ff88' : '#ef4444' }}>{c.ok ? '✓' : '✗'}</span>
            <span style={{ color: '#9ca3b5' }}>{c.name.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#6b7a90' }}>Empfehlung:</span>
        <span className="uppercase font-bold font-mono"
          style={{ color: data.recommendation === 'proceed' ? '#39ff88' : data.recommendation === 'review' ? '#f5a623' : '#ef4444' }}>
          {data.recommendation}
        </span>
      </div>
    </>
  )
}

// ─── Main SitesView ─────────────────────────────────────────────────────────
export default function SitesView({ leads = [], onOpenLead }) {
  useFreshSitesVersion()

  const sites = useMemo(() => {
    const filtered = filterRelevantSites(leads)
    return filtered.sort((a, b) => {
      const da = getSiteDate(a)?.getTime() || 0
      const db = getSiteDate(b)?.getTime() || 0
      return db - da
    })
  }, [leads])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#e8edf4' }}>
            Sites
          </h2>
          <p className="text-xs mt-1" style={{ color: '#6b7a90' }}>
            Nur gestern + heute deployed Demo-Sites · Ältere Sheet-Einträge sind ausgeblendet
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-bold" style={{ color: '#e8197f' }}>{sites.length}</div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>Aktive Demos</div>
        </div>
      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sites.map(lead => (
            <SiteCard key={lead.lead_id} lead={lead} onOpenLead={onOpenLead} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-lg gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
      <Globe size={36} style={{ color: '#6b7a90', opacity: 0.6 }} />
      <h3 className="font-semibold" style={{ color: '#e8edf4' }}>Noch keine aktiven Demos</h3>
      <p className="text-xs text-center max-w-sm" style={{ color: '#6b7a90' }}>
        Hier erscheinen Sites die heute oder gestern deployed wurden, sowie alle frisch gebauten Demos dieser Session.
        Ältere Sheet-Einträge werden nicht mehr angezeigt.
      </p>
      <p className="text-[10px] mt-2" style={{ color: '#6b7a90' }}>
        Tipp: Lead auswählen → A2 Mode "Runner (VPS)" → Build & Deploy
      </p>
    </div>
  )
}
