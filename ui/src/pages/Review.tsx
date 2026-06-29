import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PassportProfile } from '../types/profile'
import ScoreRing from '../components/ScoreRing'
import RadarChart from '../components/RadarChart'
import BadgeGrid from '../components/BadgeGrid'
import SpecialtyCard from '../components/SpecialtyCard'
import StrengthBar from '../components/StrengthBar'
import ShareButtons from '../components/ShareButtons'
import { decodeProfileFromHash } from '../utils/shareCard'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-mono text-xs font-medium text-passport-accent/70 select-none">§ {n}</span>
      <h2 className="text-lg font-semibold text-passport-text tracking-tight">{title}</h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #24224a, transparent)' }} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-passport-card border border-passport-border rounded-xl p-4
      hover:border-passport-accent/30 transition-colors group">
      <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-2">{label}</p>
      <p className="text-2xl font-bold text-passport-text tabular-nums">{value}</p>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function Review() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PassportProfile | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('passport_profile')
    if (raw) { setProfile(JSON.parse(raw)); return }
    // Shareable link: profile encoded in URL fragment
    const fromHash = decodeProfileFromHash(window.location.hash)
    if (fromHash) { setProfile(fromHash); return }
    navigate('/')
  }, [navigate])

  if (!profile) return null

  const {
    summary, verified_experience: ve, tool_usage: tu,
    development_patterns: dp, specialties, strengths, badges, metadata,
  } = profile

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `passport_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Normalize top tools for relative bars
  const topTools   = (tu.top_tools_ranked ?? []).slice(0, 9)
  const maxToolPct = Math.max(...topTools.map(t => t.pct), 1)

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-passport-border/40"
        style={{ background: 'linear-gradient(to bottom, #0f0a1e 0%, #0a0912 100%)' }}
      >
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob absolute rounded-full"
            style={{
              width: 700, height: 700, top: '-260px', left: '-80px',
              background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)',
              '--blob-duration': '10s',
            } as React.CSSProperties}
          />
          <div className="blob absolute rounded-full"
            style={{
              width: 400, height: 400, top: '0px', right: '-60px',
              background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)',
              '--blob-duration': '13s', animationDelay: '-4s',
            } as React.CSSProperties}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center gap-12">

            {/* Score ring */}
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <ScoreRing score={summary.ai_engineering_score} size={190} />
              <p className="text-[11px] font-medium text-passport-muted uppercase tracking-[0.14em] text-center">
                AI Engineering Score<br />
                <span className="capitalize text-passport-accent2/70">{summary.analysis_quality} confidence</span>
              </p>
            </div>

            {/* Headline + stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h1 className="text-3xl font-bold text-passport-text tracking-tight">
                  AI Capability Passport
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ShareButtons profile={profile} />
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-white
                      border border-passport-accent/50 hover:bg-passport-accent/20 transition-colors"
                    style={{ background: 'rgba(124,58,237,0.15)', backdropFilter: 'blur(8px)' }}
                  >
                    Export
                  </button>
                </div>
              </div>
              <p className="text-passport-muted text-sm mb-6">
                {ve.project_count} projects · {summary.sessions_analyzed} sessions ·{' '}
                {metadata.analysis_period.days} days · v{metadata.schema_version}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Sessions"        value={summary.sessions_analyzed} />
                <StatCard label="Avg session"     value={`${ve.development_sessions.avg_active_duration_minutes}m`} />
                <StatCard label="Avg turns"       value={ve.development_sessions.avg_turns_per_session} />
                <StatCard label="Output tokens"   value={fmt(ve.token_scale.total_output_tokens)} />
                <StatCard label="Cache read"      value={fmt(ve.token_scale.total_cache_read_tokens)} />
                <StatCard label="Cache efficiency" value={`${ve.token_scale.context_window_efficiency_pct}%`} />
              </div>
            </div>
          </div>

          {/* Score rationale pull-quote */}
          <div className="mt-10 pl-5 border-l-2 border-passport-accent/30">
            <p className="text-sm text-passport-muted leading-relaxed max-w-3xl">
              {summary.score_rationale}
            </p>
          </div>
        </div>
      </header>

      {/* ── SECTIONS ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* § 1 — Behavioral Fingerprint */}
        <section>
          <SectionHeader n={1} title="Behavioral Fingerprint" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Radar chart */}
            <div className="flex flex-col items-center bg-passport-card border border-passport-border
              rounded-2xl p-6">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-4 self-start">
                Tool category distribution
              </p>
              <RadarChart data={tu.category_breakdown_pct} size={230} />
            </div>

            {/* Top tools */}
            <div className="bg-passport-card border border-passport-border rounded-2xl p-6">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-5">
                Top tool invocations
              </p>
              {topTools.map((tool) => (
                <div key={tool.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="w-36 text-xs text-passport-muted font-mono truncate flex-shrink-0">
                    {tool.name}
                  </span>
                  <div className="flex-1 bg-passport-dim rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(tool.pct / maxToolPct) * 100}%`,
                        background: 'linear-gradient(to right, #7c3aed, #a78bfa)',
                        transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-passport-accent2 w-10 text-right flex-shrink-0">
                    {tool.pct}%
                  </span>
                </div>
              ))}

              {/* Models */}
              <div className="mt-6 pt-5 border-t border-passport-border">
                <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-3">
                  Models used
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tu.models_used.map(m => (
                    <span key={m}
                      className="px-2 py-1 rounded-lg border border-passport-border bg-passport-surface
                        text-[10px] font-mono text-passport-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* § 2 — Domain Expertise */}
        <section>
          <SectionHeader n={2} title="Domain Expertise" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialties.map((s, i) => (
              <SpecialtyCard key={s.domain} {...s} index={i} />
            ))}
          </div>
        </section>

        {/* § 3 — Core Capabilities */}
        <section>
          <SectionHeader n={3} title="Core Capabilities" />
          <div className="bg-passport-card border border-passport-border rounded-2xl p-6">
            {strengths.map((s, i) => (
              <StrengthBar key={s.capability} {...s} index={i} />
            ))}
          </div>
        </section>

        {/* § 4 — Recognition */}
        <section>
          <SectionHeader n={4} title="Recognition" />
          <div className="bg-passport-card border border-passport-border rounded-2xl p-6">
            <BadgeGrid earned={badges.earned} eligible={badges.eligible} />
          </div>
        </section>

        {/* § 5 — Development Methodology */}
        <section>
          <SectionHeader n={5} title="Development Methodology" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Refactoring',
                score: dp.refactoring.frequency,
                rationale: dp.refactoring.rationale,
                confidence: dp.refactoring.confidence,
                meta: `Edit/Write ratio ${dp.refactoring.edit_to_write_ratio}`,
              },
              {
                label: 'Debugging',
                score: dp.debugging.systematic_approach,
                rationale: dp.debugging.rationale,
                confidence: dp.debugging.confidence,
                meta: `${dp.debugging.iterations_per_session} exec iterations/session`,
              },
              {
                label: 'Testing',
                score: dp.testing.tdd_indicator ?? null,
                rationale: dp.testing.rationale,
                confidence: dp.testing.confidence,
                meta: null,
              },
            ].map(({ label, score, rationale, confidence, meta }) => (
              <div key={label}
                className="bg-passport-card border border-passport-border rounded-2xl p-5
                  hover:border-passport-accent/20 transition-colors">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-sm font-semibold text-passport-text">{label}</p>
                  {score !== null
                    ? <span className="text-sm font-bold text-passport-accent2">{score}<span className="text-passport-muted font-normal">/100</span></span>
                    : <span className="text-[10px] text-passport-muted bg-passport-surface px-2 py-0.5 rounded-full">
                        insufficient data
                      </span>
                  }
                </div>
                {meta && <p className="text-[10px] font-mono text-passport-accent/60 mb-3">{meta}</p>}
                <p className="text-xs text-passport-muted leading-relaxed mt-2">{rationale}</p>
                <p className="text-[10px] text-passport-dim mt-3 capitalize">
                  confidence: <span className="text-passport-muted">{confidence}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Production signals */}
          {ve.tools_built.length > 0 && (
            <div className="mt-4 bg-passport-card border border-passport-border rounded-2xl p-5">
              <p className="text-[10px] font-medium text-passport-muted uppercase tracking-[0.12em] mb-3">
                Tools & integrations built
              </p>
              <div className="flex flex-wrap gap-2">
                {ve.tools_built.map(t => (
                  <span key={t}
                    className="px-3 py-1.5 rounded-xl border border-passport-accent/25 bg-passport-accent/8
                      text-xs font-medium text-passport-accent2"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {ve.production_indicators.probable_production_work && (
                <p className="text-xs text-passport-muted leading-relaxed mt-4">
                  {ve.production_indicators.rationale}
                </p>
              )}
            </div>
          )}
        </section>

      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-passport-border/40 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-passport-muted text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Generated from behavioral metadata only — no prompts, source code, or file contents were accessed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleExport}
              className="px-8 py-3 rounded-xl text-sm font-medium text-white transition-all
                hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}
            >
              Approve & Export
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl text-sm font-medium text-passport-muted border
                border-passport-border hover:border-passport-accent/40 transition-colors"
            >
              Load different profile
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}
