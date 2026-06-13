import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ExternalLink, Loader, Sparkles, Palette, Type } from 'lucide-react'
import { triggerAgent, isWebhookConfigured } from '../lib/n8n'

const MAGENTA = '#ff2d9b'

export default function WebsiteBuilderPanel({ lead }) {
  const [state, setState] = useState('idle') // idle | building | done | error
  const [msg, setMsg]     = useState('')
  const cfg     = isWebhookConfigured(7)
  const concept = lead?.concept  ?? {}
  const build   = lead?.build    ?? {}
  const demoUrl = build.demo_url

  const hasDemo    = !!demoUrl && !demoUrl.startsWith('/files')
  const hasPrompt  = +build.prompt_chars > 0

  // Parse colors from concept
  let colors = {}
  try { colors = typeof concept.colors === 'string' ? JSON.parse(concept.colors) : (concept.colors || {}) } catch {}

  const improvements  = concept.improvements_vs_original?.slice(0, 3) || []
  const fontHeading   = concept.font_heading   || ''
  const heroHeadline  = concept.hero_headline  || ''
  const direction     = concept.design_direction || ''
  const swatches      = [colors.primary, colors.secondary, colors.accent, colors.background].filter(Boolean)

  async function buildWebsite() {
    if (!cfg) { setMsg('Webhook A7 nicht konfiguriert — VITE_N8N_AGENT7_WEBHOOK in .env eintragen'); return }
    setState('building'); setMsg('')
    try {
      await triggerAgent(7, { lead_id: lead.lead_id })
      setState('done'); setMsg('Agent 7 gestartet — Website wird gebaut. Nach ~60s aktualisieren.')
    } catch (e) {
      setState('error'); setMsg(e.message)
    }
  }

  const borderColor   = state === 'building' ? MAGENTA : state === 'error' ? '#ff3b3b' : state === 'done' ? MAGENTA : 'rgba(255,45,155,0.3)'
  const glowStyle     = { boxShadow: `0 0 32px ${MAGENTA}18` }

  return (
    <motion.div
      className="relative rounded-lg p-5 overflow-hidden"
      style={{ background: 'rgba(255,45,155,0.04)', border: `1px solid ${borderColor}`, ...glowStyle }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Corner accents */}
      {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3`}>
          <div className="w-full h-px" style={{ background: MAGENTA }} />
          <div className="h-full w-px" style={{ background: MAGENTA }} />
        </div>
      ))}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: `${MAGENTA}99` }}>
            WEBSITE BUILDER // AGENT 07
          </div>
          <h3 className="font-ui font-bold text-white text-lg" style={{ textShadow: `0 0 10px ${MAGENTA}60` }}>
            DEMO-WEBSITE BAUEN
          </h3>
          <p className="text-sm text-white/50 mt-1 max-w-sm">
            {hasPrompt
              ? 'Claude-Code-Prompt bereit — Agent 7 baut die React-Website und deployt auf Vercel.'
              : 'Agent 6 muss zuerst laufen um den Build-Prompt zu erstellen.'}
          </p>
        </div>
        <Globe size={28} className="opacity-30 flex-shrink-0" style={{ color: MAGENTA }} />
      </div>

      {/* Design preview */}
      {(swatches.length > 0 || fontHeading || improvements.length > 0) && (
        <div className="grid md:grid-cols-3 gap-3 mb-4">

          {/* TOP 3 Improvements */}
          {improvements.length > 0 && (
            <div className="rounded p-3 md:col-span-1" style={{ background: 'rgba(255,45,155,0.06)', border: '1px solid rgba(255,45,155,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={10} style={{ color: MAGENTA }} />
                <span className="text-[9px] font-mono tracking-widest text-white/30">TOP VERBESSERUNGEN</span>
              </div>
              <ul className="space-y-1">
                {improvements.map((v, i) => (
                  <li key={i} className="text-[10px] text-white/60 flex gap-1.5 leading-snug">
                    <span style={{ color: MAGENTA }}>›</span>
                    <span className="line-clamp-2">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Color swatches */}
          {swatches.length > 0 && (
            <div className="rounded p-3" style={{ background: 'rgba(255,45,155,0.06)', border: '1px solid rgba(255,45,155,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Palette size={10} style={{ color: MAGENTA }} />
                <span className="text-[9px] font-mono tracking-widest text-white/30">DESIGN TOKENS</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {swatches.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded" style={{ background: c, border: '1px solid rgba(255,255,255,0.12)' }} />
                    <span className="text-[8px] font-mono text-white/30">{c}</span>
                  </div>
                ))}
              </div>
              {fontHeading && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Type size={9} style={{ color: MAGENTA }} />
                  <span className="text-[9px] font-mono text-white/40">{fontHeading}</span>
                </div>
              )}
            </div>
          )}

          {/* Hero preview */}
          {heroHeadline && (
            <div className="rounded p-3" style={{ background: 'rgba(255,45,155,0.06)', border: '1px solid rgba(255,45,155,0.15)' }}>
              <div className="text-[9px] font-mono tracking-widest text-white/30 mb-2">HERO PREVIEW</div>
              {direction && (
                <div className="text-[9px] font-mono mb-1.5 px-1.5 py-0.5 rounded inline-block"
                  style={{ background: `${MAGENTA}18`, color: MAGENTA, border: `1px solid ${MAGENTA}30` }}>
                  {direction}
                </div>
              )}
              <p className="text-xs text-white/80 font-medium leading-snug line-clamp-3">{heroHeadline}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA row */}
      <div className="flex items-center gap-3 flex-wrap">
        {hasDemo ? (
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-sm transition-all"
            style={{
              background: `${MAGENTA}18`,
              color: MAGENTA,
              border: `1px solid ${MAGENTA}50`,
              boxShadow: `0 0 16px ${MAGENTA}25`,
            }}
          >
            <ExternalLink size={12} /> DEMO ÖFFNEN
          </a>
        ) : (
          <motion.button
            onClick={buildWebsite}
            disabled={state === 'building' || !hasPrompt}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono font-bold text-sm transition-all"
            style={{
              background: state === 'building' ? `${MAGENTA}0a` : hasPrompt ? `${MAGENTA}18` : 'rgba(255,255,255,0.04)',
              color: hasPrompt ? MAGENTA : '#6b6b8a',
              border: `1px solid ${hasPrompt ? `${MAGENTA}50` : 'rgba(255,255,255,0.08)'}`,
              boxShadow: state !== 'building' && hasPrompt ? `0 0 20px ${MAGENTA}28` : 'none',
              cursor: (state === 'building' || !hasPrompt) ? 'not-allowed' : 'pointer',
            }}
            whileHover={hasPrompt && state !== 'building' ? { scale: 1.02, boxShadow: `0 0 32px ${MAGENTA}45` } : {}}
            whileTap={hasPrompt && state !== 'building' ? { scale: 0.97 } : {}}
            transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {state === 'building' ? (
              <><Loader size={12} className="animate-spin" /> BUILDING...</>
            ) : (
              <><Globe size={12} /> {hasPrompt ? 'AGENT 7 STARTEN' : 'WARTE AUF A6'}</>
            )}
          </motion.button>
        )}

        <AnimatePresence>
          {msg && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="font-mono text-xs leading-snug max-w-xs"
              style={{ color: state === 'error' ? '#ff3b3b' : MAGENTA }}
            >
              {msg}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Files-only state */}
      {demoUrl?.startsWith('/files') && (
        <div className="mt-3 font-mono text-[10px] text-white/30 flex items-center gap-1.5">
          <span style={{ color: MAGENTA }}>›</span>
          Files gespeichert unter: <span className="text-white/50">{demoUrl}</span>
          <span className="ml-1 text-white/20">(Vercel-Token fehlt)</span>
        </div>
      )}
    </motion.div>
  )
}
