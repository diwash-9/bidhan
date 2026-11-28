import { Flame } from 'lucide-react'
import { useReadingStreak } from '@/hooks/useReadingStreak'

interface ReadingStreakBadgeProps {
  compact?: boolean
}

export default function ReadingStreakBadge({ compact = false }: ReadingStreakBadgeProps) {
  const { current, longest } = useReadingStreak()

  if (current === 0 && longest === 0) return null

  const showLongest = longest > current

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-full" title={`${current} day${current === 1 ? '' : 's'} reading streak`}>
        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
        <span className="font-bold text-sm text-orange-300">{current}</span>
        {showLongest && (
          <span className="text-[10px] text-slate-500">best: {longest}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl" role="status" aria-live="polite">
      <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
      <div>
        <p className="font-bold text-sm text-orange-300">
          {current} day{current === 1 ? '' : 's'} reading streak
        </p>
        {showLongest && (
          <p className="text-xs text-slate-500">Longest: {longest} day{longest === 1 ? '' : 's'}</p>
        )}
      </div>
    </div>
  )
}