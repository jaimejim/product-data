'use client'

import { useState } from 'react'
import Camera from './components/Camera'
import ResultCard from './components/ResultCard'
import type { AnalysisResult } from '@/lib/types'

type AppState = 'idle' | 'analyzing' | 'success' | 'error'

export default function Home() {
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState<string>('')

  const handleCapture = async (imageBase64: string) => {
    setState('analyzing')
    setError('')
    setProgress('Analyzing product...')

    try {
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
      console.error('Analysis error:', err)
      setError('Failed to analyze product. Please try again.')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setError('')
    setProgress('')
  }

  const handleCameraError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔍 Product Health Analyzer
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Analyze ingredients from food and personal care products
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Idle State - Camera */}
        {state === 'idle' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Scan a Product
              </h2>
              <p className="text-gray-600">
                Take a photo of the ingredient list or upload an image
              </p>
            </div>
            <Camera onCapture={handleCapture} onError={handleCameraError} />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-semibold mb-1">⚠️ Error</p>
                <p className="whitespace-pre-line">{error}</p>
              </div>
            )}

            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-blue-900 mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Take a clear photo of the ingredient list (back of product)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Our AI analyzes health and safety of each ingredient</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Get instant scores and detailed concerns</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {state === 'analyzing' && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {progress}
            </h2>
            <p className="text-gray-600">
              This may take a few seconds...
            </p>
          </div>
        )}

        {/* Success State - Results */}
        {state === 'success' && result && (result.status === 'success' || result.status === 'cached') && (
          <ResultCard
            result={result.data}
            isCached={result.status === 'cached'}
            onReset={handleReset}
          />
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                ⚠️ Analysis Failed
              </h2>
              <p className="text-red-800 whitespace-pre-line mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            Powered by Claude AI • For informational purposes only
          </p>
        </div>
      </footer>
    </main>
  )
}
