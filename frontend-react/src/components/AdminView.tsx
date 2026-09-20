import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, History, Search } from 'lucide-react'

import { useAdminArticles, useAdminRevisions, useParts } from '@/hooks/useApi'

export default function AdminView() {
  const [partNumber, setPartNumber] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const { data: parts } = useParts()
  const { data: articles, isPending } = useAdminArticles(partNumber, search || undefined)
  const { data: revisions } = useAdminRevisions()

  const revisionCount: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of revisions ?? []) {
      counts[r.article_id] = (counts[r.article_id] ?? 0) + 1
    }
    return counts
  }, [revisions])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Content Admin</h2>
          <p className="text-sm text-slate-400">Edit article content, clauses, dependencies and quiz questions. Every save records an audit revision.</p>
        </div>
        <Link
          to="/admin/articles/new"
          className="px-4 py-2 rounded-full bg-crimson-600 hover:bg-crimson-500 border border-crimson-500 text-white font-semibold text-sm shadow-lg shadow-crimson-900/30 transition"
        >
          + New article
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex items-center gap-2 bg-slate-900 border border-royal-900 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or ID…"
            className="bg-transparent outline-none text-sm w-56"
          />
        </label>
        <select
          value={partNumber ?? ''}
          onChange={(e) => setPartNumber(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-slate-900 border border-royal-900 rounded-full px-4 py-2 text-sm outline-none"
        >
          <option value="">All parts</option>
          {(parts ?? []).map((p) => (
            <option key={p.part_number} value={p.part_number}>
              Part {p.part_number} — {p.part_title}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="py-16 text-center text-slate-500">Loading articles…</div>
      ) : (
        <div className="bg-slate-900 border-2 border-royal-900 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-royal-900">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Revisions</th>
              </tr>
            </thead>
            <tbody>
              {articles?.map((a) => (
                <tr key={a.id} className="border-b border-slate-800 hover:bg-royal-900/30 transition">
                  <td className="px-4 py-3 font-mono text-crimson-300">{a.id}</td>
                  <td className="px-4 py-3">{a.article_number}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/articles/${a.id}`} className="hover:underline font-medium">{a.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{a.part_number}</td>
                  <td className="px-4 py-3">{a.estimated_xp}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <History className="w-3.5 h-3.5" />
                      {revisionCount[a.id] ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!articles?.length && (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8" />
              No articles match.
            </div>
          )}
        </div>
      )}
    </div>
  )
}