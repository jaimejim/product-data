'use client'

import { getScoreColor, getScoreLabel } from '@/lib/types'

interface ScoreDisplayProps {
  score: number
  label: string
  subtitle?: string
  inverse?: boolean  // If true, higher score is worse (for Additives Score)
}

export default function ScoreDisplay({ score, label, subtitle, inverse = false }: ScoreDisplayProps) {
  const color = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  // Dieter Rams minimalist design - grayscale with subtle accents
  // Remove bright colors, use neutral tones
  const getBarColor = () => {
    if (inverse) {
      // For additives score: higher is worse
      if (score >= 7) return 'bg-gray-900' // High concern
      if (score >= 4) return 'bg-gray-700' // Moderate
      return 'bg-gray-400' // Low concern (good)
    } else {
      // For nutritional score: higher is better
      if (score >= 7) return 'bg-gray-900' // Good
      if (score >= 4) return 'bg-gray-700' // Moderate
      return 'bg-gray-400' // Poor
    }
  }

  return (
    <div className="border border-gray-800 bg-transparent p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-white tracking-wide">{label}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        <div className="flex items-baseline gap-1 ml-4">
          <div className="text-4xl font-light text-white tabular-nums">
            {score}
          </div>
          <div className="text-sm text-gray-600">/10</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-gray-900 overflow-hidden">
          <div
            className={`h-full ${getBarColor()} transition-all duration-700 ease-out`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wider min-w-[4rem] text-right">
          {scoreLabel}
        </div>
      </div>
    </div>
  )
}
