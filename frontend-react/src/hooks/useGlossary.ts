import { useEffect, useState } from 'react'

export interface GlossaryTerm {
  term: string
  definition: string
}

export function useGlossary(): GlossaryTerm[] {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([])

  useEffect(() => {
    fetch('/glossary.json')
      .then(res => res.ok ? res.json() : {})
      .then(data => setGlossary(Object.entries(data).map(([term, definition]) => ({ term, definition: definition as string }))))
      .catch(() => setGlossary([]))
  }, [])

  return glossary
}

// Utility to find glossary terms in text
export function findGlossaryTerms(text: string, glossary: GlossaryTerm[]): Map<string, string> {
  const found = new Map<string, string>()
  const lowerText = text.toLowerCase()
  
  // Sort by length descending to match longer terms first
  const sortedTerms = [...glossary].sort((a, b) => b.term.length - a.term.length)
  
  for (const { term, definition } of sortedTerms) {
    const lowerTerm = term.toLowerCase()
    if (lowerText.includes(lowerTerm)) {
      // Use a more flexible boundary check that works with multi-word terms
      // and handles punctuation
      const escaped = escapeRegExp(lowerTerm)
      // Match at word boundaries OR start/end of string OR next to punctuation
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}(?=[^a-zA-Z0-9_]|$)`, 'gi')
      if (regex.test(text)) {
        found.set(term, definition)
      }
    }
  }
  
  return found
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}