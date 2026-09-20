import { useMemo, useState } from 'react'
import { BookOpen, CheckCircle, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useArticles, useParts, useUserProgress } from '@/hooks/useApi'
import type { ArticleStatus } from '@/types'

export default function PathView() {
  const { data: parts } = useParts()
  const { data: progress } = useUserProgress()
  const [selectedPart, setSelectedPart] = useState<number>(1)
  const { data: articles } = useArticles(selectedPart)

  const statusById = useMemo(() => {
    const map = new Map<string, ArticleStatus>()
    for (const a of progress?.articles ?? []) map.set(a.article_id, a.status)
    return map
  }, [progress])

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {(parts ?? []).map((p) => (
          <button
            key={p.part_number}
            onClick={() => setSelectedPart(p.part_number)}
            className={`px-4 py-2.5 rounded-2xl whitespace-nowrap font-semibold text-sm transition border ${
              selectedPart === p.part_number
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Part {p.part_number}: {p.part_title}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6 py-6">
        {(articles ?? []).map((art, idx) => {
          const status = statusById.get(art.id) ?? 'locked'
          const isCompleted = status === 'completed'
          const isUnlocked = status !== 'locked'
          const offsets = ['translate-x-0', 'translate-x-8', '-translate-x-8', 'translate-x-4', '-translate-x-4']
          const offsetClass = offsets[idx % offsets.length] ?? ''

          return (
            <div key={art.id} className={`flex flex-col items-center ${offsetClass} transition-all`}>
              <Link
                to={`/lesson/${art.id}`}
                onClick={(e) => { if (!isUnlocked) e.preventDefault() }}
                aria-label={`Article ${art.article_number}: ${art.title} - ${isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'}`}
                className={`relative group w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-xl ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 hover:scale-105'
                    : isUnlocked
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/30 hover:scale-105 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                ) : isUnlocked ? (
                  <BookOpen className="w-7 h-7" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}

                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10 w-48">
                  <div className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-2 text-center shadow-lg">
                    <span className="font-bold text-emerald-400">Article {art.article_number}</span>
                    <p className="truncate">{art.title}</p>
                  </div>
                </div>
              </Link>
              <span className="mt-2 text-xs font-semibold text-slate-400 text-center max-w-[120px] truncate">
                Art {art.article_number}: {art.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}