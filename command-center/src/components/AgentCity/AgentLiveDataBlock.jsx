// ─── Agent Live Data Block ──────────────────────────────────────────────────
// Zeigt pro Agent die echten Outputs aus den neuen Lib-Funktionen
// für den activeLead. Wenn keine Daten verfügbar: ehrliches "noch nicht
// ausgeführt" statt Fake-Display.

import { useMemo } from 'react'
import {
  Target, ShieldCheck, Image, PenLine, DollarSign,
  Sparkles, Activity, AlertTriangle, CheckCircle2, XCircle, Wrench, Send,
} from 'lucide-react'
import { qualifyLead } from '../../lib/leadQualifier'
import { runFactCheck } from '../../lib/factChecker'
import { analyzeAssets } from '../../lib/assetAnalysis'
import { runPreBuildGate } from '../../lib/preBuildGate'
import { listTools } from '../../services/twin/toolRegistry'

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="rounded p-3 text-center" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px dashed rgba(255,255,255,0.1)',
    }}>
      {Icon && <Icon size={16} className="mx-auto mb-1.5 opacity-40" style={{ color: '#6b7a90' }} />}
      <div className="text-[10px]" style={{ color: '#6b7a90' }}>{message}</div>
    </div>
  )
}

function Row({ label, value, color = '#cbd5e1', mono = true }) {
  return (
    <div className="flex items-center justify-between py-1 border-b last:border-b-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>{label}</span>
      <span className={`text-[11px] ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</span>
    </div>
  )
}

// ── A1 Lead Qualifier Block ──────────────────────────────────────────────
function A1Block({ lead }) {
  const q = useMemo(() => { try { return qualifyLead(lead) } catch { return null } }, [lead])
  if (!q || q.error) return <EmptyState icon={Target} message="A1: Lead-Daten unvollständig — qualifier kann nicht laufen" />

  const band = q.scoreBand
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        <Stat label="Score" value={q.leadScore} color={band.color} />
        <Stat label="Demo" value={q.demoBuildPotential + '%'} />
        <Stat label="Sales" value={q.salesPotential + '%'} />
        <Stat label="Data" value={q.dataConfidence + '%'} />
      </div>
      <div className="rounded p-2"
        style={{ background: `${band.color}10`, border: `1px solid ${band.color}30` }}>
        <div className="font-mono text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: band.color }}>
          {band.label}
        </div>
        <div className="text-[10px] leading-relaxed" style={{ color: '#cbd5e1' }}>
          {q.recommendedNextAction}
        </div>
      </div>
      {q.weaknesses.length > 0 && (
        <Group title={`Schwächen (${q.weaknesses.length})`} color="#ef4444" icon={AlertTriangle}>
          {q.weaknesses.slice(0, 3).map((w, i) => <li key={i}>· {w}</li>)}
        </Group>
      )}
      {q.opportunities.length > 0 && (
        <Group title={`Chancen (${q.opportunities.length})`} color="#39ff88" icon={Sparkles}>
          {q.opportunities.slice(0, 3).map((o, i) => <li key={i}>· {o}</li>)}
        </Group>
      )}
      <Group title="Top-Reasons" color="#9ca3b5" icon={Activity}>
        {[...q.scoreReasons].sort((a, b) => b.impact - a.impact).slice(0, 3).map((r, i) => (
          <li key={i} className="font-mono">+{r.impact} · {r.reason}</li>
        ))}
      </Group>
    </div>
  )
}

// ── A6 Fact Checker Block (in 6-Agent UI: A6 = Fact Checker) ─────────────
function A6Block({ lead }) {
  const fc = useMemo(() => { try { return runFactCheck(lead) } catch { return null } }, [lead])
  if (!fc) return <EmptyState icon={ShieldCheck} message="A6: kein Fact Check möglich (lead missing)" />

  return (
    <div className="space-y-2">
      <div className="rounded p-2"
        style={{
          background: fc.sendReady ? 'rgba(57,255,136,0.06)' : fc.factGatePassed ? 'rgba(245,166,35,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${fc.sendReady ? 'rgba(57,255,136,0.3)' : fc.factGatePassed ? 'rgba(245,166,35,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
        <div className="font-mono text-[9px] uppercase tracking-widest font-bold"
          style={{ color: fc.sendReady ? '#39ff88' : fc.factGatePassed ? '#f5a623' : '#ef4444' }}>
          {fc.sendReady ? 'Send Ready' : fc.factGatePassed ? 'Gate OK · Review' : 'Gate Blocked'}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Contact" value={fc.contactConfidence + '%'} />
        <Stat label="Menu" value={fc.menuConfidence + '%'} />
        <Stat label="Price" value={fc.priceConfidence + '%'} />
      </div>
      <Group title={`Verified (${Object.keys(fc.verifiedFacts).length})`} color="#39ff88" icon={CheckCircle2}>
        {Object.entries(fc.verifiedFacts).slice(0, 4).map(([k, v]) => (
          <li key={k} className="font-mono">· {k}: {typeof v === 'boolean' ? '✓' : String(v).slice(0, 30)}</li>
        ))}
      </Group>
      {Object.keys(fc.uncertainFacts).length > 0 && (
        <Group title={`Uncertain (${Object.keys(fc.uncertainFacts).length})`} color="#f5a623" icon={AlertTriangle}>
          {Object.entries(fc.uncertainFacts).slice(0, 3).map(([k, info]) => (
            <li key={k}>· {k}: {info.reason}</li>
          ))}
        </Group>
      )}
      {fc.conflicts.length > 0 && (
        <Group title={`Konflikte (${fc.conflicts.length})`} color="#ef4444" icon={XCircle}>
          {fc.conflicts.slice(0, 2).map((c, i) => (
            <li key={i}>· {c.field}: {(c.values || []).map(v => String(v).slice(0, 20)).join(' vs ')}</li>
          ))}
        </Group>
      )}
      {fc.blockingReasons?.length > 0 && (
        <Group title="Blocking" color="#ef4444" icon={XCircle}>
          {fc.blockingReasons.map((r, i) => <li key={i}>· {r}</li>)}
        </Group>
      )}
    </div>
  )
}

// ── A3 Polish (Assets) Block ─────────────────────────────────────────────
function A3Block({ lead, assets }) {
  const a = useMemo(() => {
    try {
      const allAssets = Array.isArray(assets) ? assets : []
      if (allAssets.length === 0) return null
      return analyzeAssets(lead, allAssets)
    } catch { return null }
  }, [lead, assets])

  if (!a) {
    return <EmptyState icon={Image} message="A3: keine Assets zum Bewerten verfügbar. Lade Bilder oder lass A2 sie extrahieren." />
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        <Stat label="Total" value={a.summary.total} />
        <Stat label="Hero" value={a.summary.heroReady} color="#39ff88" />
        <Stat label="Usable" value={a.summary.usable} />
        <Stat label="Reject" value={a.summary.rejected} color="#ef4444" />
      </div>
      <div className="rounded p-2"
        style={{
          background: a.assetGatePassed ? 'rgba(57,255,136,0.05)' : 'rgba(239,68,68,0.05)',
          border: `1px solid ${a.assetGatePassed ? 'rgba(57,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
        <div className="font-mono text-[9px] uppercase tracking-widest font-bold"
          style={{ color: a.assetGatePassed ? '#39ff88' : '#ef4444' }}>
          Asset Gate: {a.assetGatePassed ? 'PASSED' : 'BLOCKED'}
        </div>
      </div>
      {a.selectedHeroAsset && (
        <Group title="Hero ausgewählt" color="#39ff88" icon={CheckCircle2}>
          <li className="font-mono break-all">{String(a.selectedHeroAsset.url).slice(0, 50)}</li>
          <li>Score {a.selectedHeroAsset.totalScore} · Cat-Fit {a.selectedHeroAsset.categoryFit}/25</li>
        </Group>
      )}
      {a.poeGenerationNeeded && (
        <Group title="Poe-Hero nötig" color="#f5a623" icon={Sparkles}>
          <li className="text-[9px]">{(a.poePromptSuggestion || '').slice(0, 140)}…</li>
        </Group>
      )}
      {a.assetGateReasons.length > 0 && (
        <Group title="Gate Reasons" color="#9ca3b5" icon={Activity}>
          {a.assetGateReasons.map((r, i) => <li key={i}>· {r}</li>)}
        </Group>
      )}
    </div>
  )
}

// ── A4 Human Writer Block ────────────────────────────────────────────────
function A4Block({ lead, savedDrafts }) {
  const fc = useMemo(() => { try { return runFactCheck(lead) } catch { return null } }, [lead])
  if (!fc) return <EmptyState icon={PenLine} message="A4: FactCheck nötig vor Mail-Generation" />
  return (
    <div className="space-y-2">
      <div className="rounded p-2"
        style={{
          background: fc.sendReady ? 'rgba(57,255,136,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${fc.sendReady ? 'rgba(57,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest font-bold"
            style={{ color: fc.sendReady ? '#39ff88' : '#ef4444' }}>
            Mail Send: {fc.sendReady ? 'READY' : 'BLOCKED'}
          </span>
          <Send size={10} style={{ color: '#6b7a90' }} />
        </div>
      </div>
      {savedDrafts ? (
        <div className="space-y-1.5">
          {(savedDrafts.variants || []).map(v => (
            <div key={v.variant} className="rounded p-1.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color: '#f5a623' }}>
                  {v.variantLabel}
                </span>
                <span className="font-mono text-[9px]"
                  style={{ color: v.confidence >= 70 ? '#39ff88' : v.confidence >= 50 ? '#f5a623' : '#ef4444' }}>
                  {v.confidence}% · {v.sendReady ? 'ready' : 'review'}
                </span>
              </div>
              <div className="text-[9px] mt-0.5 truncate" style={{ color: '#cbd5e1' }}>{v.subject || '—'}</div>
              {v.riskFlags?.length > 0 && (
                <div className="text-[9px]" style={{ color: '#f5a623' }}>
                  {v.riskFlags.length} risk flag{v.riskFlags.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={PenLine} message="Keine Mail-Drafts in der Lead-Detail-Session. Generiere sie über das A4 Panel." />
      )}
    </div>
  )
}

// ── A2 Builder / A7 Build Block ──────────────────────────────────────────
function A2BuildBlock({ lead, assets }) {
  const gate = useMemo(() => {
    try { return runPreBuildGate({ lead, assets: assets || [] }) }
    catch { return null }
  }, [lead, assets])
  if (!gate) return <EmptyState icon={Wrench} message="A2: gate nicht ausführbar (lead missing)" />

  return (
    <div className="space-y-2">
      <Row label="Gate Verdict" value={gate.verdict}
        color={gate.verdict === 'proceed' ? '#39ff88' : gate.verdict === 'review' ? '#f5a623' : '#ef4444'} />
      <Row label="Required Data" value={gate.gates.required_data?.passed ? 'OK' : 'MISSING'} />
      <Row label="Category" value={`${gate.summary.category} (${(gate.summary.category_confidence * 100).toFixed(0)}%)`} />
      <Row label="Assets Hero-Ready" value={gate.gates.assets?.hero_ready ?? 0} />
      <Row label="Problems" value={gate.problems?.length || 0}
        color={gate.problems?.length ? '#f5a623' : '#39ff88'} />
      <Row label="Repair Tasks" value={gate.repair_tasks?.length || 0} />
      {(gate.repair_tasks || []).length > 0 && (
        <Group title="Repair" color="#9b6ef3" icon={Wrench}>
          {(gate.repair_tasks || []).slice(0, 3).map((t, i) => (
            <li key={i}>· {t.agent}: {t.task}</li>
          ))}
        </Group>
      )}
    </div>
  )
}

// ── A5 Pricing Block ─────────────────────────────────────────────────────
function A5Block({ lead, a5Result }) {
  if (!a5Result) return <EmptyState icon={DollarSign} message="A5: noch nicht berechnet. Generiere Preis im LeadDetail." />
  return (
    <div className="space-y-1.5">
      <Row label="Min" value={`€${a5Result.price_min}`} />
      <Row label="Empfehlung" value={`€${a5Result.price_recommended}`} color="#39ff88" />
      <Row label="Premium" value={`€${a5Result.price_premium}`} />
      <Row label="Closing" value={`${a5Result.closing_chance}%`}
        color={a5Result.closing_chance >= 60 ? '#39ff88' : '#f5a623'} />
      {a5Result.reasoning && (
        <Group title="Reasoning" color="#9ca3b5" icon={Activity}>
          <li className="font-normal">{String(a5Result.reasoning).slice(0, 200)}</li>
        </Group>
      )}
    </div>
  )
}

// ── TWIN Block ───────────────────────────────────────────────────────────
function TwinBlock() {
  const tools = listTools()
  return (
    <div className="space-y-2">
      <Row label="Tools verfügbar" value={tools.length} color="#ffd700" />
      <Row label="Safe" value={tools.filter(t => t.permission === 'safe_action').length} />
      <Row label="Expensive" value={tools.filter(t => t.permission === 'expensive_action').length} />
      <Row label="Destructive" value={tools.filter(t => t.permission === 'destructive_action').length} />
      <Row label="External Send" value={tools.filter(t => t.permission === 'external_send_action').length} />
      <Group title="Top Commands" color="#ffd700" icon={Activity}>
        <li>· „Prüfe diesen Lead" → lead.qualify</li>
        <li>· „Nächste Aktion" → pipeline.nextAction</li>
        <li>· „Generiere Hero" → hero.regenerate</li>
        <li>· „3 Mails bauen" → mail.generate3</li>
      </Group>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────
function Stat({ label, value, color = '#e8edf4' }) {
  return (
    <div className="rounded p-1.5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="font-mono text-[7px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>{label}</div>
      <div className="font-mono text-[12px] font-bold tabular-nums mt-0.5" style={{ color }}>{value}</div>
    </div>
  )
}

function Group({ title, color, icon: Icon, children }) {
  return (
    <div className="rounded p-1.5"
      style={{ background: `${color}05`, border: `1px solid ${color}15` }}>
      <div className="flex items-center gap-1 mb-1">
        {Icon && <Icon size={8} style={{ color }} />}
        <span className="font-mono text-[8px] uppercase tracking-widest font-bold" style={{ color }}>
          {title}
        </span>
      </div>
      <ul className="space-y-0.5 text-[9px] leading-relaxed" style={{ color: '#cbd5e1' }}>
        {children}
      </ul>
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────
export default function AgentLiveDataBlock({ agentId, lead, assets = [], a5Result, savedDrafts }) {
  if (!lead && agentId !== 8) {
    return <EmptyState icon={Activity} message="Kein aktiver Lead — wähle einen Lead um echte Daten zu sehen" />
  }

  switch (agentId) {
    case 1: return <A1Block lead={lead} />
    case 2: return <A2BuildBlock lead={lead} assets={assets} />
    case 3: return <A3Block lead={lead} assets={assets} />
    case 4: return <A4Block lead={lead} savedDrafts={savedDrafts} />
    case 5: return <A5Block lead={lead} a5Result={a5Result} />
    case 6: return <A6Block lead={lead} />
    case 7: return <A2BuildBlock lead={lead} assets={assets} />
    case 8: return <TwinBlock />
    default: return <EmptyState icon={Activity} message={`Kein Live-Data-Layout für Agent ${agentId}`} />
  }
}
