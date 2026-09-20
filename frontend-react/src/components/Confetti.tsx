import { useMemo } from 'react'

const COLORS = ['#dc143c', '#3d6ef6', '#34d399', '#fbbf24', '#a78bfa', '#f472b6']

interface Piece {
  left: number
  delay: number
  duration: number
  color: string
  width: number
  height: number
  rotate: number
}

export default function Confetti({ count = 120 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length] ?? '#dc143c',
        width: 6 + Math.random() * 6,
        height: (6 + Math.random() * 6) * 0.6,
        rotate: Math.random() * 360,
      })),
    [count],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-16px',
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}