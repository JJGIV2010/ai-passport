import { useEffect, useState } from 'react'

interface Props {
  domain: string
  confidence: number
  evidence: string
  index?: number
}

export default function SpecialtyCard({ domain, confidence, evidence, index = 0 }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence), 300 + index * 80)
    return () => clearTimeout(t)
  }, [confidence, index])

  const borderColor =
    confidence >= 85 ? 'border-passport-accent/30' :
    confidence >= 65 ? 'border-passport-accent/20' :
    'border-passport-border'

  const dotColor =
    confidence >= 85 ? '#a78bfa' :
    confidence >= 65 ? '#8b5cf6' :
    '#7c7a9f'

  return (
    <div className={`rounded-2xl border ${borderColor} bg-passport-card p-5 hover:border-passport-accent/50 transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-medium text-sm text-passport-text leading-snug">{domain}</span>
        <span
          className="flex-shrink-0 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
          style={{ color: dotColor, background: `${dotColor}18`, border: `1px solid ${dotColor}40` }}
        >
          {confidence}%
        </span>
      </div>

      {/* Animated confidence bar */}
      <div className="w-full bg-passport-dim rounded-full h-[3px] mb-4 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right, #7c3aed, #a78bfa)`,
            boxShadow: `0 0 8px rgba(139,92,246,0.5)`,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      <p className="text-xs text-passport-muted leading-relaxed">{evidence}</p>
    </div>
  )
}
