import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTwin } from './TwinContext'
import { Trash2 } from 'lucide-react'

const GOLD = '#ffd700'
const GREEN = '#2ddb72'

export default function TwinTranscriptPanel() {
  const { messages, clearMessages, status } = useTwin()
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: status === 'connected' ? GREEN : `${GOLD}44`,
            boxShadow: status === 'connected' ? `0 0 6px ${GREEN}` : 'none',
          }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: `${GOLD}88`,
          }}>
            TRANSKRIPT
          </span>
          {messages.length > 0 && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8, color: 'var(--text-dim)',
            }}>
              ({messages.length})
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', padding: 4,
              display: 'flex', alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f03a3a'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            title="Verlauf löschen"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingTop: 48,
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textAlign: 'center', lineHeight: 1.8,
            }}>
              {status === 'connected'
                ? 'Warte auf erste Nachricht…'
                : 'TWIN wartet auf Verbindung.'}
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isAgent = msg.source === 'agent' || msg.role === 'assistant'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    display: 'flex',
                    justifyContent: isAgent ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div style={{
                    maxWidth: '82%',
                    padding: '8px 12px',
                    borderRadius: isAgent ? '2px 10px 10px 10px' : '10px 2px 10px 10px',
                    background: isAgent
                      ? 'rgba(255,215,0,0.04)'
                      : 'rgba(45,219,114,0.04)',
                    border: `1px solid ${isAgent ? `${GOLD}14` : `${GREEN}14`}`,
                  }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                      color: isAgent ? `${GOLD}66` : `${GREEN}66`,
                      marginBottom: 5,
                    }}>
                      {isAgent ? 'TWIN' : 'PEPE'}
                    </div>
                    <div style={{
                      fontFamily: 'Geist, system-ui, sans-serif',
                      fontSize: 13, lineHeight: 1.55,
                      color: isAgent ? 'var(--text-hi)' : 'var(--text)',
                    }}>
                      {msg.message || msg.content || ''}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
