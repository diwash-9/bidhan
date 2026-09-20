const MUTE_KEY = 'cq_sound_muted'

let ctx: AudioContext | null = null

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore storage errors */
  }
}

interface ToneOptions {
  freq: number
  start: number
  dur: number
  type?: OscillatorType
  gain?: number
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone({ freq, start, dur, type = 'sine', gain = 0.16 }: ToneOptions) {
  const c = ensureCtx()
  if (!c) return
  const osc = c.createOscillator()
  const amp = c.createGain()
  const t = c.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(amp)
  amp.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

export function sfxCorrect() {
  if (isSoundMuted()) return
  tone({ freq: 523.25, start: 0, dur: 0.15 })
  tone({ freq: 659.25, start: 0.09, dur: 0.16 })
  tone({ freq: 783.99, start: 0.18, dur: 0.3, gain: 0.2 })
}

export function sfxWrong() {
  if (isSoundMuted()) return
  tone({ freq: 196, start: 0, dur: 0.18, type: 'sawtooth', gain: 0.09 })
  tone({ freq: 155.56, start: 0.13, dur: 0.28, type: 'sawtooth', gain: 0.09 })
}

export function sfxComplete() {
  if (isSoundMuted()) return
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => tone({ freq, start: i * 0.12, dur: 0.28, gain: 0.2 }))
}