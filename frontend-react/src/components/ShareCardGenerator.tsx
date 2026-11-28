import { useCallback } from 'react'

interface ShareCardData {
  articleNumber: number
  articleTitle: string
  clauseNumber?: number
  clauseText: string
}

export function useShareCard() {
  const generateCard = useCallback(async (data: ShareCardData): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Card dimensions (1200x630 for social sharing)
    const width = 1200
    const height = 630
    canvas.width = width
    canvas.height = height

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0f172a') // slate-950
    gradient.addColorStop(1, '#1e1b4b') // royal-950
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Subtle pattern
    ctx.fillStyle = 'rgba(220, 38, 38, 0.03)'
    for (let x = 0; x < width; x += 60) {
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Top accent bar
    const topGradient = ctx.createLinearGradient(0, 0, width, 0)
    topGradient.addColorStop(0, '#dc2626') // crimson-600
    topGradient.addColorStop(1, '#7c3aed') // royal-600
    ctx.fillStyle = topGradient
    ctx.fillRect(0, 0, width, 6)

    // Brand area
    ctx.font = 'bold 48px Georgia, serif'
    ctx.fillStyle = '#dc2626'
    ctx.textAlign = 'left'
    ctx.fillText('विधान', 80, 110)

    ctx.font = 'bold 48px Georgia, serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Bidhan', 200, 110)

    ctx.font = '16px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8' // slate-400
    ctx.fillText("Nepal's Constitution", 80, 140)

    // Article info
    ctx.font = 'bold 32px Georgia, serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Article ${data.articleNumber}`, 80, 220)

    // Article title (wrapped)
    ctx.font = '24px Georgia, serif'
    ctx.fillStyle = '#e2e8f0' // slate-200
    const titleLines = wrapText(ctx, data.articleTitle, width - 160)
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 80, 270 + i * 36)
    })

    // Clause separator
    const clauseY = 270 + titleLines.length * 36 + 30
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(80, clauseY)
    ctx.lineTo(width - 80, clauseY)
    ctx.stroke()

    // Clause label
    if (data.clauseNumber) {
      ctx.font = 'bold 20px system-ui, sans-serif'
      ctx.fillStyle = '#fca5a5' // red-300
      ctx.fillText(`Clause ${data.clauseNumber}`, 80, clauseY + 35)
    }

    // Clause text (wrapped)
    ctx.font = '22px Georgia, serif'
    ctx.fillStyle = '#f8fafc' // slate-50
    const textLines = wrapText(ctx, data.clauseText, width - 160)
    const maxLines = Math.min(textLines.length, 12)
    textLines.slice(0, maxLines).forEach((line, i) => {
      ctx.fillText(line, 80, clauseY + 70 + i * 34)
    })

    if (textLines.length > maxLines) {
      ctx.font = 'italic 20px Georgia, serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('...', 80, clauseY + 70 + maxLines * 34)
    }

    // Footer
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillStyle = '#64748b' // slate-500
    ctx.textAlign = 'right'
    ctx.fillText('bidhan.app', width - 80, height - 50)

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95)
    })
  }, [])

  const shareCard = useCallback(async (data: ShareCardData) => {
    try {
      const blob = await generateCard(data)
      const file = new File([blob], `bidhan-article-${data.articleNumber}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Article ${data.articleNumber}: ${data.articleTitle}` })
        return
      }

      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bidhan-article-${data.articleNumber}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate share card:', err)
    }
  }, [generateCard])

  return { shareCard }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines
}