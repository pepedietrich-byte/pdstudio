import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ChevronRight } from 'lucide-react'

const PASS = '20051023'
const KEY  = 'cc_auth_v1'
const EASE = [0.23, 1, 0.32, 1]

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(KEY) === '1')
  const [input,  setInput]  = useState('')
  const [shake,  setShake]  = useState(false)
  const [error,  setError]  = useState(false)

  function submit(e) {
    e.preventDefault()
    if (input === PASS) {
      sessionStorage.setItem(KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
      setTimeout(() => setError(false), 2000)
    }
  }

  if (authed) return children

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Cinematic grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial vignette center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Scan line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-sm relative z-10"
      >
        {/* PD logo mark */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,229,255,0.15)',
                transform: 'scale(1.35)',
                borderRadius: 16,
              }}
            />
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,229,255,0.06) 100%)',
                border: '1px solid rgba(0,229,255,0.35)',
                boxShadow: '0 0 32px rgba(0,229,255,0.18), inset 0 0 16px rgba(0,229,255,0.06)',
              }}
            >
              <span
                className="font-mono font-bold tracking-tight"
                style={{
                  fontSize: '1.35rem',
                  color: '#00e5ff',
                  textShadow: '0 0 16px rgba(0,229,255,0.8)',
                }}
              >
                PD
              </span>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-0.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3, ease: EASE }}
          >
            <span
              className="font-mono font-bold text-base tracking-[0.25em]"
              style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.5)' }}
            >
              PDSTUDIO
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.3em]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              COMMAND CENTER
            </span>
          </motion.div>
        </div>

        {/* Auth form */}
        <motion.form
          onSubmit={submit}
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="hud-border p-7"
          style={{
            borderColor: error ? 'rgba(255,59,59,0.45)' : 'rgba(0,229,255,0.22)',
            background:  error
              ? 'linear-gradient(135deg, rgba(255,59,59,0.04) 0%, transparent 60%)'
              : 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, transparent 60%)',
            boxShadow: error
              ? '0 0 40px rgba(255,59,59,0.08)'
              : '0 0 40px rgba(0,229,255,0.06)',
            transition: 'all 300ms ease',
          }}
        >
          {/* Status row */}
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              animate={error ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Lock
                size={13}
                style={{ color: error ? '#ff3b3b' : '#00e5ff', opacity: 0.75 }}
              />
            </motion.div>
            <span
              className="font-mono text-[10px] tracking-[0.2em] font-semibold"
              style={{ color: error ? 'rgba(255,59,59,0.9)' : 'rgba(0,229,255,0.85)' }}
            >
              {error ? 'FALSCHES PASSWORT' : 'AUTHENTIFIZIERUNG ERFORDERLICH'}
            </span>

            {/* Animated status dot */}
            <motion.div
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ background: error ? '#ff3b3b' : '#00e5ff' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Password input */}
          <div className="relative mb-5">
            <input
              autoFocus
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              placeholder="••••••"
              className="w-full rounded px-4 py-3 font-mono text-center text-xl text-white/90 outline-none transition-all"
              style={{
                background:    error
                  ? 'rgba(255,59,59,0.05)'
                  : 'rgba(255,255,255,0.04)',
                border:        `1px solid ${error ? 'rgba(255,59,59,0.5)' : 'rgba(255,255,255,0.12)'}`,
                letterSpacing: '0.5em',
                boxShadow:     error
                  ? '0 0 0 1px rgba(255,59,59,0.1)'
                  : 'none',
                transition:    'all 200ms ease',
              }}
              onFocus={e => {
                if (!error) {
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.5)'
                  e.currentTarget.style.boxShadow   = '0 0 0 1px rgba(0,229,255,0.1), 0 0 16px rgba(0,229,255,0.08)'
                  e.currentTarget.style.background  = 'rgba(0,229,255,0.04)'
                }
              }}
              onBlur={e => {
                if (!error) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.boxShadow   = 'none'
                  e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
                }
              }}
            />
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded font-mono font-bold text-sm tracking-widest"
            style={{
              background:  'rgba(0,229,255,0.14)',
              color:       '#00e5ff',
              border:      '1px solid rgba(0,229,255,0.45)',
              boxShadow:   '0 0 20px rgba(0,229,255,0.16)',
              letterSpacing: '0.15em',
            }}
            whileHover={{
              scale:     1.02,
              boxShadow: '0 0 32px rgba(0,229,255,0.35)',
              background: 'rgba(0,229,255,0.2)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1, ease: EASE }}
          >
            <ChevronRight size={14} />
            ZUGANG
          </motion.button>
        </motion.form>

        {/* Footer note */}
        <div
          className="text-center mt-5 font-mono text-[9px] tracking-[0.25em]"
          style={{ color: 'rgba(255,255,255,0.12)' }}
        >
          PDSTUDIO // RESTRICTED ACCESS
        </div>
      </motion.div>
    </div>
  )
}
