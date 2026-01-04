'use client'

import { getScoreColor, getScoreLabel } from '@/lib/types'

interface ScoreDisplayProps {
  score: number
  label: string
  subtitle?: string
}

export default function ScoreDisplay({ score, label, subtitle }: ScoreDisplayProps) {
  const color = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  }

  const bgColorClasses = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
  }

  const textColorClasses = {
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${bgColorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-gray-900">{label}</div>
          {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-3xl font-bold ${textColorClasses[color]}`}>
            {score}
          </div>
          <div className="text-gray-400 text-xl">/10</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color]} transition-all duration-500`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <div className={`text-xs font-semibold ${textColorClasses[color]}`}>
          {scoreLabel}
        </div>
      </div>
    </div>
  )
}
