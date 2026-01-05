'use client'

import { useState } from 'react'
import { AnalysisData, getSeverityColor } from '@/lib/types'
import ScoreDisplay from './ScoreDisplay'
import { shareUrl } from '@/lib/share'

interface ResultCardProps {
  result: AnalysisData
  isCached?: boolean
  onReset: () => void
  shareHash?: string
}

export default function ResultCard({ result, isCached, onReset, shareHash }: ResultCardProps) {
  const [shareStatus, setShareStatus] = useState('')

  const handleShare = async () => {
    if (!shareHash) return

    const url = `${window.location.origin}/${shareHash}`
    const title = result.product_name || 'Product Analysis'

    const success = await shareUrl(url, title)

    if (success) {
      setShareStatus('COPIED')
      setTimeout(() => setShareStatus(''), 2000)
    } else {
      setShareStatus('FAILED')
      setTimeout(() => setShareStatus(''), 2000)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="border border-gray-800 bg-gray-950 p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-2">
            <h2 className="text-2xl font-bold text-white">
              {result.product_name || 'Product Analysis'}
            </h2>
            {result.brand && (
              <p className="text-gray-400 mt-1">{result.brand}</p>
            )}
            <div className="flex gap-2 mt-2">
              <span className="inline-block px-3 py-1 bg-gray-900 text-gray-400 text-xs border border-gray-800">
                {result.category}
              </span>
              {isCached && (
                <span className="inline-block px-3 py-1 bg-green-950 text-green-600 text-xs border border-green-900">
                  CACHED
                </span>
              )}
              {shareHash && (
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-900 text-green-400 text-xs border border-green-700 hover:bg-green-800 transition-colors"
                  title="Share this analysis"
                >
                  {shareStatus === 'COPIED' ? '✓ COPIED' : shareStatus === 'FAILED' ? '✗ FAILED' : '↗ SHARE'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-900 border border-gray-800 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Summary */}
        <p className="text-gray-300 mt-4 leading-relaxed text-sm">
          {result.summary}
        </p>
      </div>

      {/* Overall Rating - Large Display */}
      <div className="border border-gray-800 bg-gray-950 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">OVERALL RATING</h3>
        <ScoreDisplay
          score={result.overall_rating}
          label="Overall Health Score"
          subtitle="Combined health and safety assessment"
        />
      </div>

      {/* Detailed Scores */}
      <div className="border border-gray-800 bg-gray-950 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">DETAILED SCORES</h3>
        <div className="space-y-3">
          <ScoreDisplay
            score={result.health_score}
            label="Health Impact"
            subtitle="Nutritional value and beneficial ingredients"
          />
          <ScoreDisplay
            score={result.toxicity_score}
            label="Toxicity Level"
            subtitle="Harmful chemicals and safety concerns"
          />
        </div>
      </div>

      {/* Concerns */}
      {result.concerns && result.concerns.length > 0 && (
        <div className="border border-gray-800 bg-gray-950 p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">
            CONCERNS ({result.concerns.length})
          </h3>
          <div className="space-y-3">
            {result.concerns.map((concern, index) => (
              <div
                key={index}
                className="border-l-2 border-red-900 pl-4 py-2"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">
                    {concern.ingredient || 'General'}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 border ${
                      concern.severity === 'high' ? 'border-red-700 text-red-400' :
                      concern.severity === 'moderate' ? 'border-yellow-700 text-yellow-400' :
                      'border-gray-700 text-gray-400'
                    }`}
                  >
                    {concern.severity}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">{concern.description}</p>
                <p className="text-gray-600 text-xs mt-1 capitalize">
                  {concern.type.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive Aspects */}
      {result.positive_aspects && result.positive_aspects.length > 0 && (
        <div className="border border-gray-800 bg-gray-950 p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">
            POSITIVE ASPECTS
          </h3>
          <div className="space-y-2">
            {result.positive_aspects.map((aspect, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <p className="text-gray-300">{aspect.description}</p>
                  {aspect.ingredient && (
                    <p className="text-gray-600 text-xs">
                      {aspect.ingredient}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div className="border border-gray-800 bg-gray-950 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">
          INGREDIENTS ({result.ingredients.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {result.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs border-b border-gray-900 pb-2 last:border-0"
            >
              <span className="text-gray-600 font-mono">{index + 1}.</span>
              <div className="flex-1">
                <span className="text-gray-300">{ingredient.name}</span>
                {ingredient.purpose && (
                  <span className="text-gray-600 ml-2">({ingredient.purpose})</span>
                )}
                {ingredient.concerns && ingredient.concerns.length > 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    {ingredient.concerns.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border border-yellow-900 bg-yellow-950/30 p-4 text-xs text-yellow-600">
        <p className="mb-1">DISCLAIMER</p>
        <p className="text-yellow-700">
          This analysis is for informational purposes only and is not a substitute
          for medical or professional advice. Always check with a healthcare
          provider for health concerns.
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={onReset}
        className="w-full py-3 bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700 hover:text-white transition-colors"
      >
        SCAN ANOTHER
      </button>
    </div>
  )
}
