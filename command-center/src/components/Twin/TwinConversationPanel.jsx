import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Brain, MessageSquare, Trash2, Plus, ChevronDown, Sparkles } from 'lucide-react'
import { useTwin } from './TwinContext'
import TwinCore from './TwinCore'
import TwinTranscriptPanel from './TwinTranscriptPanel'

const GOLD = '#ffd700'
const EASE = [0.23, 1, 0.32, 1]

const CATEGORY_OPTIONS = [
  { value: 'fact',       label: 'Fakt' },
  { value: 'decision',   label: 'Entscheidung' },
  { value: 'preference', label: 'Präferenz' },
  { value: 'goal',       label: 'Ziel' },
  { value: 'context',    label: 'Kontext' },
]

const IMPORTANCE_OPTIONS = [
  { value: 1, label: '○ Niedrig' },
  { value: 2, label: '◑ Mittel' },
  { value: 3, label: '● Kritisch' },
]

const CATEGORY_COLORS = {
  fact: '#00d4ff', decision: '#e8197f', preference: '#9b6ef3',
  goal: '#2ddb72', context: '#f5a623',
}

// ── Memory Panel ─────────────────────────────────────────────────

function MemoryPanel() {
  const {
    memories, suggestedMemories,
    addMemory, removeMemory,
    confirmSuggestion, dismissSuggestion,
    wipeMemory, CATEGORY_LABELS,
  } = useTwin()

  const [newText, setNewText]     = useState('')
  const [newCat, setNewCat]       = useState('fact')
  const [newImp, setNewImp]       = useState(2)
  const [showAdd, setShowAdd]     = useState(false)
  const [filter, setFilter]       = useState('all')

  const IMPORTLABELS = { 1: '○', 2: '◑', 3: '●' }
  const IMPORTCOLORS = { 1: 'var(--text-dim)', 2: '#f5a623', 3: '#f03a3a' }

  const filtered = filter === 'all' ? memories
    : memories.filter(m => m.category === filter)

  function handleAdd(e) {
    e.preventDefault()
    if (!newText.trim()) return
    addMemory(newText.trim(), newCat, newImp)
    setNewText('')
    setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={12} color={`${GOLD}88`} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: `${GOLD}88` }}>
            TWIN MEMORY
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-dim)' }}>
            ({memories.length})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowAdd(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700,
            color: GOLD, background: `${GOLD}0a`, border: `1px solid ${GOLD}22`,
            borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
          }}>
            <Plus size={9} /> NEU
          </button>
          {memories.length > 0 && (
            <button onClick={() => { if (confirm('Alle Memories löschen?')) wipeMemory() }} style={{
              color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Suggested memories from last session */}
        <AnimatePresence>
          {suggestedMemories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: `${GOLD}07`, border: `1px solid ${GOLD}25`,
                borderRadius: 8, padding: '10px 12px', marginBottom: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={10} color={GOLD} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '0.1em' }}>
                  VORSCHLÄGE AUS LETZTER SESSION
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestedMemories.map(s => (
                  <div key={s.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 6, padding: '7px 10px',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CATEGORY_COLORS[s.category] || GOLD, marginBottom: 3, letterSpacing: '0.08em' }}>
                        {(CATEGORY_LABELS[s.category] || s.category).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 11, color: 'var(--text)', lineHeight: 1.45 }}>
                        {s.content}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => confirmSuggestion(s.id)} style={{
                        background: 'rgba(45,219,114,0.12)', border: '1px solid rgba(45,219,114,0.3)',
                        borderRadius: 4, padding: '3px 8px',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#2ddb72', cursor: 'pointer',
                      }}>
                        ✓ SPEICHERN
                      </button>
                      <button onClick={() => dismissSuggestion(s.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 3,
                      }}>
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add memory form */}
        <AnimatePresence>
          {showAdd && (
            <motion.form
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              style={{
                background: 'rgba(255,215,0,0.03)', border: `1px solid ${GOLD}22`,
                borderRadius: 8, padding: '10px 12px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Was soll TWIN sich merken?"
                rows={2}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5, padding: '7px 10px', resize: 'none',
                  fontFamily: 'Geist, sans-serif', fontSize: 12, color: 'var(--text)',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5, padding: '5px 8px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text)',
                }}>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={newImp} onChange={e => setNewImp(+e.target.value)} style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5, padding: '5px 8px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text)',
                }}>
                  {IMPORTANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button type="submit" style={{
                  background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                  borderRadius: 5, padding: '5px 12px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
                  color: GOLD, cursor: 'pointer',
                }}>
                  SPEICHERN
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Category filter */}
        {memories.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'fact', 'decision', 'preference', 'goal', 'context'].map(cat => {
              const count = cat === 'all' ? memories.length : memories.filter(m => m.category === cat).length
              if (cat !== 'all' && count === 0) return null
              return (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4,
                  background: filter === cat ? `${CATEGORY_COLORS[cat] || GOLD}15` : 'transparent',
                  border: `1px solid ${filter === cat ? (CATEGORY_COLORS[cat] || GOLD) + '44' : 'rgba(255,255,255,0.06)'}`,
                  color: filter === cat ? (CATEGORY_COLORS[cat] || GOLD) : 'var(--text-dim)',
                  cursor: 'pointer',
                }}>
                  {cat === 'all' ? 'ALLE' : (CATEGORY_LABELS[cat] || cat).toUpperCase()} {count}
                </button>
              )
            })}
          </div>
        )}

        {/* Memory list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {memories.length === 0 ? 'Noch keine Erinnerungen gespeichert.' : 'Keine Einträge in dieser Kategorie.'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filtered.map(m => {
              const color = CATEGORY_COLORS[m.category] || GOLD
              const impColor = IMPORTCOLORS[m.importance] || 'var(--text-dim)'
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${color}14`,
                    borderLeft: `2px solid ${color}55`,
                    borderRadius: '0 6px 6px 0',
                    padding: '7px 10px',
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 10, color: impColor, flexShrink: 0, marginTop: 1 }}>
                    {IMPORTLABELS[m.importance] || '○'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, letterSpacing: '0.1em', color: `${color}88`, marginBottom: 3 }}>
                      {(CATEGORY_LABELS[m.category] || m.category || '').toUpperCase()}
                      {m.timestamp && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                          {new Date(m.timestamp).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 12, color: 'var(--text)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {m.content}
                    </div>
                  </div>
                  <button onClick={() => removeMemory(m.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 3, flexShrink: 0,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f03a3a'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Text Input ────────────────────────────────────────────────────

function TextInput() {
  const { sendText, status } = useTwin()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  const isConnected = status === 'connected'

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim() || !isConnected) return
    sendText(value)
    setValue('')
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', gap: 8, alignItems: 'center',
      padding: '10px 14px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(255,215,0,0.02)',
      flexShrink: 0,
    }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={isConnected ? 'Schreib TWIN…' : 'Erst TWIN starten…'}
        disabled={!isConnected}
        style={{
          flex: 1, background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${isConnected ? `${GOLD}22` : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 6, padding: '8px 12px',
          fontFamily: 'Geist, sans-serif', fontSize: 13,
          color: 'var(--text)', outline: 'none',
          opacity: isConnected ? 1 : 0.4,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { if (isConnected) e.target.style.borderColor = `${GOLD}44` }}
        onBlur={e => { e.target.style.borderColor = isConnected ? `${GOLD}22` : 'rgba(255,255,255,0.06)' }}
      />
      <button type="submit" disabled={!value.trim() || !isConnected} style={{
        width: 34, height: 34, borderRadius: 7,
        background: value.trim() && isConnected ? `${GOLD}12` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${value.trim() && isConnected ? `${GOLD}35` : 'rgba(255,255,255,0.07)'}`,
        color: value.trim() && isConnected ? GOLD : 'var(--text-muted)',
        cursor: value.trim() && isConnected ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}>
        <Send size={13} />
      </button>
    </form>
  )
}

// ── Main Panel ────────────────────────────────────────────────────

export default function TwinConversationPanel() {
  const { isOpen, setIsOpen, activeTab, setActiveTab, suggestedMemories } = useTwin()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, setIsOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="twin-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,4,12,0.85)', backdropFilter: 'blur(8px)' }}
          />

          {/* Panel */}
          <motion.div
            key="twin-panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.26, ease: EASE }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 201,
              width: 'min(960px, calc(100vw - 24px))',
              height: 'min(640px, calc(100vh - 48px))',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(6,6,16,0.99)',
              border: `1px solid ${GOLD}15`,
              borderRadius: 14, overflow: 'hidden',
              boxShadow: `0 0 100px ${GOLD}07, 0 40px 100px rgba(0,0,0,0.85)`,
            }}
          >
            {/* Scanlines */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)',
            }} />

            {/* Header */}
            <div style={{
              position: 'relative', zIndex: 1,
              height: 44, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: `rgba(255,215,0,0.02)`,
            }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: `rgba(255,215,0,0.08)`,
                  border: `1px solid ${GOLD}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 900, color: GOLD, letterSpacing: '-0.02em' }}>TP</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.12em' }}>
                    TWIN PEPE
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    CENTRAL INTELLIGENCE · PDSTUDIO
                  </div>
                </div>
              </div>

              {/* Close */}
              <button onClick={() => setIsOpen(false)} style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,58,58,0.1)'; e.currentTarget.style.color = '#f03a3a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-dim)' }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Body */}
            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

              {/* Left: Core */}
              <div style={{
                width: 'min(40%, 320px)', flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${GOLD}04 0%, transparent 70%)`,
              }}>
                <TwinCore />
              </div>

              {/* Right: Tabs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* Tab bar */}
                <div style={{
                  display: 'flex', gap: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  flexShrink: 0, padding: '0 14px',
                }}>
                  {[
                    { id: 'transcript', label: 'GESPRÄCH', icon: MessageSquare },
                    { id: 'memory',     label: 'MEMORY',   icon: Brain, badge: suggestedMemories.length },
                  ].map(({ id, label, icon: Icon, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      height: 36, padding: '0 12px',
                      background: 'none',
                      border: 'none', borderBottom: `2px solid ${activeTab === id ? GOLD : 'transparent'}`,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                      color: activeTab === id ? GOLD : 'var(--text-dim)',
                      cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                      marginBottom: -1,
                    }}>
                      <Icon size={10} />
                      {label}
                      {badge > 0 && (
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: '#f5a623', color: '#000',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 7, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: 2,
                        }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {activeTab === 'transcript'
                    ? <TwinTranscriptPanel />
                    : <MemoryPanel />
                  }
                </div>

                {/* Text input — only on transcript tab */}
                {activeTab === 'transcript' && <TextInput />}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              position: 'relative', zIndex: 1,
              padding: '5px 16px',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ESC</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>WebRTC · ElevenLabs · localStorage Memory</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
