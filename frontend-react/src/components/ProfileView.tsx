import { Award, Flame, Star } from 'lucide-react'

import { useUserProgress } from '@/hooks/useApi'

export default function ProfileView() {
  const { data: progress, isPending } = useUserProgress()

  if (isPending || !progress) {
    return <div className="py-16 text-center text-slate-500">Loading profile…</div>
  }

  const completed = progress.articles.filter((a) => a.status === 'completed').length
  const total = progress.articles.length

  return (
    <div>
      <div className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-4 sm:p-6 mb-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-1 font-display">{progress.display_name}</h2>
        <p className="text-sm text-slate-400 mb-6">Your विधान Bidhan journey</p>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <Flame className="w-6 h-6 mx-auto text-orange-500 fill-orange-500 mb-1" />
            <div className="font-bold text-2xl">{progress.current_streak}</div>
            <div className="text-xs text-slate-400">Day streak</div>
          </div>
          <div className="bg-slate-950/60 border border-royal-800 rounded-2xl p-4 text-center">
            <Star className="w-6 h-6 mx-auto text-yellow-400 fill-yellow-400 mb-1" />
            <div className="font-bold text-2xl">{progress.total_xp}</div>
            <div className="text-xs text-slate-400">Total XP</div>
          </div>
          <div className="bg-slate-950/60 border border-crimson-800 rounded-2xl p-4 text-center">
            <Award className="w-6 h-6 mx-auto text-crimson-400 mb-1" />
            <div className="font-bold text-2xl">
              {completed}/{total}
            </div>
            <div className="text-xs text-slate-400">Articles learned</div>
          </div>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-crimson-600 to-crimson-400 h-3 rounded-full transition-all"
            style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-right">{(total ? Math.round((completed / total) * 100) : 0)}% complete</p>
      </div>
    </div>
  )
}