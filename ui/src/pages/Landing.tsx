import { useState } from 'react'

function CopyCommand({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="group relative flex items-center gap-3 px-5 py-3 rounded-xl border
        border-passport-border bg-black/40 font-mono text-sm text-[#a78bfa]
        hover:border-passport-accent/50 hover:bg-black/60 transition-all duration-200
        cursor-pointer select-none"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <span>{code}</span>
      <span className="text-passport-muted text-[11px] font-sans transition-opacity
        group-hover:text-passport-text">
        {copied ? '✓ copied' : 'copy'}
      </span>
    </button>
  )
}

function Comparison({ label, desc }: { label: string; desc: string }) {
  const active = label === 'AI Passport'
  return (
    <div className={`flex items-baseline gap-3 text-sm ${active ? '' : 'opacity-50'}`}>
      <span className={`font-semibold w-28 flex-shrink-0 ${active ? 'text-passport-text' : 'text-passport-muted'}`}>
        {label}
      </span>
      <span className={`${active ? 'text-passport-muted' : 'text-passport-dim'}`}>
        {desc}
      </span>
    </div>
  )
}

function PillarCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-passport-card border border-passport-border rounded-2xl p-6
      hover:border-passport-accent/30 transition-colors">
      <div className="text-2xl mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-passport-text mb-2">{title}</h3>
      <p className="text-xs text-passport-muted leading-relaxed">{body}</p>
    </div>
  )
}

function EvidenceStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-4">
      <p className="text-2xl font-bold tabular-nums"
        style={{ background: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </p>
      <p className="text-[11px] text-passport-muted mt-1 leading-tight">{label}</p>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── BACKGROUND BLOBS ────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="blob absolute rounded-full"
          style={{ width: 800, height: 800, top: '-300px', left: '-200px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
            '--blob-duration': '12s' } as React.CSSProperties} />
        <div className="blob absolute rounded-full"
          style={{ width: 500, height: 500, top: '40%', right: '-100px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            '--blob-duration': '16s', animationDelay: '-7s' } as React.CSSProperties} />
        <div className="blob absolute rounded-full"
          style={{ width: 400, height: 400, bottom: '-100px', left: '20%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)',
            '--blob-duration': '20s', animationDelay: '-3s' } as React.CSSProperties} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5
        border-b border-passport-border/30">
        <span className="font-semibold text-sm tracking-tight"
          style={{ background: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Capability Passport
        </span>
        <div className="flex items-center gap-5 text-[12px] text-passport-muted">
          <a href="https://github.com/JJGIV2010/ai-passport" target="_blank" rel="noopener noreferrer"
            className="hover:text-passport-text transition-colors">
            GitHub
          </a>
          <a href="/upload"
            className="hover:text-passport-text transition-colors">
            Upload profile.json
          </a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-2xl mx-auto px-8 pt-28 pb-20 text-center">

        <p className="text-[11px] font-semibold text-passport-muted uppercase tracking-[0.18em] mb-8">
          The professional identity layer for engineers who build with AI
        </p>

        <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-10"
          style={{ background: 'linear-gradient(135deg, #e9d5ff 0%, #a78bfa 40%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Capability<br />Passport
        </h1>

        {/* Three-line comparison */}
        <div className="flex flex-col gap-3 mb-10 text-left inline-block mx-auto w-fit">
          <Comparison label="GitHub" desc="shows what you've built." />
          <Comparison label="LinkedIn" desc="shows where you've worked." />
          <Comparison label="AI Passport" desc="shows how you build with AI." />
        </div>

        <p className="text-sm text-passport-muted leading-relaxed mb-10 max-w-md mx-auto">
          A behavioral profile generated from your AI engineering sessions.
          Verified by observable metadata — not self-reported. Private by design.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <CopyCommand code="npx ai-passport" />
          <span className="text-passport-dim text-xs">or</span>
          <CopyCommand code="pip install ai-passport" />
        </div>

        <p className="mt-4 text-[11px] text-passport-dim">
          Requires Python 3.10+ · your own Anthropic API key · ~$0.10 per analysis
        </p>
      </section>

      {/* ── EVIDENCE BAR ────────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-passport-border/40 py-8 mb-20"
        style={{ background: 'rgba(15,10,30,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-3xl mx-auto px-8">
          <p className="text-center text-[10px] font-medium text-passport-dim uppercase
            tracking-[0.16em] mb-6">
            Example signals from a real session history
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-0 sm:divide-x
            divide-passport-border/50">
            <EvidenceStat value="141" label="days of verified activity" />
            <EvidenceStat value="104" label="sessions analyzed" />
            <EvidenceStat value="22K+" label="tool invocations" />
            <EvidenceStat value="86%" label="cache efficiency" />
            <EvidenceStat value="6" label="integrations shipped" />
          </div>
          <p className="text-center text-[10px] text-passport-dim mt-6">
            None of these signals required reading a single word of prompt content.
          </p>
        </div>
      </div>

      {/* ── THREE PILLARS ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 mb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PillarCard
            icon="◎"
            title="Verified, not self-reported"
            body="Every metric is derived from observable engineering behavior — session timing, tool invocations, cache efficiency, model usage. Nothing requires your word for it."
          />
          <PillarCard
            icon="◈"
            title="Private by design"
            body="Extraction runs entirely on your machine. No prompt content, source code, or file paths are ever read. Only numbers cross the network boundary — never text."
          />
          <PillarCard
            icon="◇"
            title="Yours to share"
            body="Your profile lives as a JSON file on your machine. Share a self-contained link, download a PNG card, or scan a QR code. No account required to view."
          />
        </div>
      </section>

      {/* ── PRIVACY FLOW ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-2xl mx-auto px-8 mb-24">
        <p className="text-[10px] font-semibold text-passport-muted uppercase tracking-[0.16em] mb-6 text-center">
          Privacy architecture
        </p>
        <div className="rounded-2xl border border-passport-border overflow-hidden"
          style={{ background: 'rgba(15,10,30,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="font-mono text-[11px] text-passport-muted p-6 leading-7">
            <p className="text-passport-text font-semibold mb-1">Your machine</p>
            <p>  ~/.claude/projects/*.jsonl</p>
            <p>          │</p>
            <p>          ▼</p>
            <p>    passport extract</p>
            <p className="text-passport-dim">          │  reads ONLY: tool names · token counts · timestamps</p>
            <p className="text-passport-dim">          │  never reads: prompts · code · file paths · arguments</p>
            <p>          │</p>
            <p>          ▼</p>
            <p>    metrics.json  <span className="text-passport-accent">←── pure numbers only</span></p>
            <p>          │</p>
            <div className="flex items-start gap-2 mt-1">
              <div className="flex-shrink-0">
                <p>          └──────────────────▶</p>
              </div>
              <div>
                <p className="text-passport-text">Claude API  →  profile.json</p>
                <p className="text-passport-dim text-[10px]">What is sent: turn counts, token totals,</p>
                <p className="text-passport-dim text-[10px]">cache %, tool ratios. Nothing else.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── "IT OBSERVES" PULL QUOTE ────────────────────────────────────── */}
      <section className="relative z-10 max-w-xl mx-auto px-8 mb-28 text-center">
        <p className="text-xl font-medium leading-relaxed"
          style={{ color: 'rgba(196,181,253,0.75)' }}>
          It doesn't ask what you know.
        </p>
        <p className="text-xl font-semibold mt-1"
          style={{ background: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          It observes how you build.
        </p>
      </section>

      {/* ── QUICK START ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-xl mx-auto px-8 mb-28">
        <div className="rounded-2xl border border-passport-border overflow-hidden"
          style={{ background: 'rgba(15,10,30,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(to right, #0A1628, #6D28D9)' }} />
          <div className="p-7">
            <p className="text-[10px] font-semibold text-passport-muted uppercase tracking-[0.16em] mb-5">
              Quick start
            </p>
            <div className="space-y-2 font-mono text-[12px]">
              <div className="text-passport-dim"># Set your API key</div>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <span className="text-passport-dim">export </span>
                <span className="text-[#a78bfa]">ANTHROPIC_API_KEY</span>
                <span className="text-passport-dim">=sk-ant-...</span>
              </div>
              <div className="pt-2 text-passport-dim"># Run — opens your passport in the browser</div>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <span className="text-[#a78bfa]">npx ai-passport</span>
              </div>
              <div className="pt-2 text-passport-dim"># Or with pip</div>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <span className="text-passport-dim">pip install ai-passport</span>
              </div>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <span className="text-[#a78bfa]">passport run --open --qr --name "Your Name"</span>
              </div>
            </div>
            <p className="text-[11px] text-passport-dim mt-5 leading-relaxed">
              The CLI opens your passport directly in the browser. Use <span className="font-mono text-passport-muted">--qr</span> to
              generate a branded QR card PNG for your resume or GitHub profile.
            </p>
          </div>
          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(to right, #0A1628, #6D28D9)' }} />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-passport-border/40 py-12">
        <div className="max-w-3xl mx-auto px-8 flex flex-col sm:flex-row items-center
          justify-between gap-4 text-[12px] text-passport-muted">
          <div className="flex items-center gap-6">
            <a href="https://github.com/JJGIV2010/ai-passport" target="_blank" rel="noopener noreferrer"
              className="hover:text-passport-text transition-colors">
              GitHub
            </a>
            <span className="text-passport-dim">MIT License</span>
            <a href="/upload" className="hover:text-passport-text transition-colors">
              Upload profile.json
            </a>
          </div>
          <p className="text-passport-dim text-[11px]">
            aipassport.web.app · behavioral metadata only · no prompts accessed
          </p>
        </div>
      </footer>

    </div>
  )
}
