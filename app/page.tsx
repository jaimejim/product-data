'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Camera from './components/Camera'
import ResultCard from './components/ResultCard'
import type { AnalysisResult } from '@/lib/types'
import { getHistory, addToHistory, type HistoryItem } from '@/lib/history'
import { saveSharedResult } from '@/lib/share'

type AppState = 'idle' | 'analyzing' | 'success' | 'error' | 'history'

interface GlobalProduct {
  ingredients_hash: string
  product_name: string | null
  brand: string | null
  category: string
  overall_rating: number
  created_at: string
  updated_at: string
  times_requested: number
}

export default function Home() {
  const router = useRouter()
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsed, setElapsed] = useState<number>(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [shareHash, setShareHash] = useState<string>('')
  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([])
  const [showGlobal, setShowGlobal] = useState(false)

  useEffect(() => {
    if (state !== 'analyzing') return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 100)
    return () => clearInterval(interval)
  }, [state, startTime])

  useEffect(() => {
    setHistory(getHistory())
  }, [state])

  useEffect(() => {
    // Fetch global products on mount and refresh periodically
    const fetchGlobal = () => {
      fetch('/api/products/recent')
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setGlobalProducts(data.products)
          }
        })
        .catch((err) => console.error('Failed to fetch global products:', err))
    }

    fetchGlobal()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchGlobal, 10000)
    return () => clearInterval(interval)
  }, [state])

  // Function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleCapture = async (imageBase64: string) => {
    setState('analyzing')
    setError('')
    setStartTime(Date.now())
    setElapsed(0)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data: AnalysisResult = await response.json()

      if (data.status === 'success' || data.status === 'cached') {
        setResult(data)
        setState('success')
        addToHistory(data.data)

        // Generate shareable hash and update URL
        const hash = await saveSharedResult(data.data)
        if (hash) {
          setShareHash(hash)
          router.push(`/${hash}`, { scroll: false })
        }
      } else if (data.status === 'poor_quality') {
        setError(data.message + '\n\n' + data.suggestion)
        setState('error')
      } else if (data.status === 'not_product') {
        setError(data.message)
        setState('error')
      } else if (data.status === 'error') {
        setError(data.message)
        setState('error')
      }
    } catch (err) {
      setError('Analysis failed. Try a clearer photo.')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setError('')
    setElapsed(0)
    setShowHistory(false)
    setShareHash('')
    router.push('/', { scroll: false })
  }

  const handleViewHistory = async (item: HistoryItem) => {
    setResult({ status: 'cached', data: item.data, cached_at: new Date(item.timestamp).toISOString() })
    setState('success')

    // Generate shareable hash for history item
    const hash = await saveSharedResult(item.data)
    if (hash) {
      setShareHash(hash)
      router.push(`/${hash}`, { scroll: false })
    }
  }

  return (
    <main className="min-h-screen bg-black font-mono text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {state === 'idle' && (
          <div className="space-y-8">
            <div className="text-center py-8">
              <h1 className="text-3xl font-bold text-green-400 mb-2">
                ANALYZER
              </h1>
              <p className="text-gray-500 text-sm">
                scan product ingredients to check health safety and toxicity ratings
              </p>
            </div>

            <Camera onCapture={handleCapture} onError={setError} />

            {error && (
              <div className="border border-red-900 bg-red-950/30 p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {history.length > 0 && (
              <div className="border-t border-gray-900 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm text-gray-500">RECENT SCANS</h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-green-600 hover:text-green-500"
                  >
                    {showHistory ? 'HIDE' : `SHOW (${history.length})`}
                  </button>
                </div>

                {showHistory && (
                  <div className="space-y-2">
                    {history.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleViewHistory(item)}
                        className="w-full text-left p-3 border border-gray-900 hover:border-gray-700 hover:bg-gray-950 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {item.data.product_name || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(item.timestamp).toLocaleDateString()} • Score: {item.data.overall_rating}/10
                            </div>
                          </div>
                          <div className="ml-2 text-green-600">→</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {globalProducts.length > 0 && (
              <div className="border-t border-gray-900 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm text-gray-500">LATEST 20 PRODUCTS</h2>
                  <button
                    onClick={() => setShowGlobal(!showGlobal)}
                    className="text-xs text-green-600 hover:text-green-500"
                  >
                    {showGlobal ? 'HIDE' : `SHOW (${globalProducts.length})`}
                  </button>
                </div>

                {showGlobal && (
                  <div className="space-y-2">
                    {globalProducts.slice(0, 10).map((product) => (
                      <div
                        key={product.ingredients_hash}
                        className="w-full text-left p-3 border border-gray-900 bg-gray-950/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {product.product_name || 'Unknown Product'}
                            </div>
                            {product.brand && (
                              <div className="text-xs text-gray-500 truncate">{product.brand}</div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              {formatRelativeTime(product.updated_at)} • Score: {product.overall_rating}/10
                              {product.times_requested > 1 && ` • ${product.times_requested}x`}
                            </div>
                          </div>
                          <div className="ml-2">
                            <span className="text-xs px-2 py-1 bg-gray-900 text-gray-500 border border-gray-800">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {state === 'analyzing' && (
          <div className="py-16 text-center space-y-6">
            <div className="text-2xl text-green-400 animate-pulse">
              ANALYZING
            </div>
            <div className="flex gap-1 justify-center">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-green-600 animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div className="text-xs text-gray-600">
              {elapsed}s
            </div>
          </div>
        )}

        {state === 'success' && result && (result.status === 'success' || result.status === 'cached') && (
          <ResultCard
            result={result.data}
            isCached={result.status === 'cached'}
            onReset={handleReset}
            shareHash={shareHash}
          />
        )}

        {state === 'error' && (
          <div className="py-16 space-y-6">
            <div className="border border-red-900 bg-red-950/30 p-6">
              <div className="text-red-400 mb-4">ERROR</div>
              <p className="text-red-300 text-sm mb-6 whitespace-pre-line">{error}</p>
              <button
                onClick={handleReset}
                className="w-full py-3 border border-red-700 text-red-400 hover:bg-red-950"
              >
                RETRY
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
