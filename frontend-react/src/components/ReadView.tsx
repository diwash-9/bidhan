import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, CheckCircle2, Clock3, Search, Shuffle, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAllArticles } from '@/hooks/useApi'
import { getFinishedArticles, getLastArticle, getSavedArticles } from '@/lib/readProgress'
import { useAuthStore } from '@/store/auth'
import type { CatalogArticle } from '@/types'

export default function ReadView() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const homeTo = user ? '/' : '/auth'
  const { data: articles = [], isLoading, isError } = useAllArticles()
  const [query, setQuery] = useState('')
  const [partNumber, setPartNumber] = useState<number | 'all'>('all')
  const [scope, setScope] = useState<'all' | 'saved' | 'finished'>('all')

  const savedIds = useMemo(() => getSavedArticles(), [])
  const finishedIds = useMemo(() => getFinishedArticles(), [])
  const lastId = useMemo(() => getLastArticle(), [])
  const savedArticles = useMemo(() => articles.filter((article) => savedIds.includes(article.id)), [articles, savedIds])
  const finishedArticles = useMemo(() => articles.filter((article) => finishedIds.includes(article.id)), [articles, finishedIds])
  const lastArticle = useMemo(() => articles.find((article) => article.id === lastId), [articles, lastId])

  const parts = useMemo(() => {
    const titles = new Map<number, string>()
    for (const article of articles) titles.set(article.part_number, article.part_title)
    return [...titles.entries()].sort(([a], [b]) => a - b)
  }, [articles])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = articles.filter((article) => {
      if (partNumber !== 'all' && article.part_number !== partNumber) return false
      if (scope === 'saved' && !savedIds.includes(article.id)) return false
      if (scope === 'finished' && !finishedIds.includes(article.id)) return false
      if (!term) return true
      return (
        article.id.toLowerCase().includes(term) ||
        `article ${article.article_number}`.includes(term) ||
        article.title.toLowerCase().includes(term) ||
        article.part_title.toLowerCase().includes(term) ||
        `part ${article.part_number}`.includes(term)
      )
    })

    const byPart = new Map<number, { title: string; items: CatalogArticle[] }>()
    for (const article of filtered) {
      const group = byPart.get(article.part_number) ?? { title: article.part_title, items: [] }
      group.items.push(article)
      byPart.set(article.part_number, group)
    }
    return [...byPart.entries()].sort(([a], [b]) => a - b)
  }, [articles, query, partNumber, scope, savedIds, finishedIds])

  const shown = groups.reduce((total, [, group]) => total + group.items.length, 0)

  const surpriseMe = () => {
    const article = articles[Math.floor(Math.random() * articles.length)]
    if (article) navigate(`/read/${article.id}`)
  }

  const articleCard = (article: CatalogArticle, label: string) => (
    <Link
      key={article.id}
      to={`/read/${article.id}`}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-royal-700 hover:bg-slate-800/60"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-crimson-400">{label}</p>
          {finishedIds.includes(article.id) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Finished
            </span>
          )}
          {savedIds.includes(article.id) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-700/50 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
              <Bookmark className="h-3 w-3 fill-yellow-400" aria-hidden="true" /> Saved
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-200 group-hover:text-white">{article.title}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-royal-300" aria-hidden="true" />
    </Link>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
        <Link
          to={homeTo}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {user ? 'Back to Path' : 'Back to home'}
        </Link>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal-300">
          <BookOpen className="h-4 w-4" /> Study mode
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Read the Constitution, your way</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Every article is open here — no account, no unlocks, no quizzes, no hearts. Pick any article,
          tick off clauses as you read, listen along, and make it your own.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search articles</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by article, title, or part…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-royal-600 focus:outline-none"
            />
          </label>
          <select
            value={partNumber}
            onChange={(event) => setPartNumber(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            aria-label="Filter by part"
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-royal-600 focus:outline-none"
          >
            <option value="all">All parts</option>
            {parts.map(([number, title]) => (
              <option key={number} value={number}>
                Part {number} · {title}
              </option>
            ))}
          </select>
          <button
            onClick={surpriseMe}
            disabled={articles.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-crimson-800 bg-crimson-950/40 px-4 py-2.5 text-sm font-semibold text-crimson-200 transition hover:bg-crimson-900/50 disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" /> Surprise me
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter library">
          {([
            ['all', 'All articles', articles.length],
            ['saved', 'Saved', savedIds.length],
            ['finished', 'Finished', finishedIds.length],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              aria-pressed={scope === value}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                scope === value
                  ? 'border-royal-600 bg-royal-700/30 text-white'
                  : 'border-slate-800 text-slate-400 hover:border-royal-700 hover:text-white'
              }`}
            >
              {label} <span className="ml-1 text-[10px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500" aria-live="polite">
          {isLoading ? 'Loading library…' : `${shown} of ${articles.length} articles shown`}
          {!isLoading && (finishedIds.length > 0 || savedIds.length > 0) && (
            <span className="ml-2">
              · {finishedIds.length} finished and {savedIds.length} bookmarked on this device
            </span>
          )}
        </p>
      </section>

      {isError && (
        <div role="alert" className="rounded-2xl border border-crimson-500/30 bg-crimson-500/10 p-4 text-sm text-crimson-200">
          Could not load the article library. Please try again.
        </div>
      )}

      {scope === 'all' && (
        <>
          {lastArticle && (
            <section aria-labelledby="continue-heading">
              <h2 id="continue-heading" className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                <Clock3 className="h-4 w-4 text-royal-300" /> Continue reading
              </h2>
              {articleCard(lastArticle, `Article ${lastArticle.article_number} · Part ${lastArticle.part_number}`)}
            </section>
          )}

          {savedArticles.length > 0 && (
            <section aria-labelledby="saved-heading">
              <h2 id="saved-heading" className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                <Bookmark className="h-4 w-4 text-yellow-400" /> Saved for later
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {savedArticles.map((article) => articleCard(article, `Article ${article.article_number}`))}
              </div>
            </section>
          )}

          {finishedArticles.length > 0 && (
            <section aria-labelledby="finished-heading">
              <h2 id="finished-heading" className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Finished articles
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {finishedArticles.map((article) => articleCard(article, `Article ${article.article_number}`))}
              </div>
            </section>
          )}
        </>
      )}

      {groups.map(([number, group]) => (
        <section key={number} aria-labelledby={`study-part-${number}`}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id={`study-part-${number}`} className="font-display text-lg font-bold">
              Part {number} <span className="font-sans text-sm font-normal text-slate-400">· {group.title}</span>
            </h2>
            <span className="text-xs text-slate-500">{group.items.length} articles</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((article) => articleCard(article, `Article ${article.article_number}`))}
          </div>
        </section>
      ))}

      {!isLoading && !isError && shown === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
          {scope === 'saved'
            ? 'No saved articles yet. Bookmark one from the reader to find it here.'
            : scope === 'finished'
              ? 'No finished articles yet. Tick every clause in an article to complete it.'
              : 'No articles match that search. Try another title or article number.'}
        </div>
      )}

      <p className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-royal-300" />
        Want to earn XP and unlock the path? <Link to="/auth" className="font-semibold text-royal-300 hover:text-white">Sign in to play</Link>
      </p>
    </div>
  )
}
