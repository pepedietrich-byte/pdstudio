import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Link2, AlertTriangle, ChevronRight, Check } from 'lucide-react'
import { triggerAgent, triggerPipelineWithGoogleUrl, isWebhookConfigured } from '../lib/n8n'
import { findDuplicateByUrl } from '../lib/sheets'

const EASE = [0.23, 1, 0.32, 1]

function isUrl(val) {
  if (!val) return false
  return /^https?:\/\//i.test(val) || /^www\./i.test(val) || /^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(val)
}

function isGoogleMapsUrl(val) {
  return /google\.[a-z.]+\/maps/i.test(val) || /maps\.google\./i.test(val) || /goo\.gl\/maps/i.test(val)
}

function normalizeUrl(val) {
  if (!val) return val
  return /^https?:\/\//i.test(val) ? val : `https://${val}`
}

export default function CommandBar({ onLaunched, leads = [] }) {
  const [urlInput, setUrlInput] = useState('')
  const [status,   setStatus]   = useState('idle')
  const [msg,      setMsg]      = useState('')

  const urlMode    = isUrl(urlInput)
  const googleMode = urlMode && isGoogleMapsUrl(urlInput)
  const duplicate  = useMemo(
    () => urlMode && !googleMode ? findDuplicateByUrl(normalizeUrl(urlInput), leads) : null,
    [urlMode, googleMode, urlInput, leads]
  )

  const webhookOk = googleMode ? isWebhookConfigured(1) : urlMode ? isWebhookConfigured(2) : isWebhookConfigured(1)
  const busy    = status === 'running'
  const blocked = urlMode && !!duplicate

  async function launch() {
    if (busy || blocked) return
    setStatus('running'); setMsg('')
    try {
      if (googleMode) {
        await triggerPipelineWithGoogleUrl(normalizeUrl(urlInput))
        setStatus('done')
        setMsg('A1 SIGN gestartet — Google Maps URL wird ausgewertet')
      } else if (urlMode) {
        await triggerAgent(2, { website: normalizeUrl(urlInput), source: 'manual_url' })
        setStatus('done')
        setMsg('URL-Import gestartet — Lead erscheint in Kürze in der Lead-Liste')
      } else {
        setStatus('error')
        setMsg('URL eingeben: Google Maps Link oder direkte Restaurant-URL')
      }
      onLaunched?.()
    } catch (e) {
      setStatus('error'); setMsg(e.message)
    }
  }

  const modeColor = googleMode ? '#2ddb72' : urlMode ? '#00d4ff' : 'rgba(255,255,255,0.3)'
  const modeLabel = googleMode
    ? 'Google Maps — A1 SIGN + Score'
    : urlMode
      ? 'Restaurant-URL — direkter Import'
      : 'URL eingeben um Lead hinzuzufügen'

  return (
    <motion.div
      className="mb-5"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-dim)' }}>
        <Search size={10} style={{ color: 'var(--text-dim)' }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
          NEUE LEADS SCANNEN
        </span>
        <AnimatePresence mode="wait">
          {urlInput && (
            <motion.span
              key={modeLabel}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-mono text-[9px] px-2 py-0.5 rounded ml-2"
              style={{ color: modeColor, background: `${modeColor}10`, border: `1px solid ${modeColor}25` }}
            >
              {modeLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Input + Button */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 relative">
          <Link2 size={9} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setStatus('idle'); setMsg('') }}
            onKeyDown={e => e.key === 'Enter' && launch()}
            placeholder="google.com/maps/... oder restaurant-website.de"
            className="w-full pl-7 pr-3 py-2 rounded font-mono text-xs outline-none"
            style={{
              background: urlMode ? `${modeColor}06` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${urlMode ? `${modeColor}35` : 'rgba(255,255,255,0.1)'}`,
              color: 'var(--text)',
              transition: 'all 200ms ease',
            }}
          />
        </div>

        <motion.button
          onClick={launch}
          disabled={busy || !urlMode || blocked}
          className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold flex-shrink-0"
          style={{
            background: busy || !urlMode || blocked ? 'rgba(255,255,255,0.03)' : `${modeColor}14`,
            color:      busy || !urlMode || blocked ? 'var(--text-dim)' : modeColor,
            border:     `1px solid ${busy || !urlMode || blocked ? 'var(--border)' : `${modeColor}40`}`,
            cursor:     busy || !urlMode || blocked ? 'not-allowed' : 'pointer',
          }}
          whileHover={!busy && urlMode && !blocked ? { scale: 1.02 } : {}}
          whileTap={!busy && urlMode && !blocked ? { scale: 0.97 } : {}}
          transition={{ duration: 0.1 }}
        >
          {busy ? (
            <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          ) : status === 'done' ? (
            <Check size={11} />
          ) : (
            <ChevronRight size={11} />
          )}
          {busy ? 'LÄUFT...' : status === 'done' ? 'DONE' : googleMode ? 'A1 STARTEN' : urlMode ? 'IMPORTIEREN' : 'URL EINGEBEN'}
        </motion.button>
      </div>

      {/* Status / Error / Warning */}
      <AnimatePresence>
        {(msg || duplicate || !webhookOk) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5">
              {duplicate && (
                <div className="flex items-center gap-2 font-mono text-[9px]" style={{ color: '#f5a623' }}>
                  <AlertTriangle size={9} />
                  Duplikat erkannt: &ldquo;{duplicate.name || duplicate.lead_id}&rdquo; bereits in der Liste.
                </div>
              )}
              {!webhookOk && urlMode && (
                <div className="flex items-center gap-2 font-mono text-[9px]" style={{ color: '#f5a623' }}>
                  <AlertTriangle size={9} />
                  needs_connection — Webhook nicht konfiguriert (ENV Variable fehlt)
                </div>
              )}
              {msg && (
                <div className="flex items-center gap-2 font-mono text-[9px]"
                  style={{ color: status === 'error' ? '#ff3b3b' : status === 'done' ? '#2ddb72' : 'var(--text-dim)' }}>
                  {msg}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
