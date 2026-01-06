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

interface DbTestResult {
  success: boolean
  connection?: string
  current_time?: string
  product_count?: string
  insert_test?: string
  insert_error?: string
  error?: string
}

interface LinkStats {
  total_products: string
  products_with_links: string
  products_without_links: string
  recent_products: any[]
  orphaned_links: any[]
}

export default function AdminPage() {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'checking',
    database: 'checking',
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [dbTest, setDbTest] = useState<DbTestResult | null>(null)
  const [linkStats, setLinkStats] = useState<LinkStats | null>(null)

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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const testDatabase = async () => {
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setDbTest(data)
    } catch (error) {
      console.error('Failed to test database:', error)
      setDbTest({ success: false, error: String(error) })
    }
  }

  const loadLinkStats = async () => {
    try {
      const response = await fetch('/api/debug/links')
      const data = await response.json()
      setLinkStats(data.stats ? data : null)
    } catch (error) {
      console.error('Failed to load link stats:', error)
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

        {/* 2. Statistics */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">2. STATISTICS</h2>
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

        {/* 3. Database Test */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">3. DATABASE CONNECTIVITY TEST</h2>
          <p className="text-gray-400 mb-4">Test database operations (read/write/delete)</p>

          {dbTest && (
            <div className="bg-gray-900 p-4 rounded mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={dbTest.success ? 'text-green-400' : 'text-red-400'}>
                  {dbTest.success ? '✓ SUCCESS' : '✗ FAILED'}
                </span>
              </div>
              {dbTest.connection && (
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="text-green-400">{dbTest.connection}</span>
                </div>
              )}
              {dbTest.product_count && (
                <div className="flex justify-between">
                  <span>Product Count:</span>
                  <span className="text-blue-400">{dbTest.product_count}</span>
                </div>
              )}
              {dbTest.insert_test && (
                <div className="flex justify-between">
                  <span>Insert Test:</span>
                  <span className={dbTest.insert_test.includes('OK') ? 'text-green-400' : 'text-red-400'}>
                    {dbTest.insert_test}
                  </span>
                </div>
              )}
              {dbTest.insert_error && (
                <div className="text-red-400">
                  <div>Insert Error:</div>
                  <div className="text-xs mt-1">{dbTest.insert_error}</div>
                </div>
              )}
              {dbTest.error && (
                <div className="text-red-400">Error: {dbTest.error}</div>
              )}
            </div>
          )}

          <button
            onClick={testDatabase}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors"
          >
            RUN DATABASE TEST
          </button>
        </div>

        {/* 4. Share Link Diagnostics */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">4. SHARE LINK DIAGNOSTICS</h2>
          <p className="text-gray-400 mb-4">Check product/share link relationship</p>

          {linkStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded">
                  <div className="text-2xl font-bold">{linkStats.total_products}</div>
                  <div className="text-sm text-gray-400">Total Products</div>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <div className="text-2xl font-bold text-green-400">{linkStats.products_with_links}</div>
                  <div className="text-sm text-gray-400">With Share Links</div>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{linkStats.products_without_links}</div>
                  <div className="text-sm text-gray-400">Without Links</div>
                </div>
              </div>

              {linkStats.recent_products && linkStats.recent_products.length > 0 && (
                <div className="bg-gray-900 p-4 rounded">
                  <h3 className="font-bold mb-2">Recent Products With Share Links:</h3>
                  <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                    {linkStats.recent_products
                      .filter((product: any) => product.share_hash) // Only products with links
                      .slice(0, 10)
                      .map((product: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-gray-800">
                          <span className="truncate flex-1">{product.product_name || 'Unknown'}</span>
                          <span className="text-green-400">✓ {product.share_hash}</span>
                        </div>
                      ))}
                  </div>
                  {linkStats.recent_products.filter((p: any) => p.share_hash).length === 0 && (
                    <div className="text-gray-500 text-xs">No products with share links yet</div>
                  )}
                </div>
              )}

              {linkStats.orphaned_links && linkStats.orphaned_links.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded">
                  <h3 className="font-bold mb-2 text-yellow-400">⚠ Orphaned Share Links:</h3>
                  <div className="text-xs text-gray-300">
                    {linkStats.orphaned_links.length} share links without product_id
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={loadLinkStats}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors"
          >
            LOAD LINK DIAGNOSTICS
          </button>
        </div>

        {/* 5. Quick Links */}
        <div className="border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">5. QUICK LINKS</h2>
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
