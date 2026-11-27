import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Link2,
  Pause,
  Play,
  Sparkles,
  Star,
  Type,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Confetti from '@/components/Confetti'
import { useAllArticles, useArticle } from '@/hooks/useApi'
import { useReadAloud } from '@/hooks/useReadAloud'
import {
  getReadClauses,
  getReaderFont,
  getSavedArticles,
  markArticleFinished,
  setLastArticle,
  setReaderFont,
  toggleReadClause,
  toggleSavedArticle,
} from '@/lib/readProgress'
import type { ReaderFont } from '@/lib/readProgress'

const FONT_SIZES: Record<ReaderFont, { clause: string; sub: string }> = {
  small: { clause: 'text-sm leading-7', sub: 'text-xs leading-6' },
  normal: { clause: 'text-base leading-8 sm:text-lg', sub: 'text-sm leading-7' },
  large: { clause: 'text-xl leading-9 sm:text-2xl', sub: 'text-base leading-8' },
}

const RELATION_LABELS: Record<string, string> = {
  sequential: 'Next in sequence',
  cross_part: 'Cross-part link',
  text_reference: 'Referenced here',
}

export default function ReadArticleView() {
  const { articleId = '' } = useParams()
  const navigate = useNavigate()
  const { data: articleData, isLoading, isError } = useArticle(articleId)
  const { data: articles = [] } = useAllArticles()

  // React Query can briefly hold the previous article while a new id loads.
  const article = articleData?.id === articleId ? articleData : undefined

  const index = articles.findIndex((item) => item.id === articleId)
  const previous = index > 0 ? articles[index - 1] : undefined
  const next = index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined

  const [readClauses, setReadClauses] = useState<number[]>(() => getReadClauses(articleId))
  const [savedArticles, setSavedArticles] = useState<string[]>(() => getSavedArticles())
  const [font, setFont] = useState<ReaderFont>(() => getReaderFont())
  const [copied, setCopied] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const wasFinished = useRef(false)

  const total = article?.clauses.length ?? 0
  const readCount = useMemo(
    () => (article ? article.clauses.filter((clause) => readClauses.includes(clause.id)).length : 0),
    [article, readClauses],
  )
  const finished = total > 0 && readCount === total
  const isSaved = savedArticles.includes(articleId)

  const speechLines = useMemo(
    () =>
      article
        ? [
            `Article ${article.article_number}. ${article.title}.`,
            ...article.clauses.flatMap((clause) => [
              clause.content,
              ...clause.sub_clauses.map((sub) => sub.content),
            ]),
          ]
        : [],
    [article],
  )
  const {
    speaking,
    error: speechError,
    mode: speechMode,
    toggle: toggleSpeech,
    stop: stopSpeech,
  } = useReadAloud(speechLines)

  useEffect(() => {
    setReadClauses(getReadClauses(articleId))
    setSavedArticles(getSavedArticles())
    setFont(getReaderFont())
    setCopied(false)
    wasFinished.current = false
    stopSpeech()
  }, [articleId, stopSpeech])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (finished && article) markArticleFinished(article.id)
    if (finished && !wasFinished.current) setCelebrate(true)
    wasFinished.current = finished
  }, [finished, article])

  useEffect(() => {
    if (!celebrate) return
    const timer = window.setTimeout(() => setCelebrate(false), 2400)
    return () => window.clearTimeout(timer)
  }, [celebrate])

  useEffect(() => {
    if (article) setLastArticle(article.id)
  }, [article])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      const target = event.target as HTMLElement | null
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      if (event.key === 'ArrowLeft' && previous) {
        event.preventDefault()
        navigate(`/read/${previous.id}`)
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault()
        navigate(`/read/${next.id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, previous, next])

  const copyLink = useCallback(
    async (clauseId?: number) => {
      const url = `${window.location.origin}/read/${articleId}${clauseId ? `#clause-${clauseId}` : ''}`
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    },
    [articleId],
  )

  const changeFont = (next: ReaderFont) => {
    setFont(next)
    setReaderFont(next)
  }

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
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link to="/read" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Study library
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSpeech}
            aria-pressed={speaking}
            title="Read this article aloud (uses an online voice if this browser has no working speech voices)"
            className="flex items-center gap-1.5 rounded-full border border-royal-800 bg-royal-950/40 px-3 py-1.5 text-xs font-semibold text-royal-200 hover:bg-royal-900/60 transition"
          >
            {speaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">{speaking ? 'Stop' : 'Listen'}</span>
            {speaking && (
              <span className="hidden text-[10px] font-normal text-royal-400/80 md:inline">
                {speechMode === 'online' ? 'online voice' : 'device voice'}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950 px-1 py-1" role="group" aria-label="Text size">
            <Type className="w-3.5 h-3.5 text-slate-500 mx-1" aria-hidden="true" />
            {(['small', 'normal', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => changeFont(size)}
                aria-pressed={font === size}
                aria-label={`${size} text size`}
                className={`h-6 w-7 rounded-full text-xs font-bold transition ${
                  font === size ? 'bg-royal-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {size === 'small' ? 'A−' : size === 'normal' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSavedArticles(toggleSavedArticle(articleId))}
            aria-pressed={isSaved}
            title={isSaved ? 'Remove bookmark' : 'Bookmark this article'}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isSaved ? 'border-yellow-700 bg-yellow-500/10 text-yellow-300' : 'border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${isSaved ? 'fill-yellow-400' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={() => void copyLink()}
            title="Copy a link to this article"
            className="flex items-center gap-1.5 rounded-full border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      {speechError && (
        <div role="alert" className="mb-4 rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-xs text-crimson-200">
          {speechError}
        </div>
      )}

      <header className="mb-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal-300">
          <BookOpen className="w-4 h-4" /> Part {article.part_number} · {article.part_title}
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mt-3">{article.title}</h1>
        <p className="text-xs text-slate-500 mt-2">
          Article {article.article_number} <span className="mx-2 text-slate-700">·</span> {article.id}
        </p>
      </header>

      {total > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Your reading progress</span>
            <span>{readCount}/{total} clauses</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={readCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Clauses read"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-royal-500 to-crimson-500 transition-all duration-300"
              style={{ width: `${Math.round((readCount / total) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Jump to clause">
            {article.clauses.map((clause, clauseIndex) => {
              const isRead = readClauses.includes(clause.id)
              return (
                <button
                  key={clause.id}
                  onClick={() => document.getElementById(`clause-${clause.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  aria-label={`Jump to clause ${clauseIndex + 1}`}
                  className={`h-6 w-6 rounded-lg border text-[11px] font-bold transition ${
                    isRead ? 'border-emerald-600 bg-emerald-600/20 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-royal-600 hover:text-white'
                  }`}
                >
                  {clauseIndex + 1}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tick each clause as you finish it. Your progress is saved on this device.
          </p>
        </div>
      )}

      {finished && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          <Sparkles className="w-4 h-4 shrink-0" /> You&apos;ve read every clause of this article. Nice work!
        </div>
      )}

      <article className="space-y-4">
        {total === 0 && <p className="text-sm text-slate-500">No clause text is available for this article yet.</p>}
        {article.clauses.map((clause, clauseIndex) => {
          const isRead = readClauses.includes(clause.id)
          return (
            <section
              key={clause.id}
              id={`clause-${clause.id}`}
              className={`flex scroll-mt-28 gap-3 rounded-2xl border p-4 transition sm:gap-4 ${
                isRead ? 'border-emerald-800/60 bg-emerald-950/10' : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <button
                onClick={() => setReadClauses(toggleReadClause(articleId, clause.id))}
                aria-pressed={isRead}
                aria-label={`Mark clause ${clauseIndex + 1} as ${isRead ? 'unread' : 'read'}`}
                title={isRead ? 'Mark as unread' : 'Mark as read'}
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                  isRead
                    ? 'border-emerald-500 bg-emerald-600 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-royal-600 hover:text-white'
                }`}
              >
                {isRead ? <Check className="w-4 h-4" /> : clauseIndex + 1}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-royal-300">Clause {clauseIndex + 1}</span>
                  <button
                    onClick={() => void copyLink(clause.id)}
                    aria-label={`Copy link to clause ${clauseIndex + 1}`}
                    title="Copy link to this clause"
                    className="text-slate-600 transition hover:text-royal-300"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={`break-words font-display text-slate-200 ${FONT_SIZES[font].clause}`}>{clause.content}</p>
                {clause.sub_clauses.length > 0 && (
                  <div className="mt-3 space-y-2 border-l border-slate-700 pl-3 sm:pl-4">
                    {clause.sub_clauses.map((sub) => (
                      <p key={sub.identifier} className={`break-words font-display text-slate-400 ${FONT_SIZES[font].sub}`}>
                        <span className="mr-2 font-sans font-bold text-royal-300">({sub.identifier})</span>
                        {sub.content}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </article>

      {article.dependencies.length > 0 && (
        <section className="mt-8 border-t border-slate-800 pt-6" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-3 font-display font-bold text-lg">Related articles</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {article.dependencies.map((dependency) => {
              const target = articles.find((item) => item.id === dependency.target_id)
              return (
                <Link
                  key={`${dependency.target_id}-${dependency.relation_type}`}
                  to={`/read/${dependency.target_id}`}
                  className="group rounded-xl border border-slate-800 bg-slate-950/50 p-3 transition hover:border-royal-700"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-royal-300">
                    {RELATION_LABELS[dependency.relation_type] ?? dependency.relation_type}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-slate-200 group-hover:text-white">
                    {target ? `Article ${target.article_number}: ${target.title}` : dependency.target_id}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <nav aria-label="Article navigation" className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
        {previous ? (
          <Link to={`/read/${previous.id}`} className="flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft className="w-4 h-4 shrink-0" /> Article {previous.article_number}: {previous.title}
          </Link>
        ) : (
          <span className="text-sm text-slate-600">First article</span>
        )}
        {next ? (
          <Link to={`/read/${next.id}`} className="flex items-center justify-end gap-2 text-right text-sm font-semibold text-royal-300 transition hover:text-white">
            Article {next.article_number}: {next.title} <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        ) : (
          <span className="text-sm text-slate-600">Last article</span>
        )}
      </nav>

      <p className="mt-3 text-center text-[11px] text-slate-600">Tip: use the ← and → keys to flip between articles.</p>
      <p className="mt-6 text-center text-xs text-slate-500">
        Reading here is free and never costs hearts or XP.{' '}
        <Link to="/auth" className="font-semibold text-royal-300 hover:text-white">Sign in to play the game</Link>
      </p>

      {celebrate && <Confetti count={80} />}
    </div>
  )
}
