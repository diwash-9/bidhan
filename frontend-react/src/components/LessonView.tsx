import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Eye,
  EyeOff,
  Flame,
  Heart,
  RotateCcw,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import Confetti from '@/components/Confetti'
import RefillCountdown from '@/components/RefillCountdown'
import { useArticle, useAttemptQuestion, useCompleteArticle, useHeart, useQuiz, useUserProgress } from '@/hooks/useApi'
import { sfxComplete, sfxCorrect, sfxWrong } from '@/lib/sfx'
import type { QuizResult } from '@/types'

export default function LessonView() {
  const { articleId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const isPractice = searchParams.get('practice') === '1'
  const { data: article } = useArticle(articleId)
  const { data: quiz = [] } = useQuiz(articleId)
  const { data: progress, refetch: refetchProgress } = useUserProgress()

  const [phase, setPhase] = useState<'read' | 'quiz'>(isPractice ? 'quiz' : 'read')
  const [revealed, setRevealed] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, QuizResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [shakes, setShakes] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const completeMutation = useCompleteArticle()
  const attemptMutation = useAttemptQuestion()
  const heartMutation = useHeart()

  const heartsLeft = progress?.hearts_left ?? 10
  const outOfHearts = !isPractice && heartsLeft <= 0
  const heartsRefillAt = progress?.hearts_refill_at ?? null

  const alreadyCompleted = (progress?.articles ?? []).some(
    (a) => a.article_id === articleId && a.status === 'completed',
  )
  const current = quiz[currentIdx]
  const allCorrect = quiz.length > 0 && quiz.every((q) => answers[q.id]?.is_correct === true)
  const finished = quiz.length > 0 && currentIdx >= quiz.length && allCorrect
  const done = !isPractice && (saved || alreadyCompleted)
  const showCelebration = saved || (isPractice && finished)

  useEffect(() => {
    if (!confetti) return
    const t = setTimeout(() => setConfetti(false), 2400)
    return () => clearTimeout(t)
  }, [confetti])

  useEffect(() => {
    if (showCelebration) sfxComplete()
  }, [showCelebration])

  const refreshHearts = () => void refetchProgress()

  const handleAnswer = useCallback(
    async (letter: string) => {
      if (!current || answers[current.id]?.is_correct) return
      setError(null)
      try {
        const result = await attemptMutation.mutateAsync({
          questionId: current.id,
          selectedOption: letter,
          practice: isPractice,
        })
        const wasCorrectBefore = answers[current.id]?.is_correct === true
        setAnswers((prev) => ({ ...prev, [current.id]: result }))
        if (result.is_correct) {
          if (!wasCorrectBefore) setXpEarned((x) => x + result.xp_earned)
          setStreak((s) => s + 1)
          sfxCorrect()
          if (streak >= 3) setConfetti(true)
        } else {
          setStreak(0)
          setShakes((s) => s + 1)
          sfxWrong()
        }
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Could not submit your answer. Try again.')
        refreshHearts()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, answers, attemptMutation, isPractice, streak],
  )

  const handleNext = useCallback(() => setCurrentIdx((i) => i + 1), [])

  useEffect(() => {
    if (phase !== 'quiz' || finished || showCelebration) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key >= '1' && e.key <= '4') {
        const letters = ['A', 'B', 'C', 'D']
        const letter = letters[Number(e.key) - 1]
        if (letter) void handleAnswer(letter)
      } else if (e.key === 'Enter' || e.key === ' ') {
        const answered = current ? answers[current.id] : undefined
        if (answered?.is_correct) handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, finished, showCelebration, current, answers, handleAnswer, handleNext])

  const handleStartQuiz = () => {
    setPhase('quiz')
    setRevealed(false)
  }

  const handleReveal = async () => {
    setError(null)
    if (isPractice) {
      setRevealed(true)
      return
    }
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
      setXpEarned((x) => x + 15)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not complete this lesson. Try again.')
    }
  }

  const answered = current ? answers[current.id] : undefined
  const wrongLatest = answered ? !answered.is_correct : false

  if (isPractice && !alreadyCompleted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md mx-auto text-center">
        <p className="text-slate-200 font-semibold">Practice is only available on completed lessons.</p>
        <p className="text-sm text-slate-400 mt-2">Finish the lesson first, then you can replay it here.</p>
        <Link to={`/lesson/${articleId}`} className="mt-5 block w-full bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-xl transition">
          Back to Lesson
        </Link>
      </div>
    )
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
        {isPractice && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-royal-300 bg-royal-900/40 border border-royal-800 rounded-full px-3 py-1">
            <RotateCcw className="w-3 h-3" /> Practice mode — +4 XP per correct answer, no hearts used
          </span>
        )}
      </div>

      {phase === 'read' && (
        <>
          {renderArticle()}

          <div className="border-t border-slate-800 pt-6 mt-8">
            <button
              onClick={handleStartQuiz}
              disabled={quiz.length === 0 || isPractice}
              className={`w-full font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                quiz.length === 0 || isPractice
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-crimson-600 hover:bg-crimson-500 text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" /> Start Knowledge Check
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
            {isPractice ? <RotateCcw className="w-5 h-5 text-crimson-400" /> : <Award className="w-5 h-5 text-crimson-400" />}
            {isPractice ? 'Practice' : 'Knowledge Check'}
            <span className="text-xs text-slate-400">({Math.min(currentIdx + 1, quiz.length)}/{quiz.length})</span>
            {streak >= 2 && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-400 animate-pop-in">
                <Flame className="w-4 h-4 fill-orange-400" /> {streak}
              </span>
            )}
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
              <Eye className="w-4 h-4" />
              {isPractice ? 'Show article (free in practice)' : 'Show article (−1 ♥)'}
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
                <span className="text-xs text-slate-500">
                  {isPractice ? 'Toggle freely — you are only practising.' : 'Re-opening while quizzing costs another heart.'}
                </span>
              </div>
              {renderArticle()}
            </div>
          )}

          {!finished && current && (
            <>
              <p className="text-slate-200 font-medium mb-4">
                <span className="text-xs font-bold text-slate-500 mr-2">{currentIdx + 1}.</span>
                {current.question_text}
              </p>
              <div key={shakes} className={`grid gap-3 ${wrongLatest ? 'animate-shake' : ''}`}>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const text = current[`option_${opt.toLowerCase()}` as keyof typeof current] as string
                  let style = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  if (answered) {
                    if (opt === answered.correct_option) style = 'bg-royal-500/20 border-royal-500 text-royal-300'
                    else if (opt === answered.selected_option) style = 'bg-slate-800 border-slate-600 text-slate-500 line-through'
                    else style = 'bg-slate-950 border-slate-800 text-slate-500'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered?.is_correct === true || outOfHearts}
                      aria-pressed={answered?.selected_option === opt}
                      className={`p-3 rounded-xl text-left text-sm font-semibold transition border ${style} disabled:cursor-not-allowed`}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-lg bg-slate-800/80 text-xs font-bold border border-slate-700">
                        {opt}
                      </span>
                      {text}
                    </button>
                  )
                })}
              </div>

              {answered && (
                <div className="mt-4 animate-pop-in">
                  <div
                    role="status"
                    className={`p-4 rounded-xl border font-semibold text-sm ${
                      answered.is_correct
                        ? 'bg-royal-500/10 border-royal-500/30 text-royal-300'
                        : 'bg-crimson-500/10 border-crimson-500/30 text-crimson-300'
                    }`}
                  >
                    {answered.is_correct ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" /> +{answered.xp_earned} XP — {answered.explanation}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {isPractice ? 'Not quite — keep trying!' : `-1 ${'♥'} — ${answered.explanation}`}
                      </span>
                    )}
                  </div>
                  {answered.is_correct ? (
                    <button
                      onClick={handleNext}
                      className="mt-3 w-full bg-crimson-600 hover:bg-crimson-500 font-bold py-3 rounded-xl transition"
                    >
                      {currentIdx + 1 < quiz.length ? 'Next Question' : 'Finish'}
                    </button>
                  ) : (
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Not quite — pick another option to try again.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {finished && (
            <div className="p-4 rounded-xl bg-royal-500/10 border border-royal-500/30 text-royal-200 font-semibold text-center">
              {isPractice ? 'Practice session complete! 🎉' : 'Quiz passed! 🎉 You may finish the lesson.'}
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
        phase === 'quiz' &&
        !isPractice && (
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

      {showCelebration && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lesson complete"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <Confetti count={160} />
          <div className="animate-pop-in relative bg-slate-900 border-2 border-royal-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="flex justify-center gap-1 mb-3">
              {[0, 1, 2].map((s) => (
                <Star key={s} className="w-8 h-8 fill-yellow-300 text-yellow-300" />
              ))}
            </div>
            <h3 className="text-3xl font-black font-display text-white">
              {isPractice ? 'Practice complete!' : 'Lesson complete!'}
            </h3>
            <p className="text-yellow-300 font-bold mt-2 text-lg">+{xpEarned} XP</p>
            <p className="text-slate-400 text-sm mt-1">
              {isPractice
                ? 'Great review! Keep your streak alive tomorrow.'
                : 'You finished another chapter of the Constitution.'}
            </p>
            <Link
              to="/"
              className="mt-6 block w-full bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-2xl transition shadow-lg"
            >
              Continue
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}