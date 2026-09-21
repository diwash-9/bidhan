import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react'

import { useAdminArticle, useAmendArticle, useAdminRevisions, useCreateArticle } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth'
import type {
  AdminArticle,
  AdminClause,
  AdminQuizQuestion,
  AmendmentPayload,
  ArticleEditorState,
  Dependency,
  RevisionMeta,
  SubClause,
} from '@/types'

const NEW_ARTICLE: ArticleEditorState = {
  article: {
    article_number: 1,
    title: '',
    part_number: 1,
    part_title: '',
    difficulty_score: 1,
    estimated_xp: 15,
  },
  clauses: [],
  dependencies: [],
  quiz: [],
}

const LETTERS = ['A', 'B', 'C', 'D']
const RELATION_OPTIONS = ['sequential', 'cross_part', 'text_reference']

function emptyQuizQuestion(): AdminQuizQuestion {
  return {
    id: null,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: null,
    difficulty: 1,
    knowledge_type: 'article_subject',
    active: true,
  }
}

function fromAdminArticle(a: AdminArticle): ArticleEditorState {
  return {
    article: {
      article_number: a.article_number,
      title: a.title,
      part_number: a.part_number,
      part_title: a.part_title,
      difficulty_score: a.difficulty_score,
      estimated_xp: a.estimated_xp,
    },
    clauses: a.clauses,
    dependencies: a.dependencies,
    quiz: a.quiz,
  }
}

export default function AdminArticleEditor() {
  const { articleId } = useParams()
  const isNew = articleId === 'new'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: adminArticle, isPending: loadingArticle } = useAdminArticle(isNew ? null : (articleId ?? null))
  const { data: revisions } = useAdminRevisions(isNew ? undefined : articleId)
  const mutate = useAmendArticle()
  const create = useCreateArticle()

  const [draft, setDraft] = useState<ArticleEditorState>(NEW_ARTICLE)
  const [meta, setMeta] = useState<RevisionMeta>({ amendment_date: '', amendment_act: '', summary: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (adminArticle) setDraft(fromAdminArticle(adminArticle))
  }, [adminArticle])

  if (loadingArticle) {
    return <div className="py-16 text-center text-slate-500">Loading article…</div>
  }

  function patchArticle(patch: Partial<ArticleEditorState['article']>) {
    setDraft((d) => ({ ...d, article: { ...d.article, ...patch } }))
  }

  function patchClause(i: number, patch: Partial<AdminClause>) {
    setDraft((d) => {
      const clauses = d.clauses.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
      return { ...d, clauses }
    })
  }

  function patchSubClause(ci: number, si: number, patch: Partial<SubClause>) {
    setDraft((d) => {
      const clauses = d.clauses.map((clause, idx) => {
        if (idx !== ci) return clause
        const sub_clauses = clause.sub_clauses.map((s, idx2) => (idx2 === si ? { ...s, ...patch } : s))
        return { ...clause, sub_clauses }
      })
      return { ...d, clauses }
    })
  }

  function patchDependency(i: number, patch: Partial<Dependency>) {
    setDraft((d) => ({ ...d, dependencies: d.dependencies.map((dep, idx) => (idx === i ? { ...dep, ...patch } : dep)) }))
  }

  function patchQuiz(i: number, patch: Partial<AdminQuizQuestion>) {
    setDraft((d) => ({ ...d, quiz: d.quiz.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }))
  }

  async function save() {
    setError(null)
    const payload: AmendmentPayload = {
      ...draft,
      revision: {
        amendment_date: meta.amendment_date || null,
        amendment_act: meta.amendment_act || null,
        summary: meta.summary || null,
      },
    }
    try {
      setSaving(true)
      if (isNew) {
        await create.mutateAsync(payload)
      } else {
        await mutate.mutateAsync({ articleId: articleId as string, payload })
      }
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-slate-400 hover:text-white transition inline-flex items-center gap-1 text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Content admin
          </Link>
          <h2 className="text-2xl font-bold font-display">{isNew ? 'New article' : `Edit ${articleId}`}</h2>
        </div>

        {error && (
          <div role="alert" className="bg-red-950/60 border border-red-800 text-red-200 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Metadata */}
        <section className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-6">
          <h3 className="font-bold mb-4 text-royal-200">Article metadata</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs text-slate-400 font-semibold">
              Article number
              <input type="number" value={draft.article.article_number} min={1}
                onChange={(e) => patchArticle({ article_number: Number(e.target.value) })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Title
              <input type="text" value={draft.article.title}
                onChange={(e) => patchArticle({ title: e.target.value })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Part number
              <input type="number" value={draft.article.part_number} min={1}
                onChange={(e) => patchArticle({ part_number: Number(e.target.value) })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Part title
              <input type="text" value={draft.article.part_title}
                onChange={(e) => patchArticle({ part_title: e.target.value })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Difficulty (1–10)
              <input type="number" value={draft.article.difficulty_score} min={1} max={10}
                onChange={(e) => patchArticle({ difficulty_score: Number(e.target.value) })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Estimated XP
              <input type="number" value={draft.article.estimated_xp} min={0}
                onChange={(e) => patchArticle({ estimated_xp: Number(e.target.value) })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
          </div>
        </section>

        {/* Clauses */}
        <section className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-royal-200">Clauses</h3>
            <button onClick={() => setDraft((d) => ({ ...d, clauses: [...d.clauses, { clause_number: d.clauses.length + 1, content: '', sub_clauses: [] }] }))}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-royal-900/60 hover:bg-royal-800 text-royal-100 rounded-full px-3 py-1.5 border border-royal-800 transition">
              <Plus className="w-3 h-3" /> Add clause
            </button>
          </div>
          <div className="space-y-4">
            {draft.clauses.map((c, ci) => (
              <div key={ci} className="border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input type="number" value={c.clause_number} min={1}
                    onChange={(e) => patchClause(ci, { clause_number: Number(e.target.value) })}
                    className="w-20 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-crimson-500" aria-label="Clause number" />
                  <span className="text-xs text-slate-500">clause</span>
                  <button
                    onClick={() => setDraft((d) => ({ ...d, clauses: d.clauses.filter((_, i) => i !== ci) }))}
                    className="ml-auto text-slate-500 hover:text-red-400 transition p-1" aria-label="Remove clause">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea value={c.content} rows={3}
                  onChange={(e) => patchClause(ci, { content: e.target.value })}
                  className="w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 text-sm outline-none focus:border-crimson-500"
                  placeholder="Clause text" />
                <div className="space-y-2 mt-2">
                  {c.sub_clauses.map((s, si) => (
                    <div key={si} className="flex items-start gap-2">
                      <input value={s.identifier}
                        onChange={(e) => patchSubClause(ci, si, { identifier: e.target.value })}
                        className="w-14 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-crimson-500" aria-label="Sub-clause identifier" />
                      <input value={s.content}
                        onChange={(e) => patchSubClause(ci, si, { content: e.target.value })}
                        className="flex-1 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-crimson-500" aria-label="Sub-clause content" />
                      <button
                        onClick={() => patchClause(ci, { sub_clauses: c.sub_clauses.filter((_, i) => i !== si) })}
                        className="text-slate-500 hover:text-red-400 transition p-1" aria-label="Remove sub-clause">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => patchClause(ci, { sub_clauses: [...c.sub_clauses, { identifier: String.fromCharCode(97 + c.sub_clauses.length), content: '' }] })}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
                  <Plus className="w-3 h-3" /> Add sub-clause
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Dependencies */}
        <section className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-royal-200">Dependencies (unlocks)</h3>
            <button onClick={() => setDraft((d) => ({ ...d, dependencies: [...d.dependencies, { target_id: '', relation_type: 'text_reference' }] }))}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-royal-900/60 hover:bg-royal-800 text-royal-100 rounded-full px-3 py-1.5 border border-royal-800 transition">
              <Plus className="w-3 h-3" /> Add edge
            </button>
          </div>
          <div className="space-y-2">
            {draft.dependencies.map((dep, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={dep.target_id}
                  onChange={(e) => patchDependency(i, { target_id: e.target.value })}
                  className="w-32 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-crimson-500"
                  placeholder="ART-2" aria-label="Target article" />
                <select value={dep.relation_type}
                  onChange={(e) => patchDependency(i, { relation_type: e.target.value })}
                  className="bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 text-sm outline-none">
                  {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => setDraft((d) => ({ ...d, dependencies: d.dependencies.filter((_, idx) => idx !== i) }))}
                  className="text-slate-500 hover:text-red-400 transition p-1" aria-label="Remove dependency">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Quiz */}
        <section className="bg-slate-900 border-2 border-royal-900 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-royal-200">Quiz questions</h3>
            <button onClick={() => setDraft((d) => ({ ...d, quiz: [...d.quiz, emptyQuizQuestion()] }))}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-crimson-900/60 hover:bg-crimson-800 text-crimson-100 rounded-full px-3 py-1.5 border border-crimson-800 transition">
              <Plus className="w-3 h-3" /> Add question
            </button>
          </div>
          <div className="space-y-6">
            {draft.quiz.map((q, qi) => (
              <div key={q.id ?? `new-${qi}`} className="border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500">#{q.id ?? 'new'}</span>
                  {q.active === false && <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">inactive</span>}
                  <button onClick={() => setDraft((d) => ({ ...d, quiz: d.quiz.filter((_, i) => i !== qi) }))}
                    className="ml-auto text-slate-500 hover:text-red-400 transition p-1" aria-label="Remove question">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea value={q.question_text} rows={2}
                  onChange={(e) => patchQuiz(qi, { question_text: e.target.value })}
                  className="w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 text-sm outline-none focus:border-crimson-500"
                  placeholder="Question" />
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {LETTERS.map((l) => (
                    <label key={l} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-5 text-center font-bold text-crimson-300">{l}</span>
                      <input value={q[l === 'A' ? 'option_a' : l === 'B' ? 'option_b' : l === 'C' ? 'option_c' : 'option_d']}
                        onChange={(e) => patchQuiz(qi, { [l === 'A' ? 'option_a' : l === 'B' ? 'option_b' : l === 'C' ? 'option_c' : 'option_d']: e.target.value })}
                        className="flex-1 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 outline-none focus:border-crimson-500" />
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                  <label className="flex items-center gap-2">
                    Correct
                    <select value={q.correct_option}
                      onChange={(e) => patchQuiz(qi, { correct_option: e.target.value })}
                      className="bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 outline-none">
                      {LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    Difficulty
                    <input type="number" value={q.difficulty} min={1} max={5}
                      onChange={(e) => patchQuiz(qi, { difficulty: Number(e.target.value) })}
                      className="w-16 bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 outline-none" />
                  </label>
                  <label className="flex items-center gap-2">
                    Knowledge type
                    <select value={q.knowledge_type}
                      onChange={(e) => patchQuiz(qi, { knowledge_type: e.target.value })}
                      className="bg-slate-950 border border-royal-900 rounded-lg px-2 py-1.5 outline-none">
                      <option value="article_subject">article_subject</option>
                      <option value="clause_text">clause_text</option>
                      <option value="quote_match">quote_match</option>
                      <option value="scenario">scenario</option>
                    </select>
                  </label>
                </div>
                <textarea value={q.explanation ?? ''} rows={2}
                  onChange={(e) => patchQuiz(qi, { explanation: e.target.value || null })}
                  className="w-full mt-3 bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 text-sm outline-none focus:border-crimson-500"
                  placeholder="Explanation (optional)" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar: revision metadata + save */}
      <aside className="space-y-6">
        <div className="bg-slate-900 border-2 border-crimson-900 rounded-3xl p-5 sticky top-24">
          <h3 className="font-bold text-crimson-300 mb-4">Amendment record</h3>
          <div className="space-y-4">
            <label className="block text-xs text-slate-400 font-semibold">
              Amendment date
              <input type="date" value={meta.amendment_date ?? ''}
                onChange={(e) => setMeta({ ...meta, amendment_date: e.target.value || null })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Amendment act
              <input type="text" value={meta.amendment_act ?? ''}
                onChange={(e) => setMeta({ ...meta, amendment_act: e.target.value || null })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500"
                placeholder="Constitution (First Amendment)" />
            </label>
            <label className="block text-xs text-slate-400 font-semibold">
              Summary
              <textarea value={meta.summary ?? ''} rows={3}
                onChange={(e) => setMeta({ ...meta, summary: e.target.value || null })}
                className="mt-1 w-full bg-slate-950 border border-royal-900 rounded-xl px-3 py-2 outline-none focus:border-crimson-500"
                placeholder="Short description of this change" />
            </label>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-crimson-600 hover:bg-crimson-500 border border-crimson-500 text-white font-bold py-3 shadow-lg shadow-crimson-900/40 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {isNew ? 'Create & record amendment' : 'Save & record amendment'}
          </button>
        </div>

        {!isNew && (
          <div className="bg-slate-900 border border-royal-900 rounded-3xl p-5">
            <h3 className="font-bold text-royal-200 mb-3">Revision history</h3>
            <ul className="space-y-3 text-sm">
              {(revisions ?? []).slice(0, 10).map((r) => (
                <li key={r.id} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div className="font-semibold text-slate-200">{r.summary || r.amendment_act || `Revision #${r.id}`}</div>
                  <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
                  {r.amendment_date && <div className="text-xs text-crimson-300 mt-0.5">Effective {r.amendment_date}{r.amendment_act ? ` · ${r.amendment_act}` : ''}</div>}
                  {r.changed_by === user?.id && <div className="text-xs text-royal-300 mt-0.5">by you</div>}
                </li>
              ))}
            </ul>
            {!revisions?.length && <p className="text-sm text-slate-500">No revisions yet.</p>}
          </div>
        )}
      </aside>
    </div>
  )
}