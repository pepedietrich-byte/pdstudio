import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ExternalLink, Loader2, CheckCircle2, AlertCircle,
  Server, ChevronRight, Sparkles, Info, Shield, Lock, Unlock, Wrench,
  Trophy, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { triggerVpsBuild, updateBuildMetadata } from '../lib/n8n'
import { markSiteFresh } from '../lib/sites'
import { BUILD_STYLES, STYLE_ORDER, recommendStyle as recommendStyleFromCuisine, getStylePromptBlock } from '../lib/buildStyles'
import { recommendStyleForCategory } from '../lib/categoryIntelligence'
import { detectCategory, getCategory, isStyleForbiddenForCategory } from '../lib/categoryIntelligence'
import { scoreAssetBatch } from '../lib/assetScore'
import { runPreBuildGate } from '../lib/preBuildGate'
import { generateConcept, describeConceptForPrompt } from '../lib/conceptArchitect'
import { getAnimationBlock } from '../lib/animationLibrary'
import { ensureHeroAvailable } from '../lib/poeImageGen'
import AssetQualityPanel from './AssetQualityPanel'
import FactCheckPanel from './FactCheckPanel'

// ─── Gate Status States ────────────────────────────────────────────────────
const STATUS_META = {
  initializing:        { color: '#6b7a90', icon: Loader2, label: 'INITIALIZING' },
  needs_assets:        { color: '#f5a623', icon: AlertTriangle, label: 'NEEDS ASSETS' },
  needs_category:      { color: '#f5a623', icon: AlertTriangle, label: 'NEEDS CATEGORY' },
  needs_fact_repair:   { color: '#f5a623', icon: AlertTriangle, label: 'NEEDS FACT REPAIR' },
  needs_asset_repair:  { color: '#ef4444', icon: AlertTriangle, label: 'NEEDS ASSET REPAIR' },
  blocked:             { color: '#ef4444', icon: Lock, label: 'BLOCKED' },
  build_allowed:       { color: '#39ff88', icon: Unlock, label: 'BUILD ALLOWED' },
  ready:               { color: '#39ff88', icon: CheckCircle2, label: 'READY' },
  building:            { color: '#9b6ef3', icon: Loader2, label: 'BUILDING' },
  audited:             { color: '#39ff88', icon: Trophy, label: 'AUDITED' },
}

// Default-Asset-Sammlung wenn Lead images-array leer (User MUSS dann polishen / regenerieren)
function buildAssetsFromLead(lead) {
  if (lead?.images && Array.isArray(lead.images) && lead.images.length > 0) {
    return lead.images
  }
  // Fallback: leere Liste → Gate wird das blocken (das ist gewünscht)
  return []
}

export default function VpsBuildPanel({ lead }) {
  // ── State ──────────────────────────────────────────────────────────────
  const [styleId, setStyleId]   = useState('cinnabar')
  const [quality, setQuality]   = useState('premium')
  const [reservationMode, setReservationMode] = useState('reservation')
  const [adminOverride, setAdminOverride] = useState(false)

  // Pipeline state
  const [pipelineStatus, setPipelineStatus] = useState('initializing')
  const [assets, setAssets] = useState([])
  const [gateReport, setGateReport] = useState(null)
  const [concept, setConcept] = useState(null)

  // Build/Deploy
  const [buildResult, setBuildResult] = useState(null)
  const [buildError, setBuildError] = useState('')
  const [salesReadiness, setSalesReadiness] = useState(null)
  const [regeneratingRole, setRegeneratingRole] = useState(null)

  // ── Recommended style aus erkannter Kategorie ──────────────────────────
  const detected = useMemo(() => detectCategory(lead || {}), [lead])
  const recommended = useMemo(() => {
    const r = recommendStyleForCategory(detected.category)
    return r.primary
  }, [detected])

  useEffect(() => {
    if (recommended && pipelineStatus === 'initializing') {
      setStyleId(recommended)
    }
    // Auto pick reservation
    if (lead?.cuisine && /lieferando|wolt|delivery/i.test(lead.website_url || '')) {
      setReservationMode('ordering')
    } else if (/bar|cocktail|brunch|café|cafe/i.test(lead?.cuisine || '')) {
      setReservationMode('contact')
    }
  }, [recommended, lead, pipelineStatus])

  // ── Pipeline ausführen ─────────────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    setPipelineStatus('initializing')
    setBuildError('')

    const collectedAssets = buildAssetsFromLead(lead)
    const cat = getCategory(detected.category)

    // Score assets
    const batch = scoreAssetBatch(collectedAssets, {
      category_id: detected.category,
      atmosphere: lead?.atmosphere,
      signature_products: cat.signature_products,
    })

    // Annotate assets with scores for UI
    const scoredAssets = batch.scored.map(s => ({
      ...s.asset,
      score_total: s.score.total,
      verdict: s.score.verdict,
      score: s.score,
    }))
    setAssets(scoredAssets)

    // Run gate
    const gate = runPreBuildGate({
      lead: { ...lead, category_id: detected.category },
      assets: scoredAssets,
      requestedStyle: styleId,
      forceOverride: adminOverride,
    })
    setGateReport(gate)

    // Generate concept (only if category exists)
    if (gate.summary.category) {
      const conceptResult = generateConcept({
        lead: { ...lead, category_id: gate.summary.category },
        gate_report: gate,
        requested_style: styleId,
      })
      setConcept(conceptResult)
    }

    // Derive status
    if (gate.verdict === 'proceed' || gate.verdict === 'proceed_forced') {
      setPipelineStatus('build_allowed')
    } else {
      // Pinpoint why
      const hasAssetsProblem = gate.problems.some(p => p.gate === 'assets')
      const hasCategoryProblem = gate.problems.some(p => p.gate === 'category')
      const hasFactProblem = gate.problems.some(p => p.gate === 'required_data')

      if (hasAssetsProblem) setPipelineStatus('needs_asset_repair')
      else if (hasCategoryProblem) setPipelineStatus('needs_category')
      else if (hasFactProblem) setPipelineStatus('needs_fact_repair')
      else setPipelineStatus('blocked')
    }
  }, [lead, detected.category, styleId, adminOverride])

  useEffect(() => {
    if (lead?.lead_id) {
      runPipeline()
    }
  }, [lead?.lead_id, styleId, adminOverride, runPipeline])

  // ── Regenerate via Poe ─────────────────────────────────────────────────
  const handleRegenerate = useCallback(async (role) => {
    setRegeneratingRole(role)
    try {
      const cat = getCategory(detected.category)
      const result = await ensureHeroAvailable({
        category_id: detected.category,
        role,
        business_name: lead.business_name,
        atmosphere: lead.atmosphere,
        style_id: styleId,
        existing_assets: [],
        context: { signature_products: cat.signature_products },
      })
      if (result.hero) {
        // Replace asset in list
        setAssets(prev => prev.map(a => {
          if (a.role === role) {
            return {
              ...result.hero,
              score_total: result.hero.score.total,
              verdict: result.hero.score.verdict,
            }
          }
          return a
        }))
        // Re-run gate after replacement
        setTimeout(runPipeline, 100)
      }
    } catch (e) {
      console.error('Regenerate failed', e)
      alert(`Poe-Regenerate fehlgeschlagen: ${e.message}`)
    } finally {
      setRegeneratingRole(null)
    }
  }, [detected.category, lead, styleId, runPipeline])

  // ── Build & Deploy ─────────────────────────────────────────────────────
  const handleBuild = useCallback(async () => {
    if (!gateReport) return
    const canProceed = gateReport.verdict === 'proceed' || gateReport.verdict === 'proceed_forced'
    if (!canProceed && !adminOverride) {
      alert('Gate hat geblockt — Repair erst durchführen oder Admin-Override aktivieren.')
      return
    }

    setPipelineStatus('building')
    setBuildError('')
    setBuildResult(null)

    try {
      // Stufe 3: liefere Concept + Animation Block fürs n8n A2
      const conceptBlock   = concept ? describeConceptForPrompt(concept) : ''
      const animationBlock = getAnimationBlock(styleId, concept?.animation_concept || '')

      const r = await triggerVpsBuild(
        {
          ...lead,
          category_id: gateReport.summary.category,
          images: assets.filter(a => ['hero_ready', 'usable'].includes(a.verdict)),
          gate_report: gateReport,
          pricing_safe: gateReport.build_context?.pricing_safe,
        },
        {
          style: styleId,
          colorDirection: BUILD_STYLES[styleId]?.palette_brief?.split(/[.,]/)[0] || 'auto',
          quality,
          reservation_mode: reservationMode,
          style_prompt: getStylePromptBlock(styleId),
          concept_block:   conceptBlock,
          animation_block: animationBlock,
        }
      )
      setBuildResult(r)
      if (r.deploy_status === 'success' && r.demo_url) {
        markSiteFresh(lead.lead_id, r.demo_url)
        try {
          await updateBuildMetadata(lead.lead_id, {
            demo_url:      r.demo_url,
            build_status:  r.build_status,
            deploy_status: r.deploy_status,
            site_dir:      r.site_dir || `sites/${lead.lead_id}`,
            run_id:        r.run_id,
            source:        `a2-stufe2-${styleId}`,
            kind:          'build',
          })
        } catch {}

        // Auto-run sales readiness audit
        setPipelineStatus('audited')
        try {
          const auditRes = await fetch('/api/sales-readiness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: r.demo_url,
              business_name: lead.business_name,
              category_id: gateReport.summary.category,
            }),
          })
          const audit = await auditRes.json()
          setSalesReadiness(audit)
        } catch {}
      } else {
        setBuildError(r.error || 'Deploy fehlgeschlagen')
        setPipelineStatus('blocked')
      }
    } catch (e) {
      setBuildError(e.message)
      setPipelineStatus('blocked')
    }
  }, [gateReport, adminOverride, lead, assets, styleId, quality, reservationMode])

  // ── Render ─────────────────────────────────────────────────────────────
  const statusMeta = STATUS_META[pipelineStatus]
  const StatusIcon = statusMeta?.icon || Shield
  const isBuilding = pipelineStatus === 'building'
  const canBuild = gateReport?.verdict === 'proceed' || (gateReport?.verdict === 'proceed_forced')

  return (
    <motion.div className="rounded-lg p-5 space-y-4"
      style={{ background: 'rgba(155,110,243,0.05)', border: '1px solid rgba(155,110,243,0.35)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Header + Pipeline Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Server size={22} style={{ color: '#9b6ef3' }} />
          <div>
            <div className="text-base font-semibold" style={{ color: '#e8edf4' }}>
              VPS Builder · Pipeline mit Gates
            </div>
            <div className="text-xs" style={{ color: '#6b7a90' }}>
              5 Pflicht-Gates · Opus 4.7 · Poe AI · Category Intelligence
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: statusMeta?.color + '20',
            color: statusMeta?.color,
            border: `1px solid ${statusMeta?.color}40`,
          }}>
          <StatusIcon size={12} className={isBuilding || pipelineStatus === 'initializing' ? 'animate-spin' : ''} />
          {statusMeta?.label}
        </div>
      </div>

      {/* Style Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>
            Design-Variante
          </label>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#9ca3b5' }}>
            <Info size={10} />
            Kategorie „{detected.category}" → empfohlen: <span style={{ color: '#9b6ef3', fontWeight: 600 }}>{BUILD_STYLES[recommended]?.name}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STYLE_ORDER.map(id => {
            const forbidden = isStyleForbiddenForCategory(detected.category, id)
            return (
              <button key={id} onClick={() => !forbidden && setStyleId(id)} disabled={forbidden}
                className="text-left rounded-lg overflow-hidden transition-all relative"
                style={{
                  background: styleId === id ? 'rgba(155,110,243,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${styleId === id ? 'rgba(155,110,243,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: forbidden ? 0.35 : 1,
                  cursor: forbidden ? 'not-allowed' : 'pointer',
                }}>
                <div className="h-12 relative"
                  style={{ background: `linear-gradient(135deg, ${BUILD_STYLES[id].color_primary} 0%, ${BUILD_STYLES[id].color_accent} 100%)` }}>
                  {forbidden && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#ef4444' }}>
                      VERBOTEN
                    </div>
                  )}
                  {id === recommended && !forbidden && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>★</div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-xs font-bold" style={{ color: '#e8edf4' }}>{BUILD_STYLES[id].name}</div>
                  <div className="text-[9px]" style={{ color: '#9b6ef3' }}>{BUILD_STYLES[id].tagline}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reservation + Quality */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest mb-2 block" style={{ color: '#6b7a90' }}>Reservierungs-Logik</label>
          <div className="flex gap-1">
            {[
              { id: 'reservation', label: 'Tisch' },
              { id: 'ordering',    label: 'Bestellen' },
              { id: 'contact',     label: 'Anfrage' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setReservationMode(opt.id)}
                className="flex-1 py-2 rounded text-[11px] font-medium"
                style={{
                  background: reservationMode === opt.id ? 'rgba(155,110,243,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${reservationMode === opt.id ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: reservationMode === opt.id ? '#c5a5ff' : '#9ca3b5',
                }}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest mb-2 block" style={{ color: '#6b7a90' }}>Qualität</label>
          <div className="flex gap-1">
            {[{id:'standard',label:'Standard'},{id:'premium',label:'Premium'}].map(opt => (
              <button key={opt.id} onClick={() => setQuality(opt.id)}
                className="flex-1 py-2 rounded text-[11px] font-medium"
                style={{
                  background: quality === opt.id ? 'rgba(155,110,243,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${quality === opt.id ? 'rgba(155,110,243,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: quality === opt.id ? '#c5a5ff' : '#9ca3b5',
                }}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* FactCheck-Panel */}
      <FactCheckPanel lead={lead} gate_report={gateReport} />

      {/* Asset Quality Panel */}
      <AssetQualityPanel
        scored={assets.map(a => ({ asset: a, score: a.score }))}
        summary={gateReport?.gates?.assets}
        onRegenerate={handleRegenerate}
        regenerating={regeneratingRole}
      />

      {/* A5 Concept Preview */}
      {concept && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(155,110,243,0.04)', border: '1px solid rgba(155,110,243,0.25)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: '#9b6ef3' }} />
            <span className="text-xs font-semibold" style={{ color: '#e8edf4' }}>A5 Concept Architect</span>
          </div>
          <div className="space-y-1 text-xs" style={{ color: '#cbd5e1' }}>
            <div><strong>Hero-Composition:</strong> {concept.hero_composition.id} — {concept.hero_composition.desc}</div>
            <div><strong>Animation:</strong> {concept.animation_concept}</div>
            <div><strong>CTA:</strong> {concept.cta_strategy}</div>
            <div className="text-[10px]" style={{ color: '#9b6ef3' }}>
              Anti-Template: 1 von {concept.anti_template.composition_options.length} möglichen Layouts
            </div>
          </div>
        </div>
      )}

      {/* Admin Override (für Tests) */}
      {!canBuild && pipelineStatus !== 'building' && (
        <div className="flex items-center justify-between p-2 rounded text-[11px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span style={{ color: '#ef4444' }}>
            <Lock size={10} className="inline mr-1" /> Gate blockiert Build. Repair durchführen oder:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer" style={{ color: '#9ca3b5' }}>
            <input type="checkbox" checked={adminOverride} onChange={e => setAdminOverride(e.target.checked)} />
            Admin-Override
          </label>
        </div>
      )}

      {/* Build-Button */}
      <button onClick={handleBuild} disabled={isBuilding || (!canBuild && !adminOverride)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold"
        style={{
          background: !canBuild && !adminOverride
            ? 'rgba(239,68,68,0.15)'
            : `linear-gradient(135deg, ${BUILD_STYLES[styleId].color_primary}, ${BUILD_STYLES[styleId].color_accent})`,
          color: '#fff',
          opacity: isBuilding ? 0.5 : 1,
          cursor: !canBuild && !adminOverride ? 'not-allowed' : 'pointer',
        }}>
        {isBuilding && <Loader2 size={18} className="animate-spin" />}
        {!isBuilding && canBuild && <Rocket size={18} />}
        {!isBuilding && !canBuild && <Lock size={18} />}
        {isBuilding
          ? 'Build läuft...'
          : canBuild
            ? `Build "${BUILD_STYLES[styleId].name}" auf VPS`
            : 'BLOCKED — Gate failed'}
        <ChevronRight size={16} style={{ opacity: 0.6 }} />
      </button>

      {/* Build Result */}
      <AnimatePresence>
        {buildResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded p-3 space-y-2"
            style={{
              background: buildResult.deploy_status === 'success' ? 'rgba(57,255,136,0.05)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${buildResult.deploy_status === 'success' ? 'rgba(57,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2" style={{ color: buildResult.deploy_status === 'success' ? '#39ff88' : '#ef4444' }}>
                {buildResult.deploy_status === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                <span className="font-medium">{buildResult.deploy_status === 'success' ? 'LIVE DEPLOYED' : 'FAILED'}</span>
              </div>
              <span className="text-xs font-mono" style={{ color: '#9ca3b5' }}>{buildResult.duration_seconds}s</span>
            </div>
            {buildResult.demo_url && (
              <a href={buildResult.demo_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#39ff88' }}>
                <ExternalLink size={14} /> {buildResult.demo_url}
              </a>
            )}
            {buildError && <div className="text-xs" style={{ color: '#ef4444' }}>{buildError}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales Readiness Score */}
      <AnimatePresence>
        {salesReadiness && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded p-3 space-y-2"
            style={{
              background: 'rgba(155,110,243,0.04)',
              border: '1px solid rgba(155,110,243,0.3)',
            }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={16} style={{ color: '#9b6ef3' }} />
                <span className="text-sm font-semibold" style={{ color: '#e8edf4' }}>Sales Readiness</span>
              </div>
              <span className="text-2xl font-bold font-mono" style={{
                color: salesReadiness.score >= 93 ? '#39ff88'
                  : salesReadiness.score >= 85 ? '#9b6ef3'
                  : salesReadiness.score >= 70 ? '#f5a623'
                  : '#ef4444',
              }}>{salesReadiness.score}/100</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{
              color: salesReadiness.score >= 85 ? '#39ff88' : '#f5a623',
            }}>
              {salesReadiness.verdict?.replace(/_/g, ' ')}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]" style={{ color: '#9ca3b5' }}>
              <div>Critical: <span style={{ color: '#ef4444' }}>{salesReadiness.summary?.critical_problems || 0}</span></div>
              <div>Major: <span style={{ color: '#f5a623' }}>{salesReadiness.summary?.major_problems || 0}</span></div>
              <div>Minor: <span style={{ color: '#9ca3b5' }}>{salesReadiness.summary?.minor_problems || 0}</span></div>
            </div>
            {salesReadiness.problems && salesReadiness.problems.length > 0 && (
              <div className="space-y-0.5">
                {salesReadiness.problems.slice(0, 5).map((p, i) => (
                  <div key={i} className="text-[10px] flex items-start gap-1.5"
                    style={{ color: p.severity === 'critical' ? '#ef4444' : p.severity === 'major' ? '#f5a623' : '#6b7a90' }}>
                    <span>•</span>
                    <span>{p.message}</span>
                  </div>
                ))}
              </div>
            )}
            {salesReadiness.score < 85 && (
              <div className="text-[10px] pt-1.5 border-t" style={{ color: '#f5a623', borderColor: 'rgba(245,166,35,0.2)' }}>
                ⚠ Unter 85 — NICHT als final/polished markieren. Repair empfohlen.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
