// ─── Voice Bridge Status ───────────────────────────────────────────────────
// Zeigt den realen Status der ElevenLabs Voice-Tool-Bridge.
// Pingt /api/twin-tool um zu bestätigen dass der Endpoint live ist.
//
// Status-Stufen:
//   not_configured | webhook_ready | tested | live
// Kein Fake-Live-Status: tested ist nur sichtbar nach erfolgreichem Test im Browser.

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, CheckCircle2, AlertCircle, Loader2, RadioTower } from 'lucide-react'

const STATUS_META = {
  not_configured: { color: '#9ca3b5', label: 'Not Configured', icon: WifiOff,
    hint: 'API-Route /api/twin-tool antwortet nicht. Vercel-Deploy prüfen.' },
  webhook_ready: { color: '#f5a623', label: 'Webhook Ready', icon: Wifi,
    hint: 'API live. ElevenLabs Setup steht noch aus (siehe ELEVENLABS_SETUP.md).' },
  tested: { color: '#39ff88', label: 'Tested', icon: CheckCircle2,
    hint: 'Mindestens ein Test-Call erfolgreich.' },
  live: { color: '#ffd700', label: 'Live · Voice Active', icon: RadioTower,
    hint: 'Aktive Voice-Session läuft Tool-Calls aus.' },
}

const TESTED_KEY = 'voice_bridge_tested_at_v1'

export default function VoiceBridgeStatus({ twinStatus = 'disconnected' }) {
  const [bridgeStatus, setBridgeStatus] = useState('checking')
  const [lastError, setLastError] = useState('')
  const [testing, setTesting] = useState(false)
  const [testedAt, setTestedAt] = useState(() => {
    try { return localStorage.getItem(TESTED_KEY) } catch { return null }
  })

  const checkEndpoint = useCallback(async () => {
    setBridgeStatus('checking')
    setLastError('')
    try {
      const r = await fetch('/api/twin-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'show_next_action' }),
      })
      if (r.ok) {
        // Endpoint erreichbar → mindestens webhook_ready
        if (testedAt) setBridgeStatus('tested')
        else setBridgeStatus('webhook_ready')
      } else {
        setBridgeStatus('not_configured')
        setLastError(`${r.status}: ${(await r.text()).slice(0, 60)}`)
      }
    } catch (e) {
      setBridgeStatus('not_configured')
      setLastError(e.message)
    }
  }, [testedAt])

  useEffect(() => { checkEndpoint() }, [checkEndpoint])

  // Live-Status wenn Voice-Session läuft UND tested vorher
  const effectiveStatus = (twinStatus === 'connected' && (bridgeStatus === 'tested' || testedAt))
    ? 'live'
    : bridgeStatus === 'checking' ? 'webhook_ready' : bridgeStatus

  const runFullTest = useCallback(async () => {
    setTesting(true)
    setLastError('')
    try {
      // 2 Tests: safe + confirmation-pflichtig
      const r1 = await fetch('/api/twin-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'show_next_action' }),
      })
      const d1 = await r1.json()
      if (!d1.ok && d1.requiresClientExecution !== true) {
        throw new Error('Safe-Intent fail: ' + (d1.error || d1.spoken))
      }
      const r2 = await fetch('/api/twin-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'send_mail', confirmed: true }),
      })
      const d2 = await r2.json()
      if (!d2.blocked) {
        throw new Error('Voice-Block-Test fehlgeschlagen: send_mail wurde nicht geblockt')
      }
      // Beide Tests grün
      const now = new Date().toISOString()
      try { localStorage.setItem(TESTED_KEY, now) } catch { /* noop */ }
      setTestedAt(now)
      setBridgeStatus('tested')
    } catch (e) {
      setLastError(e.message)
    } finally {
      setTesting(false)
    }
  }, [])

  const meta = STATUS_META[effectiveStatus] || STATUS_META.not_configured
  const Icon = meta.icon

  return (
    <div className="rounded-lg p-3"
      style={{
        background: `${meta.color}08`,
        border: `1px solid ${meta.color}30`,
      }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {testing ? (
            <Loader2 size={12} className="animate-spin" style={{ color: meta.color }} />
          ) : (
            <Icon size={12} style={{ color: meta.color }} />
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: meta.color }}>
            Voice Bridge · {meta.label}
          </span>
        </div>
        <button onClick={runFullTest}
          disabled={testing}
          className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#9ca3b5',
          }}>
          {testing ? 'läuft…' : 'Test'}
        </button>
      </div>
      <div className="text-[9px] mt-1.5" style={{ color: '#9ca3b5' }}>
        {meta.hint}
      </div>
      {testedAt && (
        <div className="font-mono text-[8px] mt-1" style={{ color: '#6b7a90' }}>
          Last test: {testedAt}
        </div>
      )}
      {lastError && (
        <div className="text-[9px] mt-1 flex items-start gap-1" style={{ color: '#ef4444' }}>
          <AlertCircle size={9} className="mt-0.5" />
          <span>{lastError}</span>
        </div>
      )}
    </div>
  )
}
