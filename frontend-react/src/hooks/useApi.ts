import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: api.getParts,
    staleTime: Infinity,
  })
}

export function useArticles(partNumber: number | null) {
  return useQuery({
    queryKey: ['articles', partNumber],
    queryFn: () => api.getArticles(partNumber as number),
    enabled: partNumber != null,
  })
}

export function useArticle(articleId: string | null) {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.getArticle(articleId as string),
    enabled: !!articleId,
  })
}

export function useQuiz(articleId: string | null) {
  return useQuery({
    queryKey: ['quiz', articleId],
    queryFn: () => api.getQuiz(articleId as string),
    enabled: !!articleId,
  })
}

export function useUserProgress() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['progress', userId],
    queryFn: () => api.getUserProgress(userId as string),
    enabled: !!userId,
  })
}

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getLeaderboard(limit),
  })
}

export function useCompleteArticle() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: (articleId: string) => api.completeArticle(userId as string, articleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress'] })
      void queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export function useAttemptQuestion() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  return useMutation({
    mutationFn: ({ questionId, selectedOption }: { questionId: number; selectedOption: string }) =>
      api.attemptQuestion(userId as string, questionId, selectedOption),
    onSuccess: (result) => {
      if (result.is_correct) {
        void queryClient.invalidateQueries({ queryKey: ['progress'] })
      }
    },
  })
}