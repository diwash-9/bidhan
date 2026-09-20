import { useState } from 'react'
import { ArrowLeft, Award, CheckCircle, Eye, EyeOff, Heart, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import RefillCountdown from '@/components/RefillCountdown'
import { useArticle, useAttemptQuestion, useCompleteArticle, useHeart, useQuiz, useUserProgress } from '@/hooks/useApi'
import type { QuizResult } from '@/types'

export default function LessonView() {
  const { articleId = '' } = useParams()
  const { data: article } = useArticle(articleId)
  const { data: quiz = [] } = useQuiz(articleId)
  const { data: progress, refetch: refetchProgress } = useUserProgress()

  const [phase, setPhase] = useState<'read' | 'quiz'>('read')
  const [revealed, setRevealed] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, QuizResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const completeMutation = useCompleteArticle()
  const attemptMutation = useAttemptQuestion()
  const heartMutation = useHeart()

  const heartsLeft = progress?.hearts_left ?? 10
  const outOfHearts = heartsLeft <= 0
  const heartsRefillAt = progress?.hearts_refill_at ?? null

  const alreadyCompleted = (progress?.articles ?? []).some(
    (a) => a.article_id === articleId && a.status === 'completed',
  )
  const current = quiz[currentIdx]
  const allCorrect = quiz.length > 0 && quiz.every((q) => answers[q.id]?.is_correct === true)
  const finished = quiz.length > 0 && currentIdx >= quiz.length && allCorrect
  const done = saved || alreadyCompleted

  const refreshHearts = () => void refetchProgress()

  const handleAnswer = async (letter: string) => {
    if (!current || answers[current.id]?.is_correct) return
    setError(null)
    try {
      const result = await attemptMutation.mutateAsync({ questionId: current.id, selectedOption: letter })
      setAnswers((prev) => ({ ...prev, [current.id]: result }))
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not submit your answer. Try again.')
      refreshHearts()
    }
  }

  const handleNext = () => setCurrentIdx((i) => i + 1)

  const handleStartQuiz = () => {
    setPhase('quiz')
    setRevealed(false)
  }

  const handleReveal = async () => {
    setError(null)
    try {
      await heartMutation.mutateAsync()
      setRevealed(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not reveal the article. Try again.')
      refreshHearts()
    }
  }

  const handleComplete = async () => {
    setError(null)
    try {
      await completeMutation.mutateAsync(articleId)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not complete this lesson. Try again.')
    }
  }

  if (!article) {
    return <div className="py-16 text-center text-slate-500">Loading article…</div>
  }

  const renderArticle = () => (
    <div className="space-y-4">
      {article.clauses.map((cl) => (
        <div key={cl.id} className="bg-slate-950/60 border-l-2 border-royal-700 p-4 rounded-r-2xl">
          <div className="flex gap-3">
            <span className="font-bold text-royal-300 shrink-0">({cl.clause_number})</span>
            <div>
              <p className="text-slate-300 leading-relaxed text-sm">{cl.content}</p>
              {cl.sub_clauses.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cl.sub_clauses.map((sc) => (
                    <p key={sc.identifier} className="text-slate-400 text-xs pl-4">
                      <span className="font-bold text-royal-400">({sc.identifier})</span> {sc.content}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-4xl mx-auto">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-semibold transition">
        <ArrowLeft className="w-4 h-4" /> Back to Path
      </Link>

      <div className="mb-6">
        <span className="text-xs uppercase font-bold tracking-wider text-crimson-400 bg-crimson-500/10 px-3 py-1 rounded-full border border-crimson-500/20">
          Article {article.article_number}
        </span>
        <h2 className="text-2xl font-bold mt-2 font-display">{article.title}</h2>
        <p className="text-xs text-slate-400 mt-1">{article.part_title}</p>
      </div>

      {phase === 'read' && (
        <>
          {renderArticle()}

          <div className="border-t border-slate-800 pt-6 mt-8">
            <button
              onClick={handleStartQuiz}
              disabled={quiz.length === 0 || done}
              className={`w-full font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                quiz.length === 0 || done
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-crimson-600 hover:bg-crimson-500 text-white'
              }`}
            >
              <Award className="w-5 h-5" /> Start Knowledge Check
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              The article is hidden during the check — re-opening it costs <Heart className="w-3 h-3 inline text-crimson-500 fill-crimson-500" /> 1.
            </p>
          </div>
        </>
      )}

      {phase === 'quiz' && (
        <div className="border-t border-slate-800 pt-6">
          <h3 className="font-bold text-base text-royal-300 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-crimson-400" /> Knowledge Check
            <span className="text-xs text-slate-400">({Math.min(currentIdx + 1, quiz.length)}/{quiz.length})</span>
          </h3>

          {outOfHearts && (
            <div
              role="alert"
              className="mb-4 p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/40 text-crimson-300 font-semibold text-sm"
            >
              You're out of hearts. Next heart in{' '}
              <RefillCountdown refillAt={heartsRefillAt} onExpire={refreshHearts} className="font-bold" />.
            </div>
          )}

          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={outOfHearts || heartMutation.isPending}
              className="mb-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-semibold border border-royal-700/60 bg-royal-900/30 text-royal-200 hover:bg-royal-900/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" /> Show article (−1 <Heart className="w-3 h-3 inline text-crimson-500 fill-crimson-500" />)
            </button>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setRevealed(false)}
                  className="flex items-center gap-2 text-xs font-semibold text-royal-300 hover:text-white transition"
                >
                  <EyeOff className="w-4 h-4" /> Hide article
                </button>
                <span className="text-xs text-slate-500">Re-opening while quizzing costs another heart.</span>
              </div>
              {renderArticle()}
            </div>
          )}

          {!finished && current && (
            <>
              <p className="text-slate-200 font-medium mb-4">{current.question_text}</p>
              <div className="grid gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const answered = answers[current.id]
                  const text = current[`option_${opt.toLowerCase()}` as keyof typeof current] as string
                  let style = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  if (answered) {
                    if (opt === answered.correct_option) style = 'bg-crimson-600/20 border-crimson-500 text-crimson-300'
                    else if (opt === answered.selected_option) style = 'bg-slate-800 border-slate-600 text-slate-500 line-through'
                    else style = 'bg-slate-950 border-slate-800 text-slate-500'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered?.is_correct === true || outOfHearts}
                      className={`p-3 rounded-xl text-left text-sm font-semibold transition border ${style} disabled:cursor-not-allowed`}
                    >
                      <span className="font-bold mr-2">{opt}.</span> {text}
                    </button>
                  )
                })}
              </div>

              {(() => {
                const answered = answers[current.id]
                if (!answered) return null
                return (
                  <div className="mt-4">
                    <div
                      role="status"
                      className={`p-4 rounded-xl border font-semibold text-sm ${
                        answered.is_correct
                          ? 'bg-royal-500/10 border-royal-500/30 text-royal-300'
                          : 'bg-crimson-500/10 border-crimson-500/30 text-crimson-300'
                      }`}
                    >
                      {answered.is_correct ? (
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> +{answered.xp_earned} XP — {answered.explanation}</span>
                      ) : (
                        <span className="flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> -1 <Heart className="w-3 h-3 inline fill-crimson-300 text-crimson-500" /> — {answered.explanation}</span>
                      )}
                    </div>
                    {answered.is_correct ? (
                      <button
                        onClick={handleNext}
                        className="mt-3 w-full bg-crimson-600 hover:bg-crimson-500 font-bold py-3 rounded-xl transition"
                      >
                        {currentIdx + 1 < quiz.length ? 'Next Question' : 'Finish Quiz'}
                      </button>
                    ) : (
                      <p className="mt-3 text-center text-xs text-slate-400">
                        Not quite — pick another option to try again.
                      </p>
                    )}
                  </div>
                )
              })()}
            </>
          )}

          {finished && (
            <div className="p-4 rounded-xl bg-royal-500/10 border border-royal-500/30 text-royal-200 font-semibold text-center">
              Quiz passed! 🎉 You may finish the lesson.
            </div>
          )}

          {!done && quiz.length === 0 && (
            <p className="text-sm text-slate-400 text-center">No active questions for this lesson yet.</p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-300 font-semibold text-sm"
        >
          {error}
        </div>
      )}

      {done && (
        <div className="mt-6 mb-8 p-4 rounded-xl bg-royal-500/10 border border-royal-500/30 text-royal-200 font-semibold text-center">
          <CheckCircle className="w-5 h-5 inline mr-2" />
          {saved ? 'Lesson completed and saved! 🎉' : 'You already completed this lesson. 🎉'}
        </div>
      )}

      {done ? (
        <Link
          to="/"
          className="block w-full text-center bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-4 rounded-2xl transition shadow-lg"
        >
          Back to Path
        </Link>
      ) : (
        phase === 'quiz' && (
          <button
            onClick={handleComplete}
            disabled={!finished || completeMutation.isPending}
            className={`w-full font-bold py-4 rounded-2xl transition shadow-lg ${
              finished
                ? 'bg-crimson-600 hover:bg-crimson-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {completeMutation.isPending ? 'Completing…' : 'Complete Lesson (+15 XP)'}
          </button>
        )
      )}
    </div>
  )
}