import { useMemo, useState } from 'react'
import { BookOpen, CheckCircle, ChevronRight, Lock } from 'lucide-react'
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

  const selected =
    (parts ?? []).find((p) => p.part_number === selectedPart) ??
    (parts ?? [])[0]

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <aside className="w-full lg:w-64 lg:sticky lg:top-24 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          {selected?.part_title ?? 'Constitution'}
        </h2>
        <nav
          aria-label="Constitution parts"
          className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none"
        >
          {(parts ?? []).map((p) => (
            <button
              key={p.part_number}
              onClick={() => setSelectedPart(p.part_number)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap font-semibold text-sm transition border text-left ${
                selectedPart === p.part_number
                  ? 'bg-crimson-600 border-crimson-500 text-white shadow-lg shadow-crimson-900/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-royal-900/60 hover:text-white'
              }`}
            >
              <span className={`font-bold ${selectedPart === p.part_number ? 'text-white' : 'text-royal-400'}`}>
                {p.part_number}
              </span>
              <span className="hidden sm:inline truncate">{p.part_title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1 w-full min-w-0">
        <div className="pb-8 pl-6 relative">
          <div aria-hidden="true" className="absolute left-[7px] top-1 bottom-8 w-0.5 bg-gradient-to-b from-crimson-500 via-royal-600 to-transparent" />
          {(articles ?? []).map((art) => {
            const status = statusById.get(art.id) ?? 'locked'
            const isCompleted = status === 'completed'
            const isUnlocked = status !== 'locked'

            const icon = isCompleted ? (
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            ) : isUnlocked ? (
              <BookOpen className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )

            const dotClass = isCompleted
              ? 'bg-crimson-600 text-white ring-4 ring-crimson-500/25'
              : isUnlocked
                ? 'bg-royal-600 text-white ring-4 ring-royal-500/25 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700'

            return (
              <div key={art.id} className="relative pb-9 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-0 w-[15px] h-[15px] rounded-full ${dotClass}`}
                >
                  {icon}
                </span>
                <div className="ml-6">
                  <Link
                    to={`/lesson/${art.id}`}
                    onClick={(e) => { if (!isUnlocked) e.preventDefault() }}
                    aria-label={`Article ${art.article_number}: ${art.title} - ${isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'}`}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 transition ${
                      isUnlocked
                        ? 'bg-slate-900 border-slate-800 hover:border-royal-600/60 hover:bg-royal-950/40 hover:shadow-xl'
                        : 'bg-slate-900/40 border-slate-800/60 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isCompleted ? 'text-crimson-400' : isUnlocked ? 'text-royal-300' : 'text-slate-500'
                          }`}
                        >
                          Article {art.article_number}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide ${
                            isCompleted
                              ? 'bg-crimson-500/15 text-crimson-300'
                              : isUnlocked
                                ? 'bg-royal-500/15 text-royal-300'
                                : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isCompleted ? 'Completed' : isUnlocked ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100 truncate leading-snug mt-1">
                        {art.title}
                      </h3>
                    </div>
                    {isUnlocked && (
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition shrink-0" />
                    )}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}