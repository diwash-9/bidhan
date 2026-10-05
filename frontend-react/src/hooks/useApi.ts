import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { AmendmentPayload } from '@/types'

export function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: api.getParts,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  })
}

export function useArticles(partNumber: number | null) {
  return useQuery({
    queryKey: ['articles', partNumber],
    queryFn: () => api.getArticles(partNumber as number),
    enabled: partNumber != null,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useArticle(articleId: string | null) {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.getArticle(articleId as string),
    enabled: !!articleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useQuiz(articleId: string | null) {
  return useQuery({
    queryKey: ['quiz', articleId],
    queryFn: () => api.getQuiz(articleId as string),
    enabled: !!articleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useUserProgress(partNumber?: number) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['progress', userId, partNumber ?? 'all'],
    queryFn: () => api.getUserProgress(userId as string, partNumber),
    enabled: !!userId,
    // Full 308-row payload: cache aggressively to avoid refetch on every
    // navigation. Invalidated explicitly on lesson complete.
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/** Tiny <0.5KB payload for Header + LessonView polling (hearts/XP/streak). */
export function useProgressSummary(articleId?: string) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['progress-summary', userId, articleId ?? 'none'],
    queryFn: () => api.getProgressSummary(userId as string, articleId),
    enabled: !!userId,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useLeaderboard(limit = 20, window: 'all' | 'week' = 'all') {
  return useQuery({
    queryKey: ['leaderboard', window],
    queryFn: () => api.getLeaderboard(limit, window),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCompleteArticle() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (articleId: string) => api.completeArticle(userId as string, articleId),
    onSuccess: () => {
      // Unlock changes statuses: refresh full progress + part lists + summary.
      // Leaderboard also changes (+15 XP) — refresh it here, not per-answer.
      void queryClient.invalidateQueries({ queryKey: ['progress'] })
      void queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['articles'] })
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

export function useAttemptQuestion() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ questionId, selectedOption, practice = false }: { questionId: number; selectedOption: string; practice?: boolean }) =>
      api.attemptQuestion(userId as string, questionId, selectedOption, practice),
    onSuccess: () => {
      // Do NOT invalidate ['progress'] here: it refetches the 308-row payload
      // on every single answer (was the per-question 15s stall). Hearts/XP
      // refresh via the lightweight summary; full progress refreshes on
      // lesson complete only.
      void queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })
}

export function useHeart() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: () => api.useHeart(userId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function useAdminArticles(partNumber?: number, q?: string) {
  return useQuery({
    queryKey: ['admin-articles', partNumber, q],
    queryFn: () => api.adminListArticles(partNumber, q),
  })
}

export function useAdminArticle(articleId: string | null) {
  return useQuery({
    queryKey: ['admin-article', articleId],
    queryFn: () => api.adminGetArticle(articleId as string),
    enabled: !!articleId,
  })
}

export function useAdminRevisions(articleId?: string) {
  return useQuery({
    queryKey: ['admin-revisions', articleId],
    queryFn: () => api.adminListRevisions(articleId),
  })
}

export function useAmendArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ articleId, payload }: { articleId: string; payload: AmendmentPayload }) =>
      api.amendArticle(articleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-article'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-revisions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-articles'] })
      void queryClient.invalidateQueries({ queryKey: ['articles'] })
      void queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}

export function useCreateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AmendmentPayload) => api.createArticle(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-revisions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-articles'] })
      void queryClient.invalidateQueries({ queryKey: ['articles'] })
      void queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}