import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAllArticles } from '@/hooks/useApi'
import type { CatalogArticle } from '@/types'

export default function ReadView() {
  const { data: articles = [], isLoading, isError } = useAllArticles()
  const [query, setQuery] = useState('')
  const [partNumber, setPartNumber] = useState<number | 'all'>('all')

  const parts = useMemo(() => {
    const titles = new Map<number, string>()
    for (const article of articles) titles.set(article.part_number, article.part_title)
    return [...titles.entries()].sort(([a], [b]) => a - b)
  }, [articles])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = articles.filter((article) => {
      if (partNumber !== 'all' && article.part_number !== partNumber) return false
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
  }, [articles, query, partNumber])

  const shown = groups.reduce((total, [, group]) => total + group.items.length, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal-300">
          <BookOpen className="w-4 h-4" /> Study mode
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mt-2">Read the Constitution, your way</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Every article is open here, with no unlocks, quizzes, hearts, or XP. Pick any article you like —
          your game progress stays exactly as it is.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <label className="relative flex-1">
            <span className="sr-only">Search articles</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by article, title, or part…"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-royal-600"
            />
          </label>
          <select
            value={partNumber}
            onChange={(event) => setPartNumber(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            aria-label="Filter by part"
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-royal-600"
          >
            <option value="all">All parts</option>
            {parts.map(([number, title]) => (
              <option key={number} value={number}>
                Part {number} · {title}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 mt-3" aria-live="polite">
          {isLoading ? 'Loading library…' : `${shown} of ${articles.length} articles shown`}
        </p>
      </section>

      {isError && (
        <div role="alert" className="bg-crimson-500/10 border border-crimson-500/30 rounded-2xl p-4 text-sm text-crimson-200">
          Could not load the article library. Please try again.
        </div>
      )}

      {groups.map(([number, group]) => (
        <section key={number} aria-labelledby={`study-part-${number}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
            <h2 id={`study-part-${number}`} className="font-display font-bold text-lg">
              Part {number} <span className="font-sans text-sm font-normal text-slate-400">· {group.title}</span>
            </h2>
            <span className="text-xs text-slate-500">{group.items.length} articles</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((article) => (
              <Link
                key={article.id}
                to={`/read/${article.id}`}
                className="group flex items-start justify-between gap-3 bg-slate-900 border border-slate-800 hover:border-royal-700 hover:bg-slate-800/60 rounded-2xl p-4 transition"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-crimson-400">Article {article.article_number}</p>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-white mt-0.5 line-clamp-2">{article.title}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-royal-300 shrink-0 mt-1 transition" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ))}

      {!isLoading && !isError && shown === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
          No articles match that search. Try another title or article number.
        </div>
      )}

      <p className="text-center text-xs text-slate-500 pb-4">
        Prefer to earn XP and unlock the path? <Link to="/" className="text-royal-300 hover:text-white font-semibold">Go to Game mode</Link>
      </p>
    </div>
  )
}
