import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchExecutions, stopExecution } from '../lib/n8n'

export function useExecutions(intervalMs = 8000) {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading]       = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [stopping, setStopping]     = useState(new Set())
  const timerRef = useRef(null)

  const refresh = useCallback(async () => {
    const data = await fetchExecutions(30)
    setExecutions(data)
    setLoading(false)
    setLastUpdate(new Date())
  }, [])

  const stop = useCallback(async (id) => {
    setStopping(s => new Set([...s, id]))
    try {
      await stopExecution(id)
      await refresh()
    } catch (e) {
      console.error('Stop failed:', e)
    } finally {
      setStopping(s => { const n = new Set(s); n.delete(id); return n })
    }
  }, [refresh])

  useEffect(() => { refresh() }, [refresh])

  const hasRunning = executions.some(e => e.status === 'running')

  return { executions, loading, lastUpdate, refresh, stop, stopping, hasRunning }
}
