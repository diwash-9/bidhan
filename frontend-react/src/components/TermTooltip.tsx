import { useState, useRef } from 'react'

interface TermTooltipProps {
  children: React.ReactNode
  term: string
  definition: string
}

export default function TermTooltip({ children, term, definition }: TermTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const showTooltip = (_e: React.MouseEvent | React.TouchEvent) => {
    if (!wrapperRef.current || !tooltipRef.current) return
    
    const rect = wrapperRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    
    // Position above the term, centered
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    let top = rect.top - tooltipRect.height - 8
    
    // Keep within viewport
    const padding = 12
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) {
      top = rect.bottom + 8
    }
    
    setPosition({ top, left })
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  // Handle touch events for mobile
  const handleTouchStart = (_e: React.TouchEvent) => {
    _e.preventDefault()
    showTooltip(_e)
  }

  const handleTouchEnd = (_e: React.TouchEvent) => {
    _e.preventDefault()
    // Hide after a delay to allow reading
    setTimeout(hideTooltip, 3000)
  }

  return (
    <>
      <span
        ref={wrapperRef}
        className="relative underline underline-dotted underline-offset-2 decoration-royal-400/50 hover:decoration-royal-400 cursor-help"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-describedby={`tooltip-${term.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {children}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={`tooltip-${term.replace(/\s+/g, '-').toLowerCase()}`}
          role="tooltip"
          className="fixed z-50 max-w-xs px-4 py-3 rounded-xl bg-slate-900 border border-royal-800 shadow-2xl text-sm text-slate-200 pointer-events-none animate-fade-in"
          style={{ top: position.top, left: position.left }}
        >
          <p className="font-bold text-white mb-1">{term}</p>
          <p className="text-slate-300">{definition}</p>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-3 border-transparent border-t-royal-800" />
        </div>
      )}
    </>
  )
}