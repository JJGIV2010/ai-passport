import { useEffect, useState } from 'react'

interface Props {
  data: Record<string, number>
  size?: number
}

const LABELS: Record<string, string> = {
  read: 'Read', exec: 'Exec', write: 'Write',
  plan: 'Plan', agent: 'Agent', web: 'Web', other: 'Other',
}

export default function RadarChart({ data, size = 220 }: Props) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 350)
    return () => clearTimeout(t)
  }, [])

  const cx   = size / 2
  const cy   = size / 2
  const maxR = size * 0.34

  const keys = Object.keys(data)
  const n    = keys.length
  const ang  = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2

  const dataPt = (i: number, pct: number) => ({
    x: cx + maxR * (pct / 100) * Math.cos(ang(i)),
    y: cy + maxR * (pct / 100) * Math.sin(ang(i)),
  })

  const axisPt = (i: number, frac = 1) => ({
    x: cx + maxR * frac * Math.cos(ang(i)),
    y: cy + maxR * frac * Math.sin(ang(i)),
  })

  const dataPoints = keys.map((k, i) => dataPt(i, data[k]))
  const polyStr    = dataPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  // Perimeter for stroke-dashoffset draw animation
  const perimeter = dataPoints.reduce((sum, p, i) => {
    const q = dataPoints[(i + 1) % n]
    return sum + Math.hypot(q.x - p.x, q.y - p.y)
  }, 0)

  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map(r => {
        const pts = keys
          .map((_, i) => { const p = axisPt(i, r); return `${p.x.toFixed(2)},${p.y.toFixed(2)}` })
          .join(' ')
        return (
          <polygon key={r} points={pts} fill="none"
            stroke={r === 1 ? '#2d2b4a' : '#24224a'} strokeWidth={r === 1 ? 1.5 : 1}
          />
        )
      })}

      {/* Axis spokes */}
      {keys.map((_, i) => {
        const p = axisPt(i)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#24224a" strokeWidth={1} />
      })}

      {/* Data fill — fades in after stroke draws */}
      <polygon
        points={polyStr}
        fill="#7c3aed"
        fillOpacity={drawn ? 0.14 : 0}
        stroke="none"
        style={{ transition: 'fill-opacity 0.9s ease 1s' }}
      />

      {/* Data stroke — draws in with dashoffset */}
      <polygon
        points={polyStr}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeDasharray={perimeter}
        strokeDashoffset={drawn ? 0 : perimeter}
        style={{
          transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)',
          filter: 'drop-shadow(0 0 5px rgba(139,92,246,0.7))',
        }}
      />

      {/* Data point dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#a78bfa"
          opacity={drawn ? 1 : 0}
          style={{ transition: `opacity 0.3s ease ${1.2 + i * 0.05}s` }}
        />
      ))}

      {/* Labels */}
      {keys.map((k, i) => {
        const p = axisPt(i, 1.28)
        const val = data[k]
        return (
          <g key={k}>
            <text x={p.x} y={p.y - 6} textAnchor="middle" dominantBaseline="middle"
              fill="#7c7a9f" fontSize={9.5} fontFamily="Inter, system-ui, sans-serif" fontWeight={500}
            >
              {LABELS[k] ?? k}
            </text>
            <text x={p.x} y={p.y + 8} textAnchor="middle" dominantBaseline="middle"
              fill="#a78bfa" fontSize={8.5} fontFamily="Inter, system-ui, sans-serif"
            >
              {val}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
