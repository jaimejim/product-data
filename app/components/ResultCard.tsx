'use client'

import { AnalysisData, getSeverityColor } from '@/lib/types'
import ScoreDisplay from './ScoreDisplay'

interface ResultCardProps {
  result: AnalysisData
  isCached?: boolean
  onReset: () => void
}

export default function ResultCard({ result, isCached, onReset }: ResultCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {result.product_name || 'Product Analysis'}
            </h2>
            {result.brand && (
              <p className="text-gray-600 mt-1">by {result.brand}</p>
            )}
            <div className="flex gap-2 mt-2">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                {result.category}
              </span>
              {isCached && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  ⚡ Instant (Cached)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Summary */}
        <p className="text-gray-700 mt-4 leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* Overall Rating - Large Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
        <ScoreDisplay
          score={result.overall_rating}
          label="Overall Health Score"
          subtitle="Combined health and safety assessment"
        />
      </div>

      {/* Detailed Scores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Scores</h3>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚠️ Concerns ({result.concerns.length})
          </h3>
          <div className="space-y-3">
            {result.concerns.map((concern, index) => (
              <div
                key={index}
                className="border-l-4 border-gray-200 pl-4 py-2"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {concern.ingredient || 'General'}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(
                      concern.severity
                    )}`}
                  >
                    {concern.severity}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{concern.description}</p>
                <p className="text-gray-500 text-xs mt-1 capitalize">
                  Type: {concern.type.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive Aspects */}
      {result.positive_aspects && result.positive_aspects.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✨ Positive Aspects
          </h3>
          <div className="space-y-2">
            {result.positive_aspects.map((aspect, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <p className="text-gray-700">{aspect.description}</p>
                  {aspect.ingredient && (
                    <p className="text-gray-500 text-xs">
                      Ingredient: {aspect.ingredient}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ingredients ({result.ingredients.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {result.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2 last:border-0"
            >
              <span className="text-gray-400 font-mono">{index + 1}.</span>
              <div className="flex-1">
                <span className="text-gray-900 font-medium">{ingredient.name}</span>
                {ingredient.purpose && (
                  <span className="text-gray-500 ml-2">({ingredient.purpose})</span>
                )}
                {ingredient.concerns && ingredient.concerns.length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ {ingredient.concerns.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-1">⚠️ Disclaimer</p>
        <p>
          This analysis is for informational purposes only and is not a substitute
          for medical or professional advice. Always check with a healthcare
          provider for health concerns. Analysis is based on listed ingredients only.
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={onReset}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Analyze Another Product
      </button>
    </div>
  )
}
