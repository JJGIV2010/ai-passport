import { useEffect, useState } from 'react'

interface Props {
  score: number
  size?: number
}

export default function ScoreRing({ score, size = 180 }: Props) {
  const [drawn, setDrawn]         = useState(false)
  const [display, setDisplay]     = useState(0)

  const stroke    = 10
  const radius    = (size - stroke * 2) / 2
  const circ      = 2 * Math.PI * radius
  const offset    = drawn ? circ - (score / 100) * circ : circ

  const color =
    score >= 75 ? '#a78bfa' :
    score >= 50 ? '#fbbf24' : '#f87171'
  const glow =
    score >= 75 ? 'rgba(124,58,237,0.35)' :
    score >= 50 ? 'rgba(217,119,6,0.35)' : 'rgba(220,38,38,0.35)'

  // Trigger ring draw + count-up on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true))

    let startTs: number | null = null
    const duration = 1400
    const step = (ts: number) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf2 = requestAnimationFrame(step)

    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(raf2) }
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient glow blob */}
      <div
        className="absolute inset-0 rounded-full animate-glow-pulse"
        style={{ background: `radial-gradient(circle at center, ${glow} 0%, transparent 68%)` }}
      />

      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#24224a" strokeWidth={stroke} fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center leading-none select-none">
        <span
          className="font-bold tabular-nums glow-text"
          style={{ fontSize: size * 0.23, color, lineHeight: 1 }}
        >
          {display}
        </span>
        <span className="text-xs font-medium mt-1" style={{ color: '#7c7a9f' }}>/ 100</span>
      </div>
    </div>
  )
}
