import { useState, useEffect, useCallback } from 'react'

const FOCUS_KEY = 'cq_reader_focus'
const SKIM_KEY = 'cq_reader_skim'

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(FOCUS_KEY) === 'true'
  })
  const [isSkimMode, setIsSkimMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SKIM_KEY) === 'true'
  })
  const [currentClauseIndex, setCurrentClauseIndex] = useState(0)

  useEffect(() => {
    localStorage.setItem(FOCUS_KEY, String(isFocusMode))
  }, [isFocusMode])

  useEffect(() => {
    localStorage.setItem(SKIM_KEY, String(isSkimMode))
    // Exit focus mode when entering skim mode
    if (isSkimMode && isFocusMode) {
      setIsFocusMode(false)
    }
  }, [isSkimMode, isFocusMode])

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const next = !prev
      if (next && isSkimMode) setIsSkimMode(false)
      return next
    })
    if (!isFocusMode) setCurrentClauseIndex(0)
  }, [isSkimMode])

  const toggleSkimMode = useCallback(() => {
    setIsSkimMode(prev => {
      const next = !prev
      if (next && isFocusMode) setIsFocusMode(false)
      return next
    })
  }, [isFocusMode])

  const nextClause = useCallback((maxClauses: number) => {
    setCurrentClauseIndex(prev => Math.min(prev + 1, maxClauses - 1))
  }, [])

  const prevClause = useCallback(() => {
    setCurrentClauseIndex(prev => Math.max(prev - 1, 0))
  }, [])

  const goToClause = useCallback((index: number) => {
    setCurrentClauseIndex(index)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isFocusMode) return

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      
      if (e.key === 'ArrowRight' || e.key === 'j' || e.key === ' ') {
        e.preventDefault()
        // nextClause will be called by parent with maxClauses
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault()
        // prevClause called by parent
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsFocusMode(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFocusMode])

  return {
    isFocusMode,
    isSkimMode,
    currentClauseIndex,
    setCurrentClauseIndex,
    toggleFocusMode,
    toggleSkimMode,
    nextClause,
    prevClause,
    goToClause,
  }
}