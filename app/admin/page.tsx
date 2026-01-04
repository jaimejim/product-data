'use client'

import { useState } from 'react'

interface HealthStatus {
  api: 'ok' | 'error' | 'checking'
  database: 'ok' | 'error' | 'checking'
  apiMessage?: string
  dbMessage?: string
}

interface Stats {
  totalProducts: number
  totalAnalyses: number
  avgConfidence: number
  recentProducts: any[]
}

export default function AdminPage() {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'checking',
    database: 'checking',
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [initStatus, setInitStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setHealth({ api: 'checking', database: 'checking' })

    try {
      const response = await fetch('/api/admin/health')
      const data = await response.json()

      setHealth({
        api: data.api === 'ok' ? 'ok' : 'error',
        database: data.database === 'ok' ? 'ok' : 'error',
        apiMessage: data.apiMessage,
        dbMessage: data.dbMessage,
      })
    } catch (error) {
      setHealth({
        api: 'error',
        database: 'error',
        apiMessage: 'Failed to check health',
      })
    }
  }

  const initDatabase = async () => {
    setLoading(true)
    setInitStatus('Initializing database...')

    try {
      const response = await fetch('/api/admin/init', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        setInitStatus('✅ Database initialized successfully!')
        setTimeout(() => checkHealth(), 1000)
      } else {
        setInitStatus(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setInitStatus(`❌ Failed to initialize: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const StatusBadge = ({ status }: { status: 'ok' | 'error' | 'checking' }) => {
    const colors = {
      ok: 'bg-green-100 text-green-800 border-green-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      checking: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    }
    const labels = {
      ok: '✓ OK',
      error: '✗ Error',
      checking: '⟳ Checking...',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-700 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">DATABASE ADMIN</h1>
          <p className="text-gray-400 text-sm mt-1">Product Health Analyzer</p>
          <div className="mt-2 text-xs text-gray-500">
            <a href="/" className="hover:text-white">→ Main Site</a>
            {' | '}
            <a href="https://github.com/jaimejim/product-data" className="hover:text-white">→ GitHub</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* 1. Health Check */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">1. SYSTEM HEALTH</h2>
          <p className="text-gray-400 mb-4">Check API and database connectivity</p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span>Claude API</span>
              <StatusBadge status={health.api} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span>PostgreSQL Database</span>
              <StatusBadge status={health.database} />
            </div>
          </div>

          {(health.apiMessage || health.dbMessage) && (
            <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 mb-4">
              {health.apiMessage && <div>API: {health.apiMessage}</div>}
              {health.dbMessage && <div>DB: {health.dbMessage}</div>}
            </div>
          )}

          <button
            onClick={checkHealth}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors"
          >
            CHECK HEALTH
          </button>
        </div>

        {/* 2. Database Initialization */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">2. DATABASE INITIALIZATION</h2>
          <div className="flex items-start gap-2 mb-4 text-yellow-400">
            <span>⚠</span>
            <span className="text-sm">Run this ONCE to create database tables and indexes</span>
          </div>

          {initStatus && (
            <div className="bg-gray-900 p-3 rounded text-sm mb-4">
              {initStatus}
            </div>
          )}

          <button
            onClick={initDatabase}
            disabled={loading}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'INITIALIZING...' : 'RUN MIGRATION'}
          </button>
        </div>

        {/* 3. Statistics */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">3. STATISTICS</h2>
          <p className="text-gray-400 mb-4">View database statistics and recent analyses</p>

          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <div className="text-sm text-gray-400">Unique Products</div>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
                <div className="text-sm text-gray-400">Total Analyses</div>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-400">Avg Confidence</div>
              </div>
            </div>
          )}

          {stats?.recentProducts && stats.recentProducts.length > 0 && (
            <div className="bg-gray-900 p-4 rounded mb-4">
              <h3 className="font-bold mb-2">Recent Products:</h3>
              <div className="space-y-2 text-sm">
                {stats.recentProducts.map((product: any, i: number) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span>{product.product_name || 'Unknown'}</span>
                    <span>Rating: {product.overall_rating}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={loadStats}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors"
          >
            LOAD STATISTICS
          </button>
        </div>

        {/* 4. Quick Links */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">4. QUICK LINKS</h2>
          <div className="space-y-2 text-sm">
            <div>
              <a href="/" className="text-blue-400 hover:underline">→ Main Application</a>
            </div>
            <div>
              <a href="/api/analyze" className="text-blue-400 hover:underline">→ API Endpoint (GET for health)</a>
            </div>
            <div>
              <a href="https://vercel.com/dashboard" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                → Vercel Dashboard
              </a>
            </div>
            <div>
              <a href="https://console.neon.tech/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                → Neon Database Console
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
