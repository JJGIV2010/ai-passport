import { useEffect, useState } from 'react'

interface Props {
  capability: string
  score: number
  indicator: string
  index?: number
}

export default function StrengthBar({ capability, score, indicator, index = 0 }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 200 + index * 100)
    return () => clearTimeout(t)
  }, [score, index])

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-passport-text">{capability}</span>
        <span className="text-sm font-bold tabular-nums text-passport-accent2">{score}</span>
      </div>

      <div className="w-full bg-passport-dim rounded-full h-1.5 overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(to right, #7c3aed, #a78bfa, #c4b5fd)',
            boxShadow: '0 0 10px rgba(139,92,246,0.45)',
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      <p className="text-xs text-passport-muted leading-relaxed">{indicator}</p>
    </div>
  )
}
