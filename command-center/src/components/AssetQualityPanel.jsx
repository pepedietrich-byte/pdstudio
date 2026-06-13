import { useMemo } from 'react'
import { ImageIcon, CheckCircle2, XCircle, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'

const VERDICT_STYLES = {
  hero_ready:     { color: '#39ff88', label: 'HERO-READY (90+)', icon: CheckCircle2 },
  usable:         { color: '#9b6ef3', label: 'USABLE (80+)',     icon: CheckCircle2 },
  secondary_only: { color: '#f5a623', label: 'SECONDARY (70+)',  icon: AlertTriangle },
  reject:         { color: '#ef4444', label: 'REJECTED',         icon: XCircle },
}

function ScoreBar({ score, max, color }) {
  const pct = (score / max) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-12 text-right" style={{ color: '#cbd5e1' }}>{score}/{max}</span>
    </div>
  )
}

function AssetCard({ scored, onRegenerate, regenerating }) {
  const { asset, score } = scored
  const verdict = VERDICT_STYLES[score.verdict] || VERDICT_STYLES.reject
  const Icon = verdict.icon

  return (
    <div className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${verdict.color}40`,
        boxShadow: score.verdict === 'hero_ready' ? `0 0 18px ${verdict.color}20` : 'none',
      }}>
      {/* Image preview */}
      <div className="relative aspect-video overflow-hidden" style={{ background: '#0a0a0a' }}>
        {asset.url && (
          <img src={asset.url} alt={asset.role}
            className="w-full h-full object-cover"
            onError={e => e.target.style.display = 'none'} />
        )}
        {asset.ai_generated && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1"
            style={{ background: 'rgba(155,110,243,0.9)', color: '#fff' }}>
            <Sparkles size={9} /> AI · {asset.ai_model || 'FLUX'}
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
          style={{ background: verdict.color, color: '#000' }}>
          {score.total}
        </div>
      </div>

      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: `${verdict.color}30` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#9ca3b5' }}>
            {asset.role}
          </span>
          <div className="flex items-center gap-1" style={{ color: verdict.color }}>
            <Icon size={11} />
            <span className="text-[10px] font-bold">{verdict.label}</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-3 space-y-1.5">
        {[
          { key: 'category_fit',  label: 'Kategorie-Fit',   max: 25 },
          { key: 'product_fit',   label: 'Produkt-Fit',     max: 20 },
          { key: 'image_quality', label: 'Bildqualität',    max: 20 },
          { key: 'sales_impact',  label: 'Verkaufswirkung', max: 15 },
          { key: 'atmosphere',    label: 'Atmosphäre',      max: 10 },
          { key: 'technical',     label: 'Technisch',       max: 10 },
        ].map(c => {
          const value = score.breakdown[c.key] || 0
          const color = value >= c.max * 0.8 ? '#39ff88' : value >= c.max * 0.5 ? '#f5a623' : '#ef4444'
          return (
            <div key={c.key}>
              <div className="text-[10px] mb-0.5" style={{ color: '#6b7a90' }}>{c.label}</div>
              <ScoreBar score={value} max={c.max} color={color} />
            </div>
          )
        })}
      </div>

      {/* Reasons */}
      {score.reasons && score.reasons.length > 0 && (
        <div className="p-3 pt-0 space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: '#6b7a90' }}>Bewertung</div>
          {score.reasons.slice(0, 4).map((r, i) => (
            <div key={i} className="text-[10px] flex items-start gap-1.5"
              style={{ color: r.blocking ? '#ef4444' : r.score === 0 ? '#f5a623' : '#9ca3b5' }}>
              <span className="opacity-50">•</span>
              <span><strong>{r.criterion.replace(/_/g, ' ')}:</strong> {r.why}</span>
            </div>
          ))}
        </div>
      )}

      {/* Regenerate-Button für Reject/Secondary */}
      {(score.verdict === 'reject' || score.verdict === 'secondary_only') && onRegenerate && (
        <div className="p-3 pt-0">
          <button onClick={() => onRegenerate(asset.role)} disabled={regenerating === asset.role}
            className="w-full py-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5"
            style={{
              background: 'rgba(155,110,243,0.15)',
              color: '#c5a5ff',
              border: '1px solid rgba(155,110,243,0.3)',
              opacity: regenerating === asset.role ? 0.5 : 1,
            }}>
            {regenerating === asset.role ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {regenerating === asset.role ? 'Generiere...' : 'AI-Bild generieren (Poe FLUX)'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AssetQualityPanel({ scored = [], summary, onRegenerate, regenerating }) {
  if (!scored || scored.length === 0) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <ImageIcon size={28} className="mx-auto mb-2" style={{ color: '#6b7a90' }} />
        <div className="text-xs" style={{ color: '#6b7a90' }}>Keine Bilder zum Bewerten</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(232,25,127,0.04)', border: '1px solid rgba(232,25,127,0.25)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} style={{ color: '#e8197f' }} />
          <h3 className="font-semibold" style={{ color: '#e8edf4' }}>Asset Quality</h3>
        </div>
        {summary && (
          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#9ca3b5' }}>
            <span><span style={{ color: '#39ff88' }}>{summary.hero_ready}</span> hero</span>
            <span><span style={{ color: '#9b6ef3' }}>{summary.usable}</span> ok</span>
            <span><span style={{ color: '#f5a623' }}>{summary.secondary_only}</span> sec</span>
            <span><span style={{ color: '#ef4444' }}>{summary.rejected}</span> rej</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scored.map((s, i) => (
          <AssetCard key={i} scored={s} onRegenerate={onRegenerate} regenerating={regenerating} />
        ))}
      </div>
    </div>
  )
}
