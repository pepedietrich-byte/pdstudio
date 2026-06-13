import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Info, ListChecks } from 'lucide-react'

const SEVERITY_COLORS = {
  ok: '#39ff88', warning: '#f5a623', blocking: '#ef4444',
}

function FieldRow({ label, value, status, severity = 'ok', note }) {
  const color = SEVERITY_COLORS[severity] || '#6b7a90'
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-b-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="text-[11px] uppercase tracking-widest min-w-0 flex-1" style={{ color: '#6b7a90' }}>{label}</div>
      <div className="flex items-center gap-1.5 min-w-0 flex-[2]">
        <span className="text-xs truncate" style={{ color: status === 'missing' ? '#6b7a90' : '#e8edf4' }}>
          {status === 'missing' ? '—' : (value || '—')}
        </span>
        {status === 'present' && <CheckCircle2 size={11} style={{ color }} className="flex-shrink-0" />}
        {status === 'missing' && severity === 'blocking' && <XCircle size={11} style={{ color }} className="flex-shrink-0" />}
        {status === 'missing' && severity === 'warning' && <AlertTriangle size={11} style={{ color }} className="flex-shrink-0" />}
        {status === 'uncertain' && <AlertTriangle size={11} style={{ color: '#f5a623' }} className="flex-shrink-0" />}
      </div>
      {note && <div className="text-[9px]" style={{ color: '#f5a623' }}>{note}</div>}
    </div>
  )
}

export default function FactCheckPanel({ lead = {}, gate_report = null }) {
  if (!gate_report) {
    return (
      <div className="rounded-lg p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <ShieldCheck size={28} className="mx-auto mb-2" style={{ color: '#6b7a90' }} />
        <div className="text-xs" style={{ color: '#6b7a90' }}>Gate noch nicht ausgeführt</div>
      </div>
    )
  }

  const verdict = gate_report.verdict
  const verdictMeta = {
    proceed: { color: '#39ff88', label: 'BUILD ALLOWED · alle Gates ok' },
    review:  { color: '#f5a623', label: 'NEEDS REVIEW · Warnungen vorhanden' },
    block:   { color: '#ef4444', label: 'BLOCKED · Pflicht-Gates failed' },
    proceed_forced: { color: '#9b6ef3', label: 'FORCED · trotz Gate-Probleme' },
  }[verdict] || { color: '#6b7a90', label: 'unknown' }

  const dataChecks = gate_report.gates?.required_data?.checks || []
  const uncertain  = gate_report.build_context?.uncertain_fields || []
  const pricingSafe = gate_report.build_context?.pricing_safe

  return (
    <div className="rounded-lg p-4 space-y-3"
      style={{ background: `${verdictMeta.color}08`, border: `1px solid ${verdictMeta.color}40` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: verdictMeta.color }} />
          <h3 className="font-semibold" style={{ color: '#e8edf4' }}>FactCheck Gate</h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest"
          style={{ background: verdictMeta.color + '20', color: verdictMeta.color }}>
          {verdictMeta.label}
        </span>
      </div>

      {/* Kategorie */}
      <div className="rounded p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>Kategorie</span>
          <span className="text-[10px]" style={{ color: '#9ca3b5' }}>
            Confidence: <span style={{ color: gate_report.summary.category_confidence >= 0.5 ? '#39ff88' : '#f5a623' }}>
              {(gate_report.summary.category_confidence * 100).toFixed(0)}%
            </span>
          </span>
        </div>
        <div className="text-sm font-semibold capitalize" style={{ color: '#e8edf4' }}>
          {gate_report.summary.category}
        </div>
      </div>

      {/* Pflichtdaten */}
      <div>
        <div className="text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: '#6b7a90' }}>
          <ListChecks size={11} /> Pflichtdaten
        </div>
        <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {dataChecks.map((c, i) => (
            <FieldRow key={i}
              label={c.label}
              value={lead[c.field]}
              status={c.status}
              severity={c.severity === 'ok' ? 'ok' : (c.severity === 'blocking' ? 'blocking' : 'warning')}
            />
          ))}
        </div>
      </div>

      {/* Erweiterte Felder */}
      <div>
        <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#6b7a90' }}>
          Erweiterte Felder
        </div>
        <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: 'Website',       value: lead.website_url, field: 'website_url' },
            { label: 'Speisekarte',   value: lead.specials,    field: 'specials' },
            { label: 'Google Rating', value: lead.google_rating ? `${lead.google_rating}★ / ${lead.google_reviews_count || ''}` : null, field: 'google_rating' },
            { label: 'Preisklasse',   value: lead.price_range, field: 'price_range' },
            { label: 'Atmosphäre',    value: lead.atmosphere,  field: 'atmosphere' },
          ].map((c, i) => (
            <FieldRow key={i}
              label={c.label}
              value={c.value}
              status={c.value ? 'present' : 'missing'}
              severity={c.value ? 'ok' : 'warning'}
            />
          ))}
        </div>
      </div>

      {/* Unsichere Felder */}
      {uncertain.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: '#f5a623' }}>
            <AlertTriangle size={11} /> Unsicher ({uncertain.length})
          </div>
          <div className="rounded p-2 space-y-1" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.25)' }}>
            {uncertain.map((u, i) => (
              <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: '#f5a623' }}>
                <AlertTriangle size={9} className="mt-0.5 flex-shrink-0" />
                <span><strong>{u.field}:</strong> {u.reason}</span>
              </div>
            ))}
            <div className="text-[10px] pt-1.5 border-t mt-1.5" style={{ color: '#6b7a90', borderColor: 'rgba(245,166,35,0.2)' }}>
              {pricingSafe?.use_concrete_prices === false
                ? 'Konkrete Preise werden NICHT in die Website übernommen → "Auswahl aus der Karte"'
                : 'Unsichere Felder werden im Build markiert'}
            </div>
          </div>
        </div>
      )}

      {/* Probleme & Repair-Tasks */}
      {gate_report.problems && gate_report.problems.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#6b7a90' }}>
            Probleme ({gate_report.problems.length})
          </div>
          <div className="rounded p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {gate_report.problems.map((p, i) => (
              <div key={i} className="text-[11px] flex items-start gap-2"
                style={{ color: SEVERITY_COLORS[p.severity] || '#6b7a90' }}>
                <span className="font-mono text-[9px] mt-0.5 uppercase">{p.severity}</span>
                <span><strong>{p.gate}:</strong> {p.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gate_report.repair_tasks && gate_report.repair_tasks.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: '#c5a5ff' }}>
            <Info size={11} /> Repair Tasks ({gate_report.repair_tasks.length})
          </div>
          <div className="rounded p-2 space-y-1" style={{ background: 'rgba(155,110,243,0.06)', border: '1px solid rgba(155,110,243,0.25)' }}>
            {gate_report.repair_tasks.map((t, i) => (
              <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: '#c5a5ff' }}>
                <span className="font-mono text-[9px] mt-0.5">→</span>
                <span><strong>{t.agent}:</strong> {t.task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="rounded p-2 text-[11px]" style={{
        background: verdict === 'proceed' ? 'rgba(57,255,136,0.06)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${verdict === 'proceed' ? 'rgba(57,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: verdict === 'proceed' ? '#39ff88' : '#ef4444',
      }}>
        <strong>Darf auf Website verwendet werden:</strong> {verdict === 'proceed' ? 'JA — alle Pflicht-Gates bestanden' : 'NEIN — Repair erforderlich'}
      </div>
    </div>
  )
}
