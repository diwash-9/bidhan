export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
  current_streak: number
  longest_streak: number
  total_xp: number
  last_active_date: string | null
}

export interface Part {
  part_number: number
  part_title: string
}

export type ArticleStatus = 'locked' | 'unlocked' | 'completed'

export interface ArticleSummary {
  id: string
  article_number: number
  title: string
  part_number: number
  part_title: string
  difficulty_score: number
  estimated_xp: number
  status: ArticleStatus
  stars: number
}

export interface SubClause {
  identifier: string
  content: string
}

export interface Clause {
  id: number
  clause_number: number
  content: string
  sub_clauses: SubClause[]
}

export interface Dependency {
  target_id: string
  relation_type: string
}

export interface ArticleDetail {
  id: string
  article_number: number
  title: string
  part_number: number
  part_title: string
  clauses: Clause[]
  dependencies: Dependency[]
}

export interface QuizQuestion {
  id: number
  article_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  difficulty: number
  knowledge_type: string
}

export interface QuizResult {
  question_id: number
  selected_option: string
  is_correct: boolean
  correct_option: string
  explanation: string | null
  xp_earned: number
}

export interface ArticleProgress {
  article_id: string
  status: ArticleStatus
  stars: number
}

export interface UserProgress {
  user_id: string
  display_name: string
  current_streak: number
  longest_streak: number
  total_xp: number
  last_active_date: string | null
  hearts_left: number
  articles: ArticleProgress[]
}

export interface CompleteResult {
  status: string
  xp_earned: number
  unlocked_targets: string[]
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  total_xp: number
  current_streak: number
}