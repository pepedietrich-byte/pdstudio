import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, ExternalLink, Loader, Zap } from 'lucide-react'
import { triggerBuild, triggerWebsiteBuild, isWebhookConfigured } from '../lib/n8n'

export default function BuildPanel({ lead }) {
  const [state, setState] = useState('idle') // idle | building | done | error
  const [msg, setMsg]     = useState('')
  const demoUrl = lead?.build?.demo_url
  const cfgA6   = isWebhookConfigured(6)
  const cfgA7   = isWebhookConfigured(7)

  async function fullBuild() {
    if (!cfgA6) { setMsg('Webhook A6 nicht konfiguriert'); return }
    setState('building'); setMsg('')
    try {
      await triggerBuild(lead.lead_id)
      setState('done'); setMsg('Pipeline gestartet — A6 → A7...')
    } catch (e) {
      setState('error'); setMsg(e.message)
    }
  }

  async function quickBuild() {
    if (!cfgA7) { setMsg('Webhook A7 nicht konfiguriert'); return }
    setState('building'); setMsg('')
    try {
      await triggerWebsiteBuild(lead.lead_id)
      setState('done'); setMsg('A7 gestartet — Website wird gebaut...')
    } catch (e) {
      setState('error'); setMsg(e.message)
    }
  }

  return (
    <motion.div
      className="relative rounded-lg p-5 overflow-hidden"
      style={{
        background: 'rgba(57,255,136,0.04)',
        border: '1px solid rgba(57,255,136,0.3)',
        boxShadow: '0 0 32px rgba(57,255,136,0.1)',
      }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Animated corner accents */}
      {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3`}>
          <div className="w-full h-px bg-neon-green" />
          <div className="h-full w-px bg-neon-green" />
        </div>
      ))}

      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-widest text-neon-green/60 mb-1">BUILD ENGINE</div>
          <h3 className="font-ui font-bold text-white text-lg neon-green">🚀 WEBSITE BAUEN</h3>
          <p className="text-sm text-white/50 mt-1 max-w-sm">
            Full Pipeline (A6→A7) oder direkt A7 starten wenn Concept bereits vorhanden.
          </p>
        </div>
        <Rocket size={28} className="text-neon-green opacity-40 flex-shrink-0" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {demoUrl && (
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-sm bg-neon-green/15 text-neon-green border border-neon-green/40 hover:bg-neon-green/25 transition-all"
          >
            <ExternalLink size={12} /> DEMO ÖFFNEN
          </a>
        )}

        <motion.button
          onClick={fullBuild}
          disabled={state === 'building'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono font-bold text-sm transition-all"
          style={{
            background: state === 'building' ? 'rgba(57,255,136,0.08)' : 'rgba(57,255,136,0.15)',
            color: '#39ff88',
            border: '1px solid rgba(57,255,136,0.5)',
            boxShadow: state !== 'building' ? '0 0 20px rgba(57,255,136,0.25)' : 'none',
            cursor: state === 'building' ? 'not-allowed' : 'pointer',
          }}
          whileHover={state !== 'building' ? { scale: 1.02, boxShadow: '0 0 32px rgba(57,255,136,0.4)' } : {}}
          whileTap={state !== 'building' ? { scale: 0.97 } : {}}
        >
          {state === 'building' ? (
            <><Loader size={12} className="animate-spin" /> BUILDING...</>
          ) : (
            <><Rocket size={12} /> FULL PIPELINE</>
          )}
        </motion.button>

        <motion.button
          onClick={quickBuild}
          disabled={state === 'building'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-sm transition-all"
          style={{
            background: state === 'building' ? 'rgba(57,130,255,0.06)' : 'rgba(57,130,255,0.12)',
            color: '#3982ff',
            border: '1px solid rgba(57,130,255,0.4)',
            boxShadow: state !== 'building' ? '0 0 16px rgba(57,130,255,0.2)' : 'none',
            cursor: state === 'building' ? 'not-allowed' : 'pointer',
          }}
          whileHover={state !== 'building' ? { scale: 1.02, boxShadow: '0 0 24px rgba(57,130,255,0.35)' } : {}}
          whileTap={state !== 'building' ? { scale: 0.97 } : {}}
        >
          <Zap size={12} /> A7 DIREKT
        </motion.button>

        <AnimatePresence>
          {msg && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="font-mono text-xs"
              style={{ color: state === 'error' ? '#ff3b3b' : '#39ff88' }}
            >
              {msg}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
