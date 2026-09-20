import { useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Star,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useArticles, useParts, useUserProgress } from '@/hooks/useApi'
import type { ArticleProgress, ArticleStatus } from '@/types'

const ITEM_H = 120
const TRACK_W = 320
const NODE_D = 62
const COL_X = [76, 244] as const
const colX = (i: number): number => (i % 2 === 0 ? COL_X[0] : COL_X[1])

function daysUntilWeekEnd(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay() || 7
  const nextMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (8 - day))
  return Math.max(1, Math.ceil((nextMonday.getTime() - Date.now()) / 86_400_000))
}

export default function PathView() {
  const { data: parts } = useParts()
  const { data: progress } = useUserProgress()
  const [selectedPart, setSelectedPart] = useState<number>(1)
  const { data: articles } = useArticles(selectedPart)

  const progressById = useMemo(() => {
    const map = new Map<string, ArticleProgress>()
    for (const a of progress?.articles ?? []) map.set(a.article_id, a)
    return map
  }, [progress])

  const selected =
    (parts ?? []).find((p) => p.part_number === selectedPart) ??
    (parts ?? [])[0]

  const rows = articles ?? []
  const lastCompletedIdx = useMemo(() => {
    let idx = 0
    for (let i = 0; i < rows.length; i++) {
      const art = rows[i]
      if (art && progressById.get(art.id)?.status === 'completed') idx = i + 1
    }
    return idx
  }, [rows, progressById])

  const weeklyXp = progress?.weekly_xp ?? 0
  const weeklyGoal = progress?.weekly_xp_goal ?? 100
  const weeklyPct = Math.min(1, weeklyXp / Math.max(1, weeklyGoal))
  const weeklyDone = weeklyXp >= weeklyGoal

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
        <div className="mb-8 bg-slate-900 border border-royal-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="flex items-center gap-2 text-sm font-bold text-yellow-300">
              <Trophy className="w-5 h-5 fill-yellow-300" /> Weekly Quest
            </span>
            <span className="text-sm font-bold text-slate-200">
              {weeklyXp}/{weeklyGoal} XP
            </span>
          </div>
          <div
            className="h-2 rounded-full bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={weeklyXp}
            aria-valuemin={0}
            aria-valuemax={weeklyGoal}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-crimson-600 to-royal-500 transition-all duration-500"
              style={{ width: `${Math.round(weeklyPct * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {weeklyDone
              ? 'Quest complete — keep going for more!'
              : 'Earn XP by completing and practising lessons. Ends in '}
            {!weeklyDone && <span className="font-bold text-royal-300">{daysUntilWeekEnd()}</span>}
            {!weeklyDone && ' days.'}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-orange-400 text-orange-400" /> {progress?.current_streak ?? 0} day streak
          </p>
        </div>

        <div className="relative mx-auto" style={{ width: TRACK_W, height: rows.length * ITEM_H }}>
          <svg
            aria-hidden="true"
            className="absolute top-0 left-0 pointer-events-none"
            width={TRACK_W}
            height={rows.length * ITEM_H}
          >
            {rows.slice(0, -1).map((art, i) => {
              const x0 = colX(i)
              const y0 = i * ITEM_H + ITEM_H / 2
              const x1 = colX(i + 1)
              const y1 = (i + 1) * ITEM_H + ITEM_H / 2
              const status = progressById.get(art.id)?.status ?? 'locked'
              const color =
                status === 'completed' ? '#dc143c' : status === 'unlocked' ? '#3d6ef6' : '#1e293b'
              return <line key={art.id} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={14} strokeLinecap="round" />
            })}
          </svg>

          {rows.map((art, i) => {
            const x = colX(i)
            const y = i * ITEM_H + ITEM_H / 2
            const row = progressById.get(art.id)
            const status: ArticleStatus = row?.status ?? 'locked'
            const isCompleted = status === 'completed'
            const isCurrent = status === 'unlocked' && i === lastCompletedIdx
            const isAvailable = status === 'unlocked' && !isCurrent
            const locked = status === 'locked'
            const isStart = isCurrent && !isCompleted

            const icon = isCompleted ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : isAvailable ? (
              <BookOpen className="w-6 h-6" />
            ) : isStart ? (
              <Play className="w-6 h-6 fill-current" />
            ) : (
              <Lock className="w-6 h-6" />
            )

            const circleCls = isCompleted
              ? 'bg-crimson-600 border-crimson-400 text-white shadow-lg shadow-crimson-900/40'
              : isStart
                ? 'bg-gradient-to-br from-royal-600 to-crimson-600 border-royal-300 text-white shadow-lg shadow-royal-900/50'
                : isAvailable
                  ? 'bg-royal-800 border-royal-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-500'

            const target = isCompleted ? `/lesson/${art.id}?practice=1` : `/lesson/${art.id}`

            const box = (
              <div
                className={`absolute flex items-center justify-center rounded-full border-4 ${circleCls} ${
                  locked ? 'cursor-not-allowed' : 'transition hover:scale-110'
                }`}
                style={{ left: x - NODE_D / 2, top: y - NODE_D / 2, width: NODE_D, height: NODE_D }}
              >
                {icon}
                {isStart && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-crimson-600 border border-crimson-400 text-white text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full shadow animate-bounce">
                    START
                  </span>
                )}
                {isCompleted && row && row.stars > 0 && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 bg-slate-950 border border-slate-700 rounded-full px-1.5 py-0.5">
                    {Array.from({ length: row.stars }, (_, s) => (
                      <Star key={s} className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
                    ))}
                  </span>
                )}
              </div>
            )

            return (
              <div key={art.id} className="absolute" style={{ left: 0, top: 0 }}>
                {isStart && (
                  <span
                    aria-hidden="true"
                    className="absolute rounded-full bg-royal-500/30 animate-ping"
                    style={{ left: x - NODE_D, top: y - NODE_D, width: NODE_D * 2, height: NODE_D * 2 }}
                  />
                )}
                {locked ? (
                  box
                ) : (
                  <Link to={target} aria-label={`${art.title} - ${isCompleted ? 'practice (completed)' : 'start lesson'}`}>
                    {box}
                  </Link>
                )}
                <div className="absolute text-center" style={{ left: x - 76, width: 152, top: y + NODE_D / 2 + 12 }}>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isCompleted ? 'text-crimson-400' : isStart || isAvailable ? 'text-royal-300' : 'text-slate-600'
                    }`}
                  >
                    Article {art.article_number}
                  </span>
                  <p
                    className={`text-xs leading-snug mt-0.5 line-clamp-2 ${
                      locked ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {art.title}
                  </p>
                  {isCompleted && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-royal-300 bg-royal-900/40 border border-royal-800 rounded-full px-2 py-0.5">
                      <RotateCcw className="w-2.5 h-2.5" /> Practice
                    </span>
                  )}
                </div>
                {locked && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-slate-600"
                    style={{ left: x + NODE_D / 2 + 16, width: 10 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
