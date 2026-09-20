import { useState } from 'react'
import { Crown, Flame, Medal, Star, User } from 'lucide-react'

import { useLeaderboard } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth'

const MEDALS = ['text-yellow-300', 'text-slate-300', 'text-amber-600']

function daysUntilWeekEnd(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay() || 7
  const nextMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (8 - day))
  return Math.max(1, Math.ceil((nextMonday.getTime() - Date.now()) / 86_400_000))
}

export default function LeaderboardView() {
  const [window, setWindow] = useState<'all' | 'week'>('week')
  const userId = useAuthStore((s) => s.user?.id)
  const { data: rows, isPending } = useLeaderboard(20, window)

  if (isPending || !rows) {
    return <div className="py-16 text-center text-slate-500">Loading leaderboard…</div>
  }

  return (
    <div className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" /> Leaderboard
        </h2>
        <div className="flex bg-slate-800 rounded-full p-1 border border-slate-700" role="tablist" aria-label="Leaderboard window">
          {(['week', 'all'] as const).map((w) => (
            <button
              key={w}
              role="tab"
              aria-selected={window === w}
              onClick={() => setWindow(w)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                window === w ? 'bg-crimson-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {w === 'week' ? 'This Week' : 'All-Time'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        {window === 'week' ? (
          <>
            Top learners this week — ends in <span className="font-bold text-royal-300">{daysUntilWeekEnd()}</span> day{daysUntilWeekEnd() > 1 ? 's' : ''}.
          </>
        ) : (
          'Best all-time learners on विधान Bidhan.'
        )}
      </p>

      {rows.length === 0 && (
        <p className="py-10 text-center text-slate-500">No entries yet — complete a lesson to join the race!</p>
      )}

      <div className="space-y-2">
        {rows.map((r) => {
          const isYou = r.user_id === userId
          const podium = r.rank <= 3
          return (
            <div
              key={`${window}-${r.user_id}`}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 border ${
                isYou
                  ? 'bg-royal-900/40 border-royal-500/60 ring-1 ring-royal-500/40'
                  : podium
                    ? 'bg-gradient-to-r from-crimson-600/15 to-royal-900/15 border-crimson-500/30'
                    : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <span className={`w-9 text-center font-black ${MEDALS[r.rank - 1] ?? 'text-slate-400'}`}>
                {r.rank <= 3 ? <Medal className={`w-6 h-6 mx-auto ${MEDALS[r.rank - 1]}`} /> : `${r.rank}`}
              </span>
              <span className="flex-1 font-semibold text-slate-200 truncate flex items-center gap-2">
                {isYou && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-royal-600 text-white rounded-full px-2 py-0.5">
                    <User className="w-3 h-3" /> You
                  </span>
                )}
                {r.display_name}
              </span>
              <span className="flex items-center gap-1 text-sm text-orange-400" title="Day streak">
                <Flame className="w-4 h-4 fill-orange-400" /> {r.current_streak}
              </span>
              <span className="flex items-center gap-1 font-bold text-yellow-300" title={window === 'week' ? 'XP this week' : 'Total XP'}>
                <Star className="w-4 h-4 fill-yellow-300" /> {r.xp_earned}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}