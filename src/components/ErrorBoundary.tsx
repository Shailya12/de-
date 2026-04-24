'use client'
import { Component, type ReactNode } from 'react'
import { Shield, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message ?? 'Unknown error' }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <Shield className="w-6 h-6" style={{ color: '#F87171' }} />
        </div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
          An unexpected error occurred. Your data is safe.
        </p>
        <p className="text-xs mb-6 font-mono px-3 py-1.5 rounded-lg max-w-sm truncate"
          style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          {this.state.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <RefreshCw className="w-4 h-4" /> Reload app
        </button>
      </div>
    )
  }
}
