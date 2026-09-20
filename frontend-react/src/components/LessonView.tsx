import { useState } from 'react'
import { ArrowLeft, Award, CheckCircle, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { useArticle, useAttemptQuestion, useCompleteArticle, useQuiz } from '@/hooks/useApi'
import type { QuizResult } from '@/types'

export default function LessonView() {
  const { articleId = '' } = useParams()
  const { data: article } = useArticle(articleId)
  const { data: quiz = [] } = useQuiz(articleId)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, QuizResult>>({})
  const completeMutation = useCompleteArticle()
  const attemptMutation = useAttemptQuestion()

  const current = quiz[currentIdx]
  const finished = currentIdx >= quiz.length

  const handleAnswer = async (letter: string) => {
    if (!current || answers[current.id]) return
    const result = await attemptMutation.mutateAsync({ questionId: current.id, selectedOption: letter })
    setAnswers((prev) => ({ ...prev, [current.id]: result }))
  }

  const handleNext = () => setCurrentIdx((i) => i + 1)

  const handleComplete = async () => {
    await completeMutation.mutateAsync(articleId)
  }

  if (!article) {
    return <div className="py-16 text-center text-slate-500">Loading article…</div>
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-semibold transition">
        <ArrowLeft className="w-4 h-4" /> Back to Path
      </Link>

      <div className="mb-6">
        <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Article {article.article_number}
        </span>
        <h2 className="text-2xl font-bold mt-2">{article.title}</h2>
        <p className="text-xs text-slate-400 mt-1">{article.part_title}</p>
      </div>

      <div className="space-y-4 mb-8">
        {article.clauses.map((cl) => (
          <div key={cl.id} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex gap-3">
              <span className="font-bold text-emerald-400 shrink-0">({cl.clause_number})</span>
              <div>
                <p className="text-slate-300 leading-relaxed text-sm">{cl.content}</p>
                {cl.sub_clauses.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {cl.sub_clauses.map((sc) => (
                      <p key={sc.identifier} className="text-slate-400 text-xs pl-4">
                        <span className="font-bold text-emerald-500">({sc.identifier})</span> {sc.content}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {quiz.length > 0 && (
        <div className="border-t border-slate-800 pt-6 mb-8">
          <h3 className="font-bold text-base text-yellow-400 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5" /> Knowledge Check
            <span className="text-xs text-slate-400">({Math.min(currentIdx + 1, quiz.length)}/{quiz.length})</span>
          </h3>

          {!finished && current && (
            <>
              <p className="text-slate-200 font-medium mb-4">{current.question_text}</p>
              <div className="grid gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const answered = answers[current.id]
                  const text = current[`option_${opt.toLowerCase()}` as keyof typeof current] as string
                  let style = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  if (answered) {
                    if (opt === answered.correct_option) style = 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    else if (opt === answered.selected_option) style = 'bg-red-600/20 border-red-500 text-red-300'
                    else style = 'bg-slate-950 border-slate-800 text-slate-500'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!answered}
                      className={`p-3 rounded-xl text-left text-sm font-semibold transition border ${style}`}
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
                      className={`p-4 rounded-xl border font-semibold text-sm ${
                        answered.is_correct
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {answered.is_correct ? (
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> +{answered.xp_earned} XP — {answered.explanation}</span>
                      ) : (
                        <span className="flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> -1 ♥ — {answered.explanation}</span>
                      )}
                    </div>
                    <button
                      onClick={handleNext}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition"
                    >
                      {currentIdx + 1 < quiz.length ? 'Next Question' : 'Finish Quiz'}
                    </button>
                  </div>
                )
              })()}
            </>
          )}

          {finished && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-center">
              Quiz complete! 🎉 Review complete — you may finish the lesson.
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={!finished || completeMutation.isPending}
        className={`w-full font-bold py-4 rounded-2xl transition shadow-lg ${
          finished
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        Complete Lesson (+15 XP)
      </button>
    </div>
  )
}