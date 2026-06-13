import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Cpu, Users, Globe, Activity, Wifi, WifiOff, TrendingUp } from 'lucide-react'
import { getLeadStage, getConfidence } from './lib/sheets'
import { useSheetData } from './hooks/useSheetData'
import { useExecutions } from './hooks/useExecutions'
import PasswordGate from './components/PasswordGate'
import CommandBar from './components/CommandBar'
import PipelineHealth from './components/PipelineHealth'
import CommandKPIs from './components/CommandKPIs'
import LeadsView from './components/LeadsView'
import SitesView from './components/SitesView'
import ExecutionsView from './components/ExecutionsView'
import LeadDetail from './components/LeadDetail'
import ErrorBoundary from './components/ErrorBoundary'
import PepeControlRoom from './components/PepeControlRoom'
import AgentCityScene from './components/AgentCity/AgentCityScene'
import MobileAgentCity from './components/AgentCity/MobileAgentCity'
import ActiveLeadBanner from './components/ActiveLeadBanner'
import { TwinProvider, TwinVoiceOrb, TwinConversationPanel, TwinStatusIndicator, useTwin } from './components/Twin'
import { getAllLeadResults } from './hooks/useLeadResults'

const TABS = [
  { id: 'control',    label: 'Control',    icon: Cpu },
  { id: 'leads',      label: 'Leads',      icon: Users },
  { id: 'sites',      label: 'Sites',      icon: Globe },
  { id: 'executions', label: 'Executions', icon: Activity },
]

const EASE = [0.23, 1, 0.32, 1]

function App() {
  const { executions, stop, stopping, refresh: refreshExec } = useExecutions()
  const { leads, loading, error, lastRefresh, autoRefresh, setAutoRefresh, refresh } = useSheetData(60000)
  const { sendContextualUpdate, status: twinStatus } = useTwin()
  const [activeTab,    setActiveTab]    = useState('control')
  const [selectedLead, setSelectedLead] = useState(null)
  const [activeLead,   setActiveLead]   = useState(null)  // globally active lead for agent ops
  const [isPepeOpen,   setIsPepeOpen]   = useState(false)
  const [isMobile,     setIsMobile]     = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Keep selectedLead + activeLead in sync with latest leads data after refresh
  const selectedLeadRef = useRef(selectedLead)
  const activeLeadRef   = useRef(activeLead)
  selectedLeadRef.current = selectedLead
  activeLeadRef.current   = activeLead
  useEffect(() => {
    if (leads.length === 0) return
    const curSel = selectedLeadRef.current
    if (curSel) {
      const fresh = leads.find(l => l.lead_id && l.lead_id === curSel.lead_id)
      if (fresh && fresh !== curSel) setSelectedLead(fresh)
    }
    const curAct = activeLeadRef.current
    if (curAct) {
      const fresh = leads.find(l => l.lead_id && l.lead_id === curAct.lead_id)
      if (fresh && fresh !== curAct) setActiveLead(fresh)
    }
  }, [leads])

  function selectLead(lead) {
    setSelectedLead(lead)
    setActiveTab('leads')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setLeadActive(lead) {
    setActiveLead(prev => prev?.lead_id === lead?.lead_id ? null : lead)
  }

  // Send active lead context to TWIN when it changes
  useEffect(() => {
    if (!activeLead || twinStatus !== 'connected') return
    const savedResults = getAllLeadResults()
    const r = activeLead.lead_id ? (savedResults[activeLead.lead_id] || {}) : {}
    const ctx = [
      `Aktiver Lead: ${activeLead.name || activeLead.lead_id}`,
      `Score: ${activeLead.score || '—'}, Website: ${activeLead.website || '—'}`,
      r.a5Result ? `A5 Preis: €${r.a5Result.price_recommended} empfohlen, Closing: ${r.a5Result.closing_chance}%` : 'A5: noch nicht berechnet',
      r.a6Result ? `A6 Fact Check: Trust ${r.a6Result.trust_score}%, Status: ${r.a6Result.send_status}` : 'A6: noch nicht geprüft',
      r.a4Texts ? 'A4: Verkaufstexte vorhanden' : 'A4: noch keine Texte',
    ].join('. ')
    try { sendContextualUpdate?.(0, ctx, leads.length) } catch (_) {}
  }, [activeLead?.lead_id, twinStatus])

  const noEnv = !import.meta.env.VITE_SHEET_ID && !import.meta.env.VITE_CSV_LEADS

  return (
    <div className="min-h-screen grid-bg" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-7xl mx-auto px-5 h-11 flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Monogram mark */}
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.08) 100%)',
                border: '1px solid rgba(0,212,255,0.3)',
                boxShadow: '0 0 12px rgba(0,212,255,0.12)',
              }}
            >
              <span className="font-mono font-black text-[11px]" style={{ color: '#00d4ff', letterSpacing: '-0.02em' }}>PD</span>
            </div>
            {/* Wordmark */}
            <span
              className="font-ui font-semibold text-sm tracking-tight"
              style={{ color: '#e8f4ff', letterSpacing: '-0.01em' }}
            >
              PDSTUDIO
            </span>
          </div>

          <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border)' }} />

          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            {TABS.map(tab => {
              const Icon   = tab.icon
              const active = activeTab === tab.id && !selectedLead
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedLead(null) }}
                  className="flex items-center gap-1.5 px-3 h-8 rounded font-ui text-xs font-medium transition-colors relative"
                  style={{
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                    color:      active ? 'var(--text-hi)'          : 'var(--text-dim)',
                  }}
                >
                  <Icon size={11} />
                  {tab.label}
                  {tab.id === 'leads' && leads.length > 0 && (
                    <span className="font-mono text-[9px] px-1 py-0 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                      {leads.length}
                    </span>
                  )}
                  {tab.id === 'sites' && (
                    (() => {
                      const cnt = leads.filter(l => {
                        const u = l.build?.demo_url || ''
                        return u && !u.startsWith('/files') && /^https?:\/\//.test(u)
                      }).length
                      return cnt > 0 ? (
                        <span className="font-mono text-[9px] px-1 py-0 rounded-full"
                          style={{ background: 'rgba(232,25,127,0.12)', color: '#e8197f' }}>
                          {cnt}
                        </span>
                      ) : null
                    })()
                  )}
                </button>
              )
            })}
          </div>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-2">
            <TwinStatusIndicator />
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border-dim)' }} />
            {lastRefresh && (
              <span className="font-mono text-[10px] hidden md:block" style={{ color: 'var(--text-dim)' }}>
                {lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {loading && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00d4ff', opacity: 0.8 }}>
              </div>
            )}
            <button
              onClick={() => setAutoRefresh(a => !a)}
              title={autoRefresh ? 'Auto-Refresh aktiv (60s)' : 'Auto-Refresh aus'}
              className="w-7 h-7 rounded flex items-center justify-center transition-colors"
              style={{
                color:   autoRefresh ? '#2ddb72' : 'var(--text-dim)',
                border:  '1px solid var(--border-dim)',
              }}
            >
              {autoRefresh ? <Wifi size={11} /> : <WifiOff size={11} />}
            </button>
            <button
              onClick={refresh}
              className="w-7 h-7 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}
              title="Manuell aktualisieren"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 py-5">
        {noEnv && (
          <div className="mb-5 px-4 py-2.5 rounded font-mono text-xs"
            style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.18)', color: '#f5a623' }}>
            DEMO MODE — VITE_SHEET_ID konfigurieren für Live-Daten (PDSTUDIO)
          </div>
        )}
        {error && !leads.length && (
          <div className="mb-5 px-4 py-2.5 rounded font-mono text-xs"
            style={{ background: 'rgba(240,58,58,0.06)', border: '1px solid rgba(240,58,58,0.18)', color: '#f03a3a' }}>
            ✗ {error}
          </div>
        )}

        <CommandKPIs leads={leads} />
        <PipelineHealth leads={leads} />

        <AnimatePresence mode="popLayout" initial={false}>
          {isPepeOpen ? (
            <motion.div
              key="pepe-control-room"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}>
              <ErrorBoundary>
                <PepeControlRoom
                  leads={leads}
                  executions={executions}
                  onBack={() => setIsPepeOpen(false)}
                />
              </ErrorBoundary>
            </motion.div>
          ) : selectedLead ? (
            <motion.div
              key={`detail-${selectedLead.lead_id || selectedLead.website || selectedLead.name || 'x'}`}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}>
              <ErrorBoundary>
                <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'control' ? (
            <motion.div key="control"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}>

              {/* Active Lead Banner — shows active working lead */}
              <ActiveLeadBanner
                lead={activeLead}
                onOpenDetail={() => { if (activeLead) selectLead(activeLead) }}
                onClear={() => setActiveLead(null)}
                onOpenLeads={() => setActiveTab('leads')}
              />

              <CommandBar onLaunched={refresh} leads={leads} />

              {isMobile ? (
                <MobileAgentCity
                  leads={leads}
                  executions={executions}
                  activeLead={activeLead}
                  onOpenPepeRoom={() => { setIsPepeOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  onOpenLeads={() => setActiveTab('leads')}
                />
              ) : (
                <AgentCityScene
                  leads={leads}
                  executions={executions}
                  activeLead={activeLead}
                  onOpenPepeRoom={() => { setIsPepeOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  onOpenLeads={() => setActiveTab('leads')}
                />
              )}

              {leads.length > 0 && <RecentLeads leads={leads} onSelect={selectLead} activeLead={activeLead} onSetActive={setLeadActive} />}
            </motion.div>
          ) : activeTab === 'leads' ? (
            <motion.div key="leads"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}>
              <LeadsView leads={leads} onSelectLead={selectLead} activeLead={activeLead} onSetActive={setLeadActive} />
            </motion.div>
          ) : activeTab === 'sites' ? (
            <motion.div key="sites"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}>
              <SitesView leads={leads} />
            </motion.div>
          ) : activeTab === 'executions' ? (
            <motion.div key="executions"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}>
              <ExecutionsView executions={executions} stop={stop} stopping={stopping} refresh={refreshExec} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer — PDSTUDIO branding + legal */}
      <footer
        className="mt-16 border-t"
        style={{ borderColor: 'var(--border-dim)' }}
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded flex items-center justify-center font-mono font-black text-[9px] flex-shrink-0"
              style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              PD
            </div>
            <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
              PDSTUDIO &mdash; KI-gestützte Restaurant-Websites
            </span>
          </div>
          <nav className="flex items-center gap-4">
            {[
              ['Impressum',   'https://pdstudio.de/impressum'],
              ['Datenschutz', 'https://pdstudio.de/datenschutz'],
              ['AGB',         'https://pdstudio.de/agb'],
              ['Kontakt',     'https://pdstudio.de/kontakt'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-wider transition-colors"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                {label}
              </a>
            ))}
            <span className="font-mono text-[10px]" style={{ color: 'var(--border-focus)', userSelect: 'none' }}>
              &copy; {new Date().getFullYear()}
            </span>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function RecentLeads({ leads, onSelect, activeLead, onSetActive }) {
  const STAGE_LABELS = ['', 'LEAD', 'TEXT', 'IMG', 'VALID', 'CONCEPT', 'BUILD', 'LIVE']
  const STAGE_COLORS = ['', '#00d4ff', '#e8197f', '#2ddb72', '#f5a623', '#9b6ef3', '#00d4ff', '#e8197f']

  function scoreColor(n) {
    if (n >= 60) return '#2ddb72'
    if (n >= 40) return '#f5a623'
    return '#f03a3a'
  }

  const sorted = [...leads]
    .filter(l => (+l.score || 0) >= 50)
    .sort((a, b) => (+b.score || 0) - (+a.score || 0))
    .slice(0, 8)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <TrendingUp size={10} style={{ color: 'var(--text-dim)' }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-dim)' }}>
          TOP LEADS
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>({sorted.length})</span>
        <span className="ml-auto font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
          Score ≥ 50
        </span>
      </div>
      <div className="p-1">
        {sorted.map(lead => {
          const stage      = getLeadStage(lead)
          const score      = +lead.score || 0
          const sc         = scoreColor(score)
          const stageColor = STAGE_COLORS[stage] || 'var(--text-dim)'
          const stageLabel = STAGE_LABELS[stage] || ''
          const conf       = getConfidence(lead)
          const isActive   = activeLead?.lead_id === lead.lead_id

          return (
            <div
              key={lead.lead_id}
              className="flex items-center gap-1"
              style={{
                background: isActive ? 'rgba(155,110,243,0.06)' : 'transparent',
                borderRadius: 6,
                outline: isActive ? '1px solid rgba(155,110,243,0.2)' : 'none',
              }}
            >
              {/* Set as active button */}
              <button
                onClick={() => onSetActive(lead)}
                title={isActive ? 'Deselektieren' : 'Als aktiven Lead setzen'}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ml-1"
                style={{
                  color: isActive ? '#9b6ef3' : 'rgba(255,255,255,0.15)',
                  transition: 'color 150ms',
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                  <circle cx="4" cy="4" r={isActive ? 4 : 2.5} />
                </svg>
              </button>

              <motion.button
                onClick={() => onSelect(lead)}
                className="flex-1 flex items-center gap-3 px-2 py-2 rounded text-left"
                style={{ background: 'transparent' }}
                whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                whileTap={{ scale: 0.998 }}
                transition={{ duration: 0.1 }}
              >
                <span className="font-mono text-xs font-black tabular-nums w-7 text-right flex-shrink-0"
                  style={{ color: sc }}>
                  {score || '—'}
                </span>
                <span className="flex-1 font-ui text-sm truncate" style={{ color: isActive ? 'var(--text-hi)' : 'var(--text)' }}>
                  {lead.name || lead.lead_id}
                </span>
                {conf > 0 && (
                  <span className="font-mono text-[9px] flex-shrink-0 tabular-nums"
                    style={{ color: conf >= 0.8 ? '#2ddb72' : '#f5a623' }}>
                    {Math.round(conf * 100)}%
                  </span>
                )}
                {stageLabel && (
                  <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{ color: stageColor, background: `${stageColor}10`, border: `1px solid ${stageColor}22` }}>
                    {stageLabel}
                  </span>
                )}
              </motion.button>
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div className="px-4 py-5 text-center font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
            Keine aktiven Leads mit Score ≥ 50
          </div>
        )}
      </div>
    </div>
  )
}

export default function Root() {
  return (
    <TwinProvider>
      <PasswordGate>
        <App />
      </PasswordGate>
      <TwinVoiceOrb />
      <TwinConversationPanel />
    </TwinProvider>
  )
}
