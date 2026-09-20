export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  display_name: string
  role: string
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

export interface HeartsState {
  hearts_left: number
  max_hearts: number
  refill_at: string | null
}

export interface UserProgress {
  user_id: string
  display_name: string
  current_streak: number
  longest_streak: number
  total_xp: number
  last_active_date: string | null
  hearts_left: number
  max_hearts: number
  hearts_refill_at: string | null
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

// --- Admin ---

export interface AdminQuizQuestion {
  id: number | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string | null
  difficulty: number
  knowledge_type: string
  active: boolean
}

export interface AdminClause {
  clause_number: number
  content: string
  sub_clauses: SubClause[]
}

export interface AdminArticle {
  id: string
  article_number: number
  title: string
  part_number: number
  part_title: string
  difficulty_score: number
  estimated_xp: number
  clauses: AdminClause[]
  dependencies: Dependency[]
  quiz: AdminQuizQuestion[]
}

export interface ArticleEditorState {
  article: {
    article_number: number
    title: string
    part_number: number
    part_title: string
    difficulty_score: number
    estimated_xp: number
  }
  clauses: AdminClause[]
  dependencies: Dependency[]
  quiz: AdminQuizQuestion[]
}

export interface RevisionMeta {
  amendment_date: string | null
  amendment_act: string | null
  summary: string | null
}

export interface AmendmentPayload extends ArticleEditorState {
  revision: RevisionMeta
}

export interface Revision {
  id: number
  article_id: string
  changed_by: string
  amendment_date: string | null
  amendment_act: string | null
  summary: string | null
  created_at: string
}

export interface AmendResult {
  status: string
  article_id: string
  revision_id: number | null
}