import { Crown, Flame, Star } from 'lucide-react'

import { useLeaderboard } from '@/hooks/useApi'

export default function LeaderboardView() {
  const { data: rows, isPending } = useLeaderboard()

  if (isPending || !rows) {
    return <div className="py-16 text-center text-slate-500">Loading leaderboard…</div>
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-400" /> Leaderboard
      </h2>
      <p className="text-sm text-slate-400 mb-6">Top learners this week</p>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.user_id}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3 border ${
              r.rank === 1
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : r.rank <= 3
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="w-8 text-center font-bold text-slate-400">#{r.rank}</span>
            <span className="flex-1 font-semibold text-slate-200 truncate">{r.display_name}</span>
            <span className="flex items-center gap-1 text-sm text-orange-400">
              <Flame className="w-4 h-4 fill-orange-400" /> {r.current_streak}
            </span>
            <span className="flex items-center gap-1 font-bold text-yellow-300">
              <Star className="w-4 h-4 fill-yellow-300" /> {r.total_xp}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}