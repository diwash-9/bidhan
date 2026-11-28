import { useState } from 'react'

interface ProgressRingProps {
  readCount: number
  total: number
  size?: number
  strokeWidth?: number
  showPercentage?: boolean
  onClick?: () => void
}

export default function ProgressRing({
  readCount,
  total,
  size = 56,
  strokeWidth = 6,
  showPercentage = true,
  onClick,
}: ProgressRingProps) {
  const [expanded, setExpanded] = useState(false)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? readCount / total : 0
  const offset = circumference * (1 - progress)
  const percentage = Math.round(progress * 100)

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`Reading progress: ${readCount} of ${total} clauses (${percentage}%)`}>
      <svg width={size} height={size} className="transform -rotate-90" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick ? () => setExpanded(!expanded) : undefined}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{ filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.4))' }}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>

      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-bold text-white">{percentage}%</span>
        </div>
      )}

      {expanded && onClick && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl min-w-[200px]">
            <p className="text-xs font-semibold text-slate-400 mb-2">Click clause to jump</p>
            <div className="flex flex-wrap gap-1.5">
              {/* Clause chips rendered by parent via onClick callback */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}