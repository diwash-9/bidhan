/**
 * Local-only reading state for Study mode. Guests have no account, so clause
 * progress, bookmarks and preferences are stored in this browser instead.
 * Game progress is never touched.
 */

const CLAUSES_KEY = 'cq_read_clauses'
const SAVED_KEY = 'cq_saved_articles'
const COMPLETED_KEY = 'cq_read_finished'
const LAST_KEY = 'cq_last_article'
const FONT_KEY = 'cq_reader_font'

export type ReaderFont = 'small' | 'normal' | 'large'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be disabled (private browsing) — reading still works.
  }
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage failures.
  }
}

export function getReadClauses(articleId: string): number[] {
  const all = readJson<Record<string, number[]>>(CLAUSES_KEY, {})
  return all[articleId] ?? []
}

export function toggleReadClause(articleId: string, clauseId: number): number[] {
  const all = readJson<Record<string, number[]>>(CLAUSES_KEY, {})
  const current = all[articleId] ?? []
  const next = current.includes(clauseId) ? current.filter((id) => id !== clauseId) : [...current, clauseId]
  all[articleId] = next
  writeJson(CLAUSES_KEY, all)
  return next
}

export function getSavedArticles(): string[] {
  return readJson<string[]>(SAVED_KEY, [])
}

export function toggleSavedArticle(articleId: string): string[] {
  const current = getSavedArticles()
  const next = current.includes(articleId)
    ? current.filter((id) => id !== articleId)
    : [articleId, ...current]
  writeJson(SAVED_KEY, next)
  return next
}

export function getFinishedArticles(): string[] {
  return readJson<string[]>(COMPLETED_KEY, [])
}

export function markArticleFinished(articleId: string): void {
  const current = getFinishedArticles()
  if (!current.includes(articleId)) writeJson(COMPLETED_KEY, [articleId, ...current])
}

export function getLastArticle(): string | null {
  return readString(LAST_KEY)
}

export function setLastArticle(articleId: string): void {
  writeString(LAST_KEY, articleId)
}

export function getReaderFont(): ReaderFont {
  const value = readString(FONT_KEY)
  return value === 'small' || value === 'large' ? value : 'normal'
}

export function setReaderFont(font: ReaderFont): void {
  writeString(FONT_KEY, font)
}
