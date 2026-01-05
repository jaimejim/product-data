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
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsed, setElapsed] = useState<number>(0)

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
                scan ingredients
              </p>
            </div>

            <Camera onCapture={handleCapture} onError={setError} />

            {error && (
              <div className="border border-red-900 bg-red-950/30 p-4 text-red-300 text-sm">
                {error}
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
