'use client'

import { useState, useEffect } from 'react'
import Camera from './components/Camera'
import ResultCard from './components/ResultCard'
import type { AnalysisResult } from '@/lib/types'

type AppState = 'idle' | 'analyzing' | 'success' | 'error'

export default function Home() {
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState<string>('')
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsed, setElapsed] = useState<number>(0)

  // Timer for elapsed time display
  useEffect(() => {
    if (state !== 'analyzing') return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 100)

    return () => clearInterval(interval)
  }, [state, startTime])

  const handleCapture = async (imageBase64: string) => {
    setState('analyzing')
    setError('')
    setStartTime(Date.now())
    setElapsed(0)
    setProgress('📤 Uploading image...')

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress('🤖 Claude AI analyzing ingredients...')

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageBase64 }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data: AnalysisResult = await response.json()

      if (data.status === 'success' || data.status === 'cached') {
        setResult(data)
        setState('success')
      } else if (data.status === 'poor_quality') {
        setError(data.message + '\n\n💡 ' + data.suggestion)
        setState('error')
      } else if (data.status === 'not_product') {
        setError(data.message)
        setState('error')
      } else if (data.status === 'error') {
        setError(data.message)
        setState('error')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError('❌ Failed to analyze product. Please try again with a clearer photo.')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setError('')
    setProgress('')
    setElapsed(0)
  }

  const handleCameraError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <main className="min-h-screen bg-black font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-400">
                &gt; product_health_analyzer
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                $ analyze --ingredients --health --toxicity
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-900 text-gray-400 text-sm border border-gray-800 hover:border-gray-700 hover:text-white transition-colors"
            >
              [admin]
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Idle State - Camera */}
        {state === 'idle' && (
          <div className="space-y-6">
            <div className="border border-gray-800 bg-gray-950 p-6">
              <div className="text-green-400 mb-4">
                <span className="text-gray-600">$</span> scan_product
              </div>
              <p className="text-gray-400 mb-6">
                Take a photo of the ingredient list or upload an image
              </p>
              <Camera onCapture={handleCapture} onError={handleCameraError} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="border border-red-900 bg-red-950/30 p-4">
                <p className="text-red-400 font-semibold mb-1">ERROR:</p>
                <p className="text-red-300 whitespace-pre-line">{error}</p>
              </div>
            )}

            {/* How it works */}
            <div className="border border-blue-900 bg-blue-950/20 p-6">
              <h3 className="text-blue-400 font-semibold mb-3">
                [INFO] How it works:
              </h3>
              <div className="space-y-2 text-sm text-blue-300/80">
                <div className="flex gap-3">
                  <span className="text-blue-500">1.</span>
                  <span>Capture ingredient list (back of product)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-500">2.</span>
                  <span>Claude Sonnet 4.5 analyzes health & safety</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-500">3.</span>
                  <span>Get instant scores (1-10 rating)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-500">4.</span>
                  <span>Cached results = instant (&lt;500ms)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {state === 'analyzing' && (
          <div className="border border-yellow-900 bg-yellow-950/20 p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="animate-pulse text-yellow-400 text-2xl">⚙</div>
              </div>
              <div className="flex-1">
                <div className="text-yellow-400 font-semibold mb-2">
                  [PROCESSING...]
                </div>
                <div className="text-yellow-300/80 mb-4">{progress}</div>

                {/* Progress dots */}
                <div className="flex gap-1 mb-4">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-yellow-600 animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>

                <div className="text-xs text-gray-500">
                  ⏱ Elapsed: {elapsed}s | Expected: ~5-20s for new products
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success State - Results */}
        {state === 'success' && result && (result.status === 'success' || result.status === 'cached') && (
          <div className="space-y-4">
            {result.status === 'cached' && (
              <div className="border border-green-900 bg-green-950/20 p-3 text-green-400 text-sm">
                ⚡ CACHE HIT: Results returned instantly
              </div>
            )}
            <ResultCard
              result={result.data}
              isCached={result.status === 'cached'}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="space-y-4">
            <div className="border-2 border-red-900 bg-red-950/30 p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                [ERROR] Analysis Failed
              </h2>
              <p className="text-red-300 whitespace-pre-line mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-red-700 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
              >
                &gt; try_again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              powered by <span className="text-gray-500">claude-sonnet-4-5</span>
            </div>
            <div>
              <span className="text-gray-700">// </span>
              for informational purposes only
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
