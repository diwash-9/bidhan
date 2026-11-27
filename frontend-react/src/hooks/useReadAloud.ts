import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Reads text aloud. The browser's own speech engine is preferred; if it has no
 * voices or fails, playback falls back to an online MP3 voice so reading aloud
 * also works in minimal/headless browser environments.
 */

const MAX_CHARS = 180
const ONLINE_TTS = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q='

type SpeakMode = 'browser' | 'online' | null

function splitText(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text]
  const pieces: string[] = []
  let current = ''
  for (const word of text.split(/\s+/)) {
    if (current && `${current} ${word}`.length > MAX_CHARS) {
      pieces.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) pieces.push(current)
  return pieces
}

export function useReadAloud(lines: string[]) {
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<SpeakMode>(null)
  const voices = useRef<SpeechSynthesisVoice[]>([])
  const audio = useRef<HTMLAudioElement | null>(null)
  const timers = useRef<number[]>([])
  const cancelled = useRef(false)

  const browserSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer)
    timers.current = []
  }, [])

  const finish = useCallback(() => {
    clearTimers()
    setSpeaking(false)
    setMode(null)
  }, [clearTimers])

  const stop = useCallback(() => {
    cancelled.current = true
    clearTimers()
    if (browserSupported) window.speechSynthesis.cancel()
    if (audio.current) {
      audio.current.pause()
      audio.current.removeAttribute('src')
      audio.current.load()
      audio.current = null
    }
    finish()
    setError(null)
  }, [browserSupported, clearTimers, finish])

  const playOnline = useCallback(() => {
    if (cancelled.current || lines.length === 0) return
    setMode('online')
    setError(null)
    const pieces = lines.flatMap(splitText)

    const playNext = () => {
      if (cancelled.current) return
      const piece = pieces.shift()
      if (!piece) {
        finish()
        return
      }
      const element = audio.current ?? new Audio()
      audio.current = element
      element.src = `${ONLINE_TTS}${encodeURIComponent(piece)}`
      element.onended = () => playNext()
      element.onerror = () => {
        if (cancelled.current) return
        setError('Online audio could not load. Check your internet connection.')
        finish()
      }
      void element.play().catch(() => {
        if (cancelled.current) return
        setError('Audio playback was blocked by the browser.')
        finish()
      })
    }
    playNext()
  }, [lines, finish])

  const playBrowser = useCallback(() => {
    if (cancelled.current || !browserSupported || lines.length === 0) return
    setMode('browser')
    const pieces = lines.flatMap(splitText)
    const voice = voices.current.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices.current[0]
    let failed = false
    let watchdog: number | undefined

    const fallback = () => {
      if (failed || cancelled.current) return
      failed = true
      window.speechSynthesis.cancel()
      playOnline()
    }

    pieces.forEach((piece, index) => {
      const utterance = new SpeechSynthesisUtterance(piece)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      if (voice) utterance.voice = voice
      utterance.onstart = () => {
        if (cancelled.current) return
        if (watchdog !== undefined) window.clearTimeout(watchdog)
        setError(null)
      }
      utterance.onerror = (event) => {
        if (event.error === 'interrupted' || event.error === 'canceled') return
        fallback()
      }
      if (index === pieces.length - 1) {
        utterance.onend = () => {
          if (cancelled.current || failed) return
          finish()
        }
      }
      window.speechSynthesis.speak(utterance)
    })
    watchdog = window.setTimeout(fallback, 2500)
    timers.current.push(watchdog)
  }, [browserSupported, lines, playOnline, finish])

  const toggle = useCallback(() => {
    if (speaking) {
      stop()
      return
    }
    if (lines.length === 0) return
    cancelled.current = false
    clearTimers()
    setSpeaking(true)
    setError(null)

    if (!browserSupported) {
      playOnline()
      return
    }
    // Chrome can drop utterances queued in the same tick as cancel().
    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()
    const timer = window.setTimeout(() => playBrowser(), 80)
    timers.current.push(timer)
  }, [speaking, lines, browserSupported, clearTimers, playBrowser, playOnline, stop])

  useEffect(() => {
    if (!browserSupported) return
    const loadVoices = () => {
      voices.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [browserSupported])

  useEffect(() => () => {
    if (browserSupported) window.speechSynthesis.cancel()
    if (audio.current) audio.current.pause()
  }, [browserSupported])

  return useMemo(() => ({ speaking, error, mode, toggle, stop }), [speaking, error, mode, toggle, stop])
}
