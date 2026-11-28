import { useState, useEffect, useCallback } from 'react'

interface ReadingStreak {
  current: number
  longest: number
  lastDate: string | null
}

const STREAK_KEY = 'cq_read_streak'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0] ?? ''
}

export function useReadingStreak(): ReadingStreak & { recordReading: () => void } {
  const [streak, setStreak] = useState<ReadingStreak>(() => {
    if (typeof window === 'undefined') return { current: 0, longest: 0, lastDate: null }
    try {
      const stored = localStorage.getItem(STREAK_KEY)
      return stored ? JSON.parse(stored) : { current: 0, longest: 0, lastDate: null }
    } catch {
      return { current: 0, longest: 0, lastDate: null }
    }
  })

  const recordReading = useCallback(() => {
    const today = getTodayString()
    const yesterday = getYesterdayString()

    setStreak(prev => {
      if (prev.lastDate === today) return prev // Already recorded today

      let newCurrent = 1
      if (prev.lastDate === yesterday) {
        newCurrent = prev.current + 1
      }

      const newLongest = Math.max(newCurrent, prev.longest)
      return {
        current: newCurrent,
        longest: newLongest,
        lastDate: today,
      }
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
    } catch {
      // Ignore storage errors
    }
  }, [streak])

  return { ...streak, recordReading }
}

export function getReadingStreak(): ReadingStreak {
  if (typeof window === 'undefined') return { current: 0, longest: 0, lastDate: null }
  try {
    const stored = localStorage.getItem(STREAK_KEY)
    return stored ? JSON.parse(stored) : { current: 0, longest: 0, lastDate: null }
  } catch {
    return { current: 0, longest: 0, lastDate: null }
  }
}