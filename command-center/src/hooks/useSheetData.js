import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllTabs, joinLeadData } from '../lib/sheets'
import { subscribe, extractStageChange } from '../lib/activityBus'

export function useSheetData(intervalMs = 60000) {
  const [sheets, setSheets]     = useState({})
  const [leads, setLeads]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  // ── Live-Pulse: signal that a specific lead just changed (drives row highlight)
  const [pulse, setPulse]       = useState(null)  // { leadId, tool, ts }
  const timerRef = useRef(null)
  const busDebounceRef = useRef(null)

  // silent=true → kein loading-Flag-Flicker (für Bus-getriggerte Refetches)
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const data = await fetchAllTabs()
      const newLeads = joinLeadData(data)
      if (newLeads.length > 0) {
        setSheets(data)
        setLeads(newLeads)
      } else {
        setLeads(prev => prev.length > 0 ? prev : newLeads)
      }
      setLastRefresh(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!autoRefresh) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(refresh, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [autoRefresh, refresh, intervalMs])

  // ── ActivityBus → Live-Update ohne Page-Reboot ─────────────────────────────
  useEffect(() => {
    const unsub = subscribe(event => {
      if (event.type !== 'tool_result' || !event.ok) return
      const touchesLeads = event.affectedEntities?.includes('leads')
      if (!touchesLeads && !event.leadId) return

      // 1) Optimistic patch — sofort sichtbar machen
      const stageChange = extractStageChange(event.tool, event.result)
      if (event.leadId && stageChange) {
        setLeads(prev => prev.map(l => {
          if (l.lead_id !== event.leadId) return l
          const patched = { ...l }
          if (stageChange.score !== undefined) patched.score = stageChange.score
          if (stageChange.band) patched.score_band = stageChange.band.id
          if (stageChange.newStage !== undefined) patched.stage = stageChange.newStage
          patched._lastTouched = event.ts
          patched._lastTool = event.tool
          return patched
        }))
      }
      // 2) Pulse-Signal für UI-Highlight
      setPulse({ leadId: event.leadId, tool: event.tool, ts: event.ts })

      // 3) Debounced silent refetch — reconciled gegen Sheets nach 800ms
      clearTimeout(busDebounceRef.current)
      busDebounceRef.current = setTimeout(() => {
        refresh({ silent: true })
      }, 800)
    })
    return () => {
      unsub()
      clearTimeout(busDebounceRef.current)
    }
  }, [refresh])

  return { sheets, leads, loading, error, lastRefresh, autoRefresh, setAutoRefresh, refresh, pulse }
}
