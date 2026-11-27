import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { useAllArticles, useArticle } from '@/hooks/useApi'

export default function ReadArticleView() {
  const { articleId = '' } = useParams()
  const { data: article, isLoading, isError } = useArticle(articleId)
  const { data: articles = [] } = useAllArticles()

  const index = articles.findIndex((item) => item.id === articleId)
  const previous = index > 0 ? articles[index - 1] : undefined
  const next = index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500">Loading article…</div>
  }

  if (isError || !article) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto text-center">
        <p className="font-semibold text-slate-200">Article not found.</p>
        <p className="text-sm text-slate-400 mt-2">This article may not be in the library.</p>
        <Link to="/read" className="mt-5 block w-full bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-xl transition">
          Back to Study library
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
      <Link to="/read" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-semibold transition">
        <ArrowLeft className="w-4 h-4" /> Study library
      </Link>

      <header className="mb-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal-300">
          <BookOpen className="w-4 h-4" /> Part {article.part_number} · {article.part_title}
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mt-3">{article.title}</h1>
        <p className="text-xs text-slate-500 mt-2">
          Article {article.article_number} <span className="mx-2 text-slate-700">·</span> {article.id}
        </p>
      </header>

      <article className="space-y-6 font-display text-slate-200">
        {article.clauses.length === 0 && (
          <p className="text-sm text-slate-500">No clause text is available for this article yet.</p>
        )}
        {article.clauses.map((clause) => (
          <section key={clause.id} className="flex gap-3 sm:gap-4">
            <span className="shrink-0 font-sans text-sm font-bold text-royal-400 pt-1">({clause.clause_number})</span>
            <div className="min-w-0">
              <p className="text-base sm:text-lg leading-8 break-words">{clause.content}</p>
              {clause.sub_clauses.length > 0 && (
                <div className="mt-3 space-y-2 border-l border-slate-700 pl-4">
                  {clause.sub_clauses.map((sub) => (
                    <p key={sub.identifier} className="text-sm sm:text-base leading-7 text-slate-300 break-words">
                      <span className="font-sans font-bold text-royal-300 mr-2">({sub.identifier})</span>
                      {sub.content}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </article>

      <nav aria-label="Article navigation" className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        {previous ? (
          <Link
            to={`/read/${previous.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" /> Article {previous.article_number}: {previous.title}
          </Link>
        ) : (
          <span className="text-sm text-slate-600">First article</span>
        )}
        {next ? (
          <Link
            to={`/read/${next.id}`}
            className="flex items-center justify-end gap-2 text-sm font-semibold text-royal-300 hover:text-white transition text-right"
          >
            Article {next.article_number}: {next.title} <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        ) : (
          <span className="text-sm text-slate-600">Last article</span>
        )}
      </nav>

      <p className="mt-8 text-center text-xs text-slate-500">
        Reading here never spends hearts or changes XP.{' '}
        <Link to="/" className="text-royal-300 hover:text-white font-semibold">Go to Game mode</Link> to keep playing.
      </p>
    </div>
  )
}
