// ─── Mobile Quick-Build ──────────────────────────────────────────────────────
// Pepe öffnet morgens am Handy:
//   1. Tippt Restaurant-URL ein
//   2. Klickt "Enrichen" → A1 holt alles via /api/enrich-lead
//   3. Sieht erkannte Daten + Kategorie + Asset-Score
//   4. Klickt "Build & Deploy" → läuft komplett autonom
//
// Mobile-first: 1-Column-Layout, große Touch-Targets, klare Status-States.
import { useState } from 'react'
import {
  Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, Sparkles,
  Rocket, ExternalLink, Smartphone,
} from 'lucide-react'
import VpsBuildPanel from './VpsBuildPanel'

export default function QuickBuildMobile() {
  const [url, setUrl] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [enrichResult, setEnrichResult] = useState(null)
  const [error, setError] = useState('')

  async function handleEnrich() {
    if (!url.trim()) {
      setError('URL eingeben')
      return
    }
    setEnriching(true)
    setError('')
    setEnrichResult(null)

    try {
      const r = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await r.json()
      if (data.success) {
        setEnrichResult(data)
      } else {
        setError(data.error || 'Enrichment fehlgeschlagen')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setEnriching(false)
    }
  }

  const lead = enrichResult?.lead

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg p-4 flex items-center gap-3"
        style={{ background: 'rgba(155,110,243,0.06)', border: '1px solid rgba(155,110,243,0.3)' }}>
        <Smartphone size={20} style={{ color: '#9b6ef3' }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: '#e8edf4' }}>Mobile Quick-Build</div>
          <div className="text-xs" style={{ color: '#9ca3b5' }}>URL eingeben → Lead enrichen → Bauen → Deployen. Alles autonom.</div>
        </div>
      </div>

      {/* URL Input */}
      <div className="rounded-lg p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <label className="text-xs uppercase tracking-widest font-bold block" style={{ color: '#6b7a90' }}>
          Restaurant-URL
        </label>
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 flex items-center gap-2 px-3 py-3 rounded"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LinkIcon size={14} style={{ color: '#6b7a90' }} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="www.spizz.de"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="url"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#e8edf4' }}
              onKeyDown={e => e.key === 'Enter' && handleEnrich()}
            />
          </div>
          <button onClick={handleEnrich} disabled={enriching || !url.trim()}
            className="px-5 rounded font-semibold text-sm flex items-center gap-2"
            style={{
              background: enriching ? 'rgba(155,110,243,0.15)' : 'linear-gradient(135deg, #9b6ef3, #7a4fd5)',
              color: '#fff',
              opacity: enriching || !url.trim() ? 0.5 : 1,
              minWidth: 110,
              minHeight: 44,
            }}>
            {enriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {enriching ? 'Hole...' : 'Enrichen'}
          </button>
        </div>

        {error && (
          <div className="text-xs flex items-center gap-2 p-2 rounded"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <div className="text-[10px] flex items-center gap-1.5" style={{ color: '#6b7a90' }}>
          <Sparkles size={9} style={{ color: '#9b6ef3' }} />
          Sucht: Name · Adresse · Telefon · Cuisine · OZ · Lieferando · Schema.org
        </div>
      </div>

      {/* Enriched-Result Preview */}
      {lead && (
        <div className="rounded-lg p-4 space-y-2"
          style={{ background: 'rgba(57,255,136,0.04)', border: '1px solid rgba(57,255,136,0.3)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: '#39ff88' }} />
            <span className="font-semibold text-sm" style={{ color: '#e8edf4' }}>{lead.business_name}</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs" style={{ color: '#cbd5e1' }}>
            {lead.cuisine && <div>🍽 {lead.cuisine}</div>}
            {lead.address && <div>📍 {lead.address}</div>}
            {lead.phone && <div>📞 {lead.phone}</div>}
            {lead.opening_hours && <div>⏰ {lead.opening_hours}</div>}
            {lead.delivery_partners && lead.delivery_partners.length > 0 && (
              <div>🚚 {lead.delivery_partners.join(', ')}</div>
            )}
          </div>
          {lead.uncertain_fields && lead.uncertain_fields.length > 0 && (
            <div className="text-[10px] pt-1 mt-1 border-t" style={{ color: '#f5a623', borderColor: 'rgba(245,166,35,0.2)' }}>
              ⚠ Unsicher: {lead.uncertain_fields.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* VpsBuildPanel mit enriched Lead */}
      {lead && <VpsBuildPanel lead={lead} />}

      {!lead && !enriching && (
        <div className="rounded-lg p-6 text-center text-xs"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', color: '#6b7a90' }}>
          <Rocket size={24} className="mx-auto mb-2" style={{ color: '#9b6ef3' }} />
          URL eingeben → automatisch zum Build
        </div>
      )}
    </div>
  )
}
