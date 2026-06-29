import { useEffect, useState } from 'react'

interface Badge {
  id: string; label: string; description: string; threshold: string; achieved: boolean
}
interface EligibleBadge {
  id: string; label: string; description: string; gap: string; current: number
}
interface Props {
  earned: Badge[]
  eligible: EligibleBadge[]
}

const BADGE_ICONS: Record<string, string> = {
  cache_master:       '◈',
  deep_worker:        '◉',
  agentic_builder:    '⬡',
  mcp_pioneer:        '⬢',
  multi_platform_ai:  '◎',
  vertical_specialist:'◆',
  early_adopter:      '◇',
  high_volume_executor:'▲',
  token_titan:        '▽',
  tdd_practitioner:   '○',
}

export default function BadgeGrid({ earned, eligible }: Props) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {earned.map((b, i) => (
          <div
            key={b.id}
            title={`${b.description}\n\nThreshold: ${b.threshold}`}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border
              border-passport-accent/30 cursor-default
              hover:border-passport-accent/60 hover:bg-passport-accent/15 transition-colors"
            style={{
              background: 'rgba(139,92,246,0.08)',
              opacity:    visible ? 1 : 0,
              transform:  visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)',
              transition: `opacity 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms,
                           transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms`,
            }}
          >
            <span className="text-passport-accent2 text-sm leading-none">
              {BADGE_ICONS[b.id] ?? '◦'}
            </span>
            <span className="text-sm font-medium text-passport-text">{b.label}</span>
          </div>
        ))}
      </div>

      {eligible.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-3">
            Next to unlock
          </p>
          <div className="flex flex-wrap gap-2">
            {eligible.map((b) => (
              <div
                key={b.id}
                title={`${b.description}\n\n${b.gap}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-passport-border
                  text-passport-muted text-xs cursor-default hover:border-passport-dim transition-colors"
              >
                <span className="opacity-40">{BADGE_ICONS[b.id] ?? '◦'}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
