import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { subscribe, extractStageChange } from '../lib/activityBus'

// ─── TWIN Live Toast ─────────────────────────────────────────────────────────
// Schwebt oben rechts, zeigt jede Tool-Aktion vom Twin für 4 Sek.
// Macht sofort sichtbar dass etwas passiert ist — ohne Page-Reload.

const TOOL_LABELS = {
  'lead.qualify':         'SIGN · Lead qualifiziert',
  'lead.factCheck':       'SERKAN · Fact Check',
  'assets.analyze':       'Assets analysiert',
  'gate.run':             'Pre-Build Gate',
  'concept.generate':     'Konzept generiert',
  'mail.generate3':       'GOETHE · 3 Mails',
  'mail.generateOne':     'GOETHE · Mail',
  'mail.send':            'Mail gesendet',
  'prompt.buildPremium':  'CODÊ · Premium Prompt',
  'prompt.buildStandard': 'CODÊ · Standard Prompt',
  'hero.regenerate':      'ELON · Hero neu',
  'build.trigger':        'CODÊ · Build gestartet',
  'agent.trigger':        'Agent gestartet',
  'pipeline.full':        'Pipeline läuft',
  'pipeline.nextAction':  'Next Action',
  'site.archive':         'Site archiviert',
}

function formatToast(event) {
  const base = TOOL_LABELS[event.tool] || event.tool
  const stage = extractStageChange(event.tool, event.result)
  if (stage?.message) return stage.message
  if (event.tool === 'lead.qualify' && event.result?.leadScore != null) {
    return `SIGN · Score ${event.result.leadScore}`
  }
  if (event.tool === 'build.trigger' && event.result?.demo_url) {
    return `CODÊ · Build → ${event.result.demo_url.replace(/^https?:\/\//, '')}`
  }
  return base
}

export default function TwinLiveToast() {
  const [items, setItems] = useState([])  // [{ id, label, ok, ts }]

  useEffect(() => {
    const unsub = subscribe(event => {
      if (event.type !== 'tool_result' && event.type !== 'tool_error') return
      const id = `${event.ts}-${Math.floor(Math.random() * 1000)}`  // ts is ms, collision ok
      const ok = event.type === 'tool_result' && event.ok !== false
      const label = ok
        ? formatToast(event)
        : `Fehler · ${event.tool}${event.error ? ': ' + event.error : ''}`
      setItems(prev => [...prev.slice(-2), { id, label, ok, ts: event.ts }])
      setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== id))
      }, 4200)
    })
    return unsub
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 88,
        right: 16,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ x: 24, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 24, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{
              padding: '10px 14px',
              background: item.ok ? 'rgba(20,24,32,0.92)' : 'rgba(60,16,16,0.92)',
              border: `1px solid ${item.ok ? 'rgba(57,255,136,0.45)' : 'rgba(255,80,80,0.55)'}`,
              borderLeft: `3px solid ${item.ok ? '#39ff88' : '#ff5050'}`,
              borderRadius: 10,
              color: '#e7eef8',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.1,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              maxWidth: 320,
              pointerEvents: 'auto',
            }}
          >
            <span style={{ opacity: 0.7, marginRight: 6, fontSize: 11 }}>● TWIN</span>
            {item.label}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
