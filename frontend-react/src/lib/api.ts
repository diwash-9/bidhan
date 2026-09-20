import type {
  ArticleDetail,
  ArticleSummary,
  CompleteResult,
  LeaderboardEntry,
  Part,
  QuizQuestion,
  QuizResult,
  TokenPair,
  User,
  UserProgress,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const TOKEN_KEY = 'cq_access_token'
const REFRESH_KEY = 'cq_refresh_token'

export class ApiError extends Error {
  status: number
  detail?: string
  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

export interface TokenStore {
  access: string | null
  refresh: string | null
}

function tokens(): TokenStore {
  return {
    access: localStorage.getItem(TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  }
}

export function saveTokens(pair: TokenPair) {
  localStorage.setItem(TOKEN_KEY, pair.access_token)
  localStorage.setItem(REFRESH_KEY, pair.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) }
  const { access } = tokens()
  if (access) headers.Authorization = `Bearer ${access}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = await res.json()
      detail = body.detail ?? res.statusText
    } catch {
      detail = res.statusText
    }
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`, detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  base: API_BASE,

  async register(email: string, password: string, displayName: string): Promise<TokenPair> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, display_name: displayName }) })
  },
  async login(email: string, password: string): Promise<TokenPair> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async refresh(refreshToken: string): Promise<TokenPair> {
    return request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) })
  },
  me(): Promise<User> {
    return request('/auth/me')
  },

  getParts(): Promise<Part[]> {
    return request('/parts')
  },
  getArticles(partNumber: number): Promise<ArticleSummary[]> {
    return request(`/parts/${partNumber}/articles`)
  },
  getArticle(id: string): Promise<ArticleDetail> {
    return request(`/articles/${id}`)
  },
  getQuiz(articleId: string): Promise<QuizQuestion[]> {
    return request(`/articles/${articleId}/quiz`)
  },

  getUserProgress(userId: string): Promise<UserProgress> {
    return request(`/users/${userId}/progress`)
  },
  completeArticle(userId: string, articleId: string): Promise<CompleteResult> {
    return request(`/users/${userId}/articles/${articleId}/complete`, { method: 'POST' })
  },
  attemptQuestion(userId: string, questionId: number, selectedOption: string): Promise<QuizResult> {
    return request(`/users/${userId}/quiz/${questionId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, selected_option: selectedOption }),
    })
  },
  getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    return request(`/leaderboard?limit=${limit}`)
  },
}