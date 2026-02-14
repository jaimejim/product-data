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

  // Dieter Rams minimalist design - subtle but meaningful color
  // Use muted tones that communicate quality without overwhelming
  const getColorScheme = () => {
    const effectiveScore = inverse ? 10 - score : score // Invert for additives

    if (effectiveScore >= 7) {
      // Good: subtle green tints
      return {
        bar: 'bg-green-700',
        border: 'border-green-900',
        text: 'text-green-500',
        bg: 'bg-green-950/20'
      }
    } else if (effectiveScore >= 4) {
      // Moderate: subtle amber/yellow tints
      return {
        bar: 'bg-amber-600',
        border: 'border-amber-900',
        text: 'text-amber-500',
        bg: 'bg-amber-950/20'
      }
    } else {
      // Poor: subtle red tints
      return {
        bar: 'bg-red-700',
        border: 'border-red-900',
        text: 'text-red-500',
        bg: 'bg-red-950/20'
      }
    }
  }

  const colors = getColorScheme()

  return (
    <div className={`border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-white tracking-wide">{label}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        <div className="flex items-baseline gap-1 ml-4">
          <div className={`text-4xl font-light tabular-nums ${colors.text}`}>
            {score}
          </div>
          <div className="text-sm text-gray-600">/10</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-900 overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-700 ease-out`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <div className={`text-xs uppercase tracking-wider min-w-[4rem] text-right ${colors.text}`}>
          {scoreLabel}
        </div>
      </div>
    </div>
  )
}
