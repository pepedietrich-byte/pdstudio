import { motion, AnimatePresence } from 'framer-motion'
import { Play, FileText, Search, Zap, Image, ShieldCheck, Lightbulb, Code2, Globe, ChevronDown } from 'lucide-react'
import { isWebhookConfigured, triggerAgent } from '../lib/n8n'
import { getLeadStage } from '../lib/sheets'
import { useState } from 'react'
import { WorkerScene } from './WorkerSprite'

const ICONS  = [Search, Zap, Image, ShieldCheck, Lightbulb, Code2, Globe]
const NAMES  = ['Lead Qualifier', 'Claude Code Builder', 'Polish Agent', 'Human Writer', 'Pricing Agent', 'Fact Checker']
const COLORS = ['#00d4ff', '#9b6ef3', '#e8197f', '#f5a623', '#2ddb72', '#ff6b35']

const DESCRIPTIONS = {
  1: 'Analysiert Restaurant-Website technisch. Score, Confidence, Pain Points.',
  2: 'Generiert Claude-Code-Build-Prompt. Deployt Premium-Site auf Vercel.',
  3: 'Bilder via Poe/Nano Banana. Polisht CSS, Animationen, Microinteractions.',
  4: 'Schreibt Verkaufs-E-Mails, DMs, Follow-ups, Call Scripts auf Deutsch.',
  5: 'Berechnet Min/Empfehlung/Premium Preis. Closing-Chance.',
  6: 'Prüft URL, Telefon, E-Mail, Name. Trust Score + Versandstatus.',
}

const CAPABILITIES = {
  1: ['Google Maps scraping', 'Lead scoring (0-100)', 'Confidence rating', 'Deduplication'],
  2: ['Website crawling', 'Text extraction', 'Menu parsing', 'Contact info'],
  3: ['Hero image extraction', 'Gallery scraping', 'Logo detection', 'Image ranking'],
  4: ['Data completeness check', 'Field validation', 'Quality score', 'Gap detection'],
  5: ['Color palette generation', 'Typography selection', 'Section planning', 'Headline creation'],
  6: ['Prompt assembly', 'Data merging', 'Template filling', 'Output formatting'],
  7: ['HTML generation', 'Vercel deployment', 'URL generation', 'Build tracking'],
}

const EASE = [0.23, 1, 0.32, 1]

export default function AgentCard({ id, leads = [], params = {}, onLogs }) {
  const [status,   setStatus]   = useState('idle')
  const [running,  setRunning]  = useState(false)
  const [errMsg,   setErrMsg]   = useState('')
  const [expanded, setExpanded] = useState(false)

  const Icon  = ICONS[id - 1]
  const color = COLORS[id - 1]
  const name  = NAMES[id - 1]
  const cfg   = isWebhookConfigured(id)

  const count    = leads.filter(l => getLeadStage(l) >= id).length
  const isActive = status === 'running' || status === 'done'
  const isError  = status === 'error'
  const accentCol = isError ? '#f03a3a' : color

  async function handleStart(e) {
    e.stopPropagation()
    if (!cfg) { setErrMsg('Webhook nicht konfiguriert'); return }
    setRunning(true); setStatus('running'); setErrMsg('')
    try {
      await triggerAgent(id, params)
      setStatus('done')
    } catch (e2) {
      setStatus('error'); setErrMsg(e2.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <motion.div
      className="relative flex flex-col rounded-lg overflow-hidden select-none"
      style={{
        background: isActive ? `${accentCol}07` : 'var(--bg-card)',
        border: `1px solid ${isActive ? `${accentCol}30` : 'var(--border)'}`,
        minHeight: 220,
        cursor: 'default',
        transition: 'border-color 0.3s ease, background 0.3s ease',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: (id - 1) * 0.05, ease: EASE }}
      whileHover={{
        borderColor: `${accentCol}40`,
        boxShadow: `0 0 30px ${accentCol}08 inset`,
      }}
    >
      {/* Scan line when running */}
      {status === 'running' && (
        <motion.div
          className="absolute left-0 right-0 h-px z-10 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}cc, transparent)` }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Top edge accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentCol}50, transparent)`,
          opacity: isActive ? 1 : 0.3,
        }}
      />

      {/* HEADER */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: `${accentCol}12`,
            border: `1px solid ${accentCol}25`,
            boxShadow: isActive ? `0 0 16px ${accentCol}20` : 'none',
          }}
        >
          <Icon size={16} color={accentCol} />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-sm leading-tight"
            style={{ color: 'var(--text-hi)', fontFamily: 'Geist, sans-serif' }}
          >
            {name}
          </div>
          <div
            className="font-mono text-[10px] tracking-widest mt-0.5"
            style={{ color: accentCol, opacity: 0.7 }}
          >
            AGENT {String(id).padStart(2, '0')}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {count > 0 && (
            <span
              className="font-mono text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full"
              style={{ color: accentCol, background: `${accentCol}15`, border: `1px solid ${accentCol}25` }}
            >
              {count}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{ color: 'var(--text-dim)' }}
          >
            <ChevronDown size={12} />
          </motion.div>
        </div>
      </div>

      {/* WORKER SCENE — always visible */}
      <div
        className="px-3 pb-2"
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer' }}
      >
        <WorkerScene agentId={id} count={2} active={isActive} running={running} />
      </div>

      {/* STATUS */}
      <div className="px-4 pb-3">
        {errMsg ? (
          <div
            className="font-mono text-[10px] px-2 py-1.5 rounded"
            style={{ color: '#f03a3a', background: 'rgba(240,58,58,0.08)', border: '1px solid rgba(240,58,58,0.15)' }}
          >
            {errMsg}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {status === 'running' && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accentCol }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
            <span
              className="font-mono text-[10px] tracking-widest"
              style={{ color: status === 'idle' ? 'var(--text-dim)' : accentCol }}
            >
              {running ? 'PROCESSING' : status === 'done' ? 'COMPLETE' : status === 'error' ? 'ERROR' : 'STANDBY'}
            </span>
          </div>
        )}
      </div>

      {/* EXPANDED DETAILS */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ overflow: 'hidden', borderTop: `1px solid ${accentCol}15` }}
          >
            <div className="px-4 py-3 space-y-3">
              {/* Description */}
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-dim)', fontFamily: 'Geist, sans-serif' }}
              >
                {DESCRIPTIONS[id]}
              </p>
              {/* Capabilities */}
              <div>
                <div
                  className="font-mono text-[9px] tracking-widest mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  CAPABILITIES
                </div>
                <div className="flex flex-wrap gap-1">
                  {CAPABILITIES[id].map(cap => (
                    <span
                      key={cap}
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={{ color: accentCol, background: `${accentCol}10`, border: `1px solid ${accentCol}20` }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTION BUTTONS — always at bottom */}
      <div className="mt-auto p-3 flex gap-2" style={{ borderTop: '1px solid var(--border-dim)' }}>
        <motion.button
          onClick={handleStart}
          disabled={running}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded font-mono text-[10px] font-semibold tracking-wider"
          style={{
            background: cfg ? `${accentCol}14` : 'rgba(255,255,255,0.03)',
            color:      cfg ? accentCol : 'var(--text-dim)',
            border:     `1px solid ${cfg ? `${accentCol}30` : 'var(--border-dim)'}`,
            cursor:     running ? 'not-allowed' : cfg ? 'pointer' : 'default',
            opacity:    running ? 0.6 : 1,
          }}
          whileHover={cfg && !running ? { background: `${accentCol}20`, boxShadow: `0 0 12px ${accentCol}15` } : {}}
          whileTap={cfg && !running ? { scale: 0.97 } : {}}
          transition={{ duration: 0.1 }}
        >
          <Play size={9} />
          {running ? 'RUNNING...' : 'LAUNCH'}
        </motion.button>

        <motion.button
          onClick={(e) => { e.stopPropagation(); onLogs?.(id) }}
          className="flex items-center justify-center w-8 rounded"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.02)' }}
          whileHover={{ color: 'var(--text)', borderColor: 'var(--border-focus)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          title="Execution logs"
        >
          <FileText size={10} />
        </motion.button>
      </div>
    </motion.div>
  )
}
