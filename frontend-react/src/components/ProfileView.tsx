import { Award, Flame, Star, Target, Trophy } from 'lucide-react'

import { useProgressSummary } from '@/hooks/useApi'

export default function ProfileView() {
  const { data: progress, isPending } = useProgressSummary()

  if (isPending || !progress) {
    return <div className="py-16 text-center text-slate-500">Loading profile…</div>
  }

  const completed = progress.completed_count
  const total = progress.total_articles || 1
  const pct = Math.round((completed / total) * 100)
  const weeklyPct = Math.min(1, progress.weekly_xp / Math.max(1, progress.weekly_xp_goal))
  const initial = (progress.display_name || '?').trim().charAt(0).toUpperCase()

  const stats = [
    { icon: Flame, value: progress.current_streak, label: 'Day streak', accent: 'text-orange-500' },
    { icon: Star, value: progress.total_xp, label: 'Total XP', accent: 'text-yellow-400' },
    { icon: Award, value: `${completed}/${total}`, label: 'Articles learned', accent: 'text-crimson-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-royal-600/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-600 to-royal-700 text-2xl font-black font-display text-white shadow-lg shrink-0" aria-hidden="true">
            {initial}
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold font-display truncate">{progress.display_name}</h2>
            <p className="text-sm text-slate-400">
              {progress.longest_streak > 0 ? `Best streak: ${progress.longest_streak} day${progress.longest_streak === 1 ? '' : 's'}` : 'Your विधान Bidhan journey starts here'}
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-2 sm:gap-4 mt-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.accent} ${s.accent === 'text-orange-500' || s.accent === 'text-yellow-400' ? 'fill-current' : ''}`} />
              <div className="font-bold text-xl sm:text-2xl">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative mt-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target className="w-4 h-4 text-royal-300" /> Weekly quest
            </span>
            <span className="text-slate-400">{progress.weekly_xp}/{progress.weekly_xp_goal} XP</span>
          </div>
          <div
            className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress.weekly_xp}
            aria-valuemin={0}
            aria-valuemax={progress.weekly_xp_goal}
          >
            <div
              className="bg-gradient-to-r from-royal-500 to-crimson-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(weeklyPct * 100)}%` }}
            />
          </div>
        </div>

        <div className="relative mt-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Trophy className="w-4 h-4 text-yellow-400" /> Constitution progress
            </span>
            <span className="text-slate-400">{pct}% complete</span>
          </div>
          <div
            className="w-full bg-slate-800 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="bg-gradient-to-r from-crimson-600 to-crimson-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {progress.unlocked_count > 0
              ? `${progress.unlocked_count} lesson${progress.unlocked_count === 1 ? '' : 's'} unlocked and ready.`
              : 'Complete lessons to unlock more of the Constitution.'}
          </p>
        </div>
      </div>
    </div>
  )
}
