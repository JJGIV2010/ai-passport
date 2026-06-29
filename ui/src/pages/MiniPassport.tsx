import { MiniProfile } from '../utils/shareCard'
import ScoreRing from '../components/ScoreRing'

const BADGE_LABELS: Record<string, string> = {
  cache_master:           'Cache Master',
  deep_worker:            'Deep Worker',
  deep_diver:             'Deep Diver',
  agentic_builder:        'Agentic Builder',
  mcp_pioneer:            'MCP Pioneer',
  multi_platform_ai:      'Multi-Platform AI Engineer',
  vertical_specialist:    'Vertical AI Specialist',
  early_adopter:          'Early Adopter',
  high_volume_executor:   'High-Volume Executor',
  high_throughput:        'High Throughput',
  refactor_discipline:    'Refactor Discipline',
  multi_model:            'Multi-Model Practitioner',
}

export default function MiniPassport({ profile }: { profile: MiniProfile }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #0a0912 100%)' }}
    >
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-passport-border bg-passport-card
        shadow-2xl shadow-purple-900/30 overflow-hidden">

        {/* Gradient bar */}
        <div className="h-1.5 w-full" style={{
          background: 'linear-gradient(to right, #0A1628, #6D28D9)',
        }} />

        <div className="p-8">
          {/* Header */}
          <p className="text-[10px] font-semibold text-passport-muted uppercase tracking-[0.16em] mb-6">
            AI Capability Passport
          </p>

          {/* Score */}
          <div className="flex items-center gap-6 mb-8">
            <ScoreRing score={profile.s} size={120} />
            <div>
              <p className="text-3xl font-bold text-passport-text">{profile.s}<span className="text-lg font-normal text-passport-muted">/100</span></p>
              <p className="text-xs text-passport-muted mt-1">AI Engineering Score</p>
              <div className="flex gap-3 mt-3">
                <Stat label="Sessions" value={profile.n} />
                <Stat label="Days" value={profile.d} />
                <Stat label="Cache eff." value={`${profile.ce}%`} />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <MetaStat label="Avg turns" value={profile.t} />
            <MetaStat label="Projects" value={profile.pr} />
            <MetaStat label="Models" value={profile.mo.length} />
          </div>

          {/* Specialties */}
          {profile.sp.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-3">
                Top specialties
              </p>
              <div className="space-y-2">
                {profile.sp.map(([domain, conf]) => (
                  <div key={domain} className="flex items-center justify-between
                    bg-passport-bg rounded-lg px-3 py-2">
                    <span className="text-xs text-passport-text truncate mr-3">{domain}</span>
                    <span className="text-[10px] font-medium text-passport-accent flex-shrink-0">
                      {conf}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {profile.b.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-3">
                Earned badges
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.b.map(id => (
                  <span key={id}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full
                      bg-passport-accent/10 text-passport-accent border border-passport-accent/20">
                    {BADGE_LABELS[id] ?? id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Models */}
          {profile.mo.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-2">
                Models used
              </p>
              <p className="text-xs text-passport-muted">{profile.mo.join('  ·  ')}</p>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-passport-border pt-6 text-center">
            <p className="text-xs text-passport-muted mb-3">
              Privacy-first · behavioral metadata only · no prompts accessed
            </p>
            <a href="https://aipassport.web.app"
              className="inline-block px-5 py-2.5 rounded-lg text-xs font-semibold text-white
                transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0A1628, #6D28D9)' }}
            >
              Generate your passport
            </a>
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div className="h-1.5 w-full" style={{
          background: 'linear-gradient(to right, #0A1628, #6D28D9)',
        }} />
      </div>

      <p className="mt-6 text-[11px] text-passport-muted/50">
        aipassport.web.app
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-passport-text tabular-nums">{value}</p>
      <p className="text-[9px] text-passport-muted uppercase tracking-wide">{label}</p>
    </div>
  )
}

function MetaStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-passport-bg rounded-lg px-3 py-2.5 text-center">
      <p className="text-sm font-bold text-passport-text tabular-nums">{value}</p>
      <p className="text-[9px] font-medium text-passport-muted uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
