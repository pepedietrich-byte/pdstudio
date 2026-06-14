import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ExternalLink, Loader2, CheckCircle2, AlertCircle,
  Server, ChevronRight, Sparkles, Info, Shield, Lock, Unlock, Wrench,
  Trophy, AlertTriangle, RefreshCw, Copy, Eye, FileText, X, ClipboardCheck,
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
import { buildFinalPrompt } from '../lib/promptBuilder'
import { buildPremiumPrompt } from '../lib/promptAnalyzer'
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

  // Prompt-Copy Flow (kein Build — nur finaler Prompt für Claude App)
  const [finalPrompt, setFinalPrompt] = useState(null)
  const [promptError, setPromptError] = useState('')
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [copyStatus, setCopyStatus] = useState(null) // 'copied' | 'failed' | null
  const [premiumGenerating, setPremiumGenerating] = useState(false)

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

  // ── Prompt-Only Flow (kein A7 Build) ───────────────────────────────────
  // Gate-Check für "Prompt kopieren / anzeigen"
  const promptGate = useMemo(() => {
    if (!gateReport) return { ok: false, reason: 'Pipeline noch nicht gelaufen — warte auf Gate-Report' }
    if (gateReport.verdict !== 'proceed' && gateReport.verdict !== 'proceed_forced') {
      return { ok: false, reason: 'Gates blockiert — Repair durchführen (Category / Asset / Fact)' }
    }
    if (!gateReport.summary?.category) {
      return { ok: false, reason: 'Category Gate offen — Kategorie nicht erkannt' }
    }
    if (!concept) {
      return { ok: false, reason: 'A5 Concept fehlt — wird automatisch erzeugt sobald Gates grün sind' }
    }
    const hero = assets.find(a => (a.role || '').toLowerCase().includes('hero') && a.score_total >= 90)
    if (!hero) {
      return { ok: false, reason: 'Kein Hero-Asset mit Score ≥ 90 — Asset Gate offen, Hero regenerieren' }
    }
    return { ok: true }
  }, [gateReport, concept, assets])

  // Erzeugt finalen Build-Prompt aus buildFinalPrompt() — KEIN Build wird gestartet
  const generatePrompt = useCallback(() => {
    setPromptError('')
    setCopyStatus(null)
    if (!promptGate.ok) {
      setPromptError(promptGate.reason)
      setFinalPrompt(null)
      return null
    }
    try {
      const approved = assets.filter(a => ['hero_ready', 'usable'].includes(a.verdict))
      const result = buildFinalPrompt({
        lead,
        gate_report: gateReport,
        approved_assets: approved,
        concept,
        category_data: getCategory(gateReport.summary.category),
      })
      setFinalPrompt({ ...result, promptBuilderVersion: 'buildFinalPrompt' })
      return result
    } catch (e) {
      setPromptError(e.message || 'Prompt-Erzeugung fehlgeschlagen')
      setFinalPrompt(null)
      return null
    }
  }, [promptGate, assets, lead, gateReport, concept])

  const handleShowPrompt = useCallback(() => {
    const r = generatePrompt()
    if (r) setShowPromptModal(true)
  }, [generatePrompt])

  const handleCopyPrompt = useCallback(async () => {
    const r = generatePrompt()
    if (!r) return
    try {
      await navigator.clipboard.writeText(r.prompt)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus(null), 2500)
  }, [generatePrompt])

  const handleCopyFromModal = useCallback(async () => {
    const text = finalPrompt?.prompt || finalPrompt?.finalBuildPrompt
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus(null), 2500)
  }, [finalPrompt])

  // A6 Premium Prompt — async, nutzt Poe-Analyse
  const handlePremiumPrompt = useCallback(async () => {
    setPromptError('')
    setCopyStatus(null)
    if (!promptGate.ok) {
      setPromptError(promptGate.reason)
      setFinalPrompt(null)
      return
    }
    setPremiumGenerating(true)
    try {
      const approved = assets.filter(a => ['hero_ready', 'usable'].includes(a.verdict))
      const result = await buildPremiumPrompt({
        lead,
        gate_report: gateReport,
        approved_assets: approved,
        concept,
        category_data: getCategory(gateReport.summary.category),
        usePoeAnalysis: true,
      })
      // Unified shape: support .prompt (legacy) and .finalBuildPrompt
      setFinalPrompt({
        ...result,
        prompt: result.finalBuildPrompt,
        prompt_size: (result.finalBuildPrompt || '').length,
        metadata: {
          lead_name: result.businessName,
          category_id: result.category,
          hero_score: result.approvedAssetsUsed?.[0]?.score || null,
          style_id: concept?.style_id || null,
        },
        hero_url: result.approvedAssetsUsed?.find(a => (a.role || '').toLowerCase().includes('hero'))?.url || '',
      })
      setShowPromptModal(true)
    } catch (e) {
      setPromptError(e.message || 'Premium-Prompt fehlgeschlagen')
    } finally {
      setPremiumGenerating(false)
    }
  }, [promptGate, assets, lead, gateReport, concept])

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

      {/* Prompt-Only Flow — kein A7 Build */}
      <div className="rounded-lg p-3 space-y-2"
        style={{ background: 'rgba(57,255,136,0.03)', border: '1px solid rgba(57,255,136,0.18)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: '#39ff88' }} />
            <span className="text-xs font-semibold" style={{ color: '#e8edf4' }}>
              Prompt für Claude App (manueller Build)
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest font-mono"
            style={{ color: promptGate.ok ? '#39ff88' : '#6b7a90' }}>
            {promptGate.ok ? 'READY · buildFinalPrompt v1' : 'BLOCKED'}
          </span>
        </div>
        <div className="text-[10px]" style={{ color: '#9ca3b5' }}>
          Erzeugt nur den finalen Prompt aus <code>buildFinalPrompt()</code> — startet keinen A7 Build.
          Kopiere ihn am Handy in die Claude App + PDSTUDIO Repo.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleShowPrompt} disabled={!promptGate.ok || premiumGenerating}
            className="flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-medium"
            style={{
              background: promptGate.ok ? 'rgba(57,255,136,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${promptGate.ok ? 'rgba(57,255,136,0.35)' : 'rgba(255,255,255,0.06)'}`,
              color: promptGate.ok ? '#39ff88' : '#6b7a90',
              cursor: promptGate.ok ? 'pointer' : 'not-allowed',
            }}>
            <Eye size={12} /> Standard
          </button>
          <button onClick={handleCopyPrompt} disabled={!promptGate.ok || premiumGenerating}
            className="flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-medium"
            style={{
              background: promptGate.ok ? 'rgba(57,255,136,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${promptGate.ok ? 'rgba(57,255,136,0.5)' : 'rgba(255,255,255,0.06)'}`,
              color: promptGate.ok ? '#39ff88' : '#6b7a90',
              cursor: promptGate.ok ? 'pointer' : 'not-allowed',
            }}>
            {copyStatus === 'copied'
              ? (<><ClipboardCheck size={12} /> Kopiert</>)
              : copyStatus === 'failed'
                ? (<><AlertCircle size={12} /> Fehler</>)
                : (<><Copy size={12} /> Kopieren</>)}
          </button>
        </div>
        <button onClick={handlePremiumPrompt} disabled={!promptGate.ok || premiumGenerating}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-bold"
          style={{
            background: promptGate.ok && !premiumGenerating ? 'linear-gradient(135deg, rgba(245,166,35,0.18), rgba(155,110,243,0.18))' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${promptGate.ok ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.06)'}`,
            color: promptGate.ok ? '#f5a623' : '#6b7a90',
            cursor: promptGate.ok && !premiumGenerating ? 'pointer' : 'not-allowed',
          }}>
          {premiumGenerating
            ? (<><Loader2 size={12} className="animate-spin" /> Poe-Analyse läuft…</>)
            : (<><Sparkles size={12} /> A6 Premium-Prompt (Poe Design + Sales Analyse)</>)}
        </button>
        {!promptGate.ok && (
          <div className="text-[10px] flex items-start gap-1.5"
            style={{ color: '#f5a623' }}>
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
            <span>{promptGate.reason}</span>
          </div>
        )}
        {promptError && promptGate.ok && (
          <div className="text-[10px] flex items-start gap-1.5"
            style={{ color: '#ef4444' }}>
            <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
            <span>{promptError}</span>
          </div>
        )}
      </div>

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

      {/* Prompt-Modal */}
      <AnimatePresence>
        {showPromptModal && finalPrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,8,14,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowPromptModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-3xl max-h-[88vh] rounded-xl flex flex-col"
              style={{
                background: 'rgba(15,20,30,0.98)',
                border: '1px solid rgba(57,255,136,0.3)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.55)',
              }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <FileText size={18} style={{ color: '#39ff88' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#e8edf4' }}>
                      Finaler Build-Prompt
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: '#6b7a90' }}>
                      promptBuilderVersion: buildFinalPrompt · {finalPrompt.prompt_size?.toLocaleString()} chars
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowPromptModal(false)}
                  className="p-1.5 rounded hover:bg-white/5">
                  <X size={16} style={{ color: '#9ca3b5' }} />
                </button>
              </div>

              {/* Meta-Zeile */}
              <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>Lead</div>
                  <div style={{ color: '#e8edf4' }}>{finalPrompt.metadata?.lead_name || lead?.business_name || '—'}</div>
                </div>
                <div>
                  <div className="uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>Kategorie</div>
                  <div style={{ color: '#e8edf4' }}>{finalPrompt.metadata?.category_id || '—'}</div>
                </div>
                <div>
                  <div className="uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>Hero Score</div>
                  <div style={{ color: '#39ff88' }}>{finalPrompt.metadata?.hero_score ?? '—'}</div>
                </div>
                <div>
                  <div className="uppercase tracking-widest font-bold" style={{ color: '#6b7a90' }}>Style</div>
                  <div style={{ color: '#e8edf4' }}>{finalPrompt.metadata?.style_id || '—'}</div>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="flex-1 overflow-hidden p-5">
                <textarea
                  readOnly
                  value={finalPrompt.prompt}
                  className="w-full h-full min-h-[300px] p-3 rounded font-mono text-[11px] leading-relaxed resize-none"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#cbd5e1',
                    outline: 'none',
                  }}
                  onClick={e => e.target.select()}
                />
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 flex items-center justify-between gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[10px]" style={{ color: '#6b7a90' }}>
                  Hero: <span style={{ color: '#39ff88' }}>{finalPrompt.hero_url?.slice(0, 48)}{finalPrompt.hero_url?.length > 48 ? '…' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  {copyStatus === 'copied' && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: '#39ff88' }}>
                      <CheckCircle2 size={12} /> Prompt kopiert
                    </span>
                  )}
                  {copyStatus === 'failed' && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: '#ef4444' }}>
                      <AlertCircle size={12} /> Kopieren fehlgeschlagen
                    </span>
                  )}
                  <button onClick={handleCopyFromModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded text-[11px] font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #39ff88, #2ecc71)',
                      color: '#0a1018',
                    }}>
                    <Copy size={12} /> In Clipboard kopieren
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
