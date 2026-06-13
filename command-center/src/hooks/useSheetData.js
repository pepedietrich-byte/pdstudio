import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllTabs, joinLeadData } from '../lib/sheets'

export function useSheetData(intervalMs = 60000) {
  const [sheets, setSheets]     = useState({})
  const [leads, setLeads]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const timerRef = useRef(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllTabs()
      const newLeads = joinLeadData(data)
      // Never flash leads to 0 — keep previous data if fetch returned nothing
      if (newLeads.length > 0) {
        setSheets(data)
        setLeads(newLeads)
      } else {
        // Still update sheets but keep existing leads visible
        setLeads(prev => prev.length > 0 ? prev : newLeads)
      }
      setLastRefresh(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
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

  return { sheets, leads, loading, error, lastRefresh, autoRefresh, setAutoRefresh, refresh }
}
