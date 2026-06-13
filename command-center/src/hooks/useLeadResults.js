// Persistent per-lead agent results — stored in localStorage so they survive navigation
// Key: pdstudio_lead_results_v2
// Shape: { [lead_id]: { a2Mode, reservMode, a4Tone, a4Texts, a5Result, a6Result, notes } }

const STORAGE_KEY = 'pdstudio_lead_results_v2'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}
function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

import { useState, useCallback } from 'react'

export function useLeadResults(leadId) {
  const [store, setStore] = useState(load)

  const results = leadId ? (store[leadId] || {}) : {}

  const set = useCallback((key, value) => {
    if (!leadId) return
    setStore(prev => {
      const next = { ...prev, [leadId]: { ...(prev[leadId] || {}), [key]: value } }
      save(next)
      return next
    })
  }, [leadId])

  const setMany = useCallback((updates) => {
    if (!leadId) return
    setStore(prev => {
      const next = { ...prev, [leadId]: { ...(prev[leadId] || {}), ...updates } }
      save(next)
      return next
    })
  }, [leadId])

  const clear = useCallback((key) => {
    if (!leadId) return
    setStore(prev => {
      const lead = { ...(prev[leadId] || {}) }
      delete lead[key]
      const next = { ...prev, [leadId]: lead }
      save(next)
      return next
    })
  }, [leadId])

  return { results, set, setMany, clear }
}

// Read-only snapshot of all results (for TWIN context)
export function getAllLeadResults() {
  return load()
}
