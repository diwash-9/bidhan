import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { getLastArticle, getReadClauses } from '@/lib/readProgress'
import { useArticle } from '@/hooks/useApi'

export default function SmartResume() {
  const lastId = getLastArticle()
  const { data: lastArticle } = useArticle(lastId)
  const readClauses = lastArticle ? getReadClauses(lastArticle.id) : []
  
  if (!lastArticle || readClauses.length === 0) return null

  const nextClauseIndex = readClauses.length < lastArticle.clauses.length
    ? lastArticle.clauses.findIndex(c => !readClauses.includes(c.id))
    : -1

  return (
    <Link
      to={`/read/${lastArticle.id}${nextClauseIndex >= 0 ? `#clause-${nextClauseIndex + 1}` : ''}`}
      className="group flex items-center gap-4 rounded-2xl border border-royal-700/50 bg-royal-950/30 p-4 shadow-lg transition hover:border-royal-600 hover:bg-royal-950/50"
      aria-label={`Continue reading ${lastArticle.title} from clause ${nextClauseIndex >= 0 ? nextClauseIndex + 1 : 'end'}`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-crimson-500/20 flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-crimson-400" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-royal-300">Continue reading</p>
        <p className="mt-0.5 font-bold text-white truncate">{lastArticle.title}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            Article {lastArticle.article_number}
          </span>
          {nextClauseIndex >= 0 && (
            <span className="flex items-center gap-1 text-crimson-300">
              Clause {nextClauseIndex + 1} of {lastArticle.clauses.length}
            </span>
          )}
        </p>
      </div>
      <ArrowRight className="flex-shrink-0 w-6 h-6 text-royal-400 group-hover:text-white transition" aria-hidden="true" />
    </Link>
  )
}