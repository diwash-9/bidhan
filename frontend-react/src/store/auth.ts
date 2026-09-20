import { create } from 'zustand'

import { api, clearTokens, saveTokens } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  restore: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, displayName: string) => Promise<User>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  restore: async () => {
    try {
      const user = await api.me()
      set({ user, loading: false })
    } catch {
      clearTokens()
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const pair = await api.login(email, password)
    saveTokens(pair)
    const user = await api.me()
    set({ user, loading: false })
    return user
  },

  register: async (email, password, displayName) => {
    const pair = await api.register(email, password, displayName)
    saveTokens(pair)
    const user = await api.me()
    set({ user, loading: false })
    return user
  },

  logout: () => {
    clearTokens()
    set({ user: null })
  },
}))