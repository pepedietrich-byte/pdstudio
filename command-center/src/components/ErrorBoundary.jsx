import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[PDSTUDIO ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const msg = this.state.error?.message || 'Unbekannter Fehler'
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-16 px-6"
        style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: 8 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: '#ff3b3b' }} />
          <span className="font-mono text-xs font-bold" style={{ color: '#ff3b3b' }}>
            RENDER-FEHLER
          </span>
        </div>
        <p className="font-mono text-xs text-center max-w-sm" style={{ color: 'var(--text-dim)' }}>
          {msg}
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={10} /> Erneut versuchen
        </button>
      </div>
    )
  }
}
