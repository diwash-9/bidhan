import { useEffect, useRef, useState } from 'react'

interface Props {
  refillAt: string | null
  onExpire?: () => void
  className?: string
}

function msUntil(refillAt: string): number {
  return new Date(refillAt).getTime() - Date.now()
}

function format(totalMs: number): string {
  const total = Math.max(0, Math.floor(Math.max(0, totalMs) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function RefillCountdown({ refillAt, onExpire, className }: Props) {
  const [remaining, setRemaining] = useState(() => (refillAt ? msUntil(refillAt) : 0))
  const fired = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!refillAt) return
    setRemaining(msUntil(refillAt))
    fired.current = false
    const id = window.setInterval(() => setRemaining(msUntil(refillAt)), 1000)
    return () => window.clearInterval(id)
  }, [refillAt])

  useEffect(() => {
    if (refillAt && remaining <= 0 && !fired.current) {
      fired.current = true
      onExpireRef.current?.()
    }
  }, [refillAt, remaining])

  if (!refillAt) return null
  return <span className={className}>{format(remaining)}</span>
}