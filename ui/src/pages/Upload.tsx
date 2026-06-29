import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PassportProfile } from '../types/profile'

function CodeLine({ code, comment }: { code: string; comment?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="flex items-center justify-between gap-2 bg-black/40 rounded-lg px-3 py-2 mb-1.5 font-mono text-[12px]">
      <span>
        <span className="text-[#a78bfa]">{code}</span>
        {comment && <span className="text-passport-muted ml-2">{comment}</span>}
      </span>
      <button
        onClick={copy}
        className="text-passport-muted hover:text-passport-text transition-colors flex-shrink-0 text-[10px]"
      >
        {copied ? '✓' : 'copy'}
      </button>
    </div>
  )
}

export default function Upload() {
  const navigate  = useNavigate()
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [showGen,  setShowGen]  = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) { setError('Please upload a .json profile file.'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const profile: PassportProfile = JSON.parse(e.target?.result as string)
        if (!profile.summary?.ai_engineering_score) {
          setError('This does not look like a valid passport profile.')
          return
        }
        sessionStorage.setItem('passport_profile', JSON.stringify(profile))
        navigate('/review')
      } catch { setError('Could not parse the JSON file.') }
    }
    reader.readAsText(file)
  }, [navigate])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="blob absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: '-200px', left: '-100px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            '--blob-duration': '11s',
          } as React.CSSProperties}
        />
        <div
          className="blob absolute rounded-full"
          style={{
            width: 400, height: 400,
            bottom: '-100px', right: '-50px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            '--blob-duration': '14s',
            animationDelay: '-5s',
          } as React.CSSProperties}
        />
      </div>

      {/* Title */}
      <div className="mb-10 text-center relative z-10">
        <h1
          className="text-4xl font-bold mb-3 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI Capability Passport
        </h1>
        <p className="text-passport-muted text-sm max-w-xs mx-auto leading-relaxed">
          A behavioral fingerprint of your AI engineering practice — generated from session metadata, never from content.
        </p>
      </div>

      {/* Orbital drop zone */}
      <div className="relative flex items-center justify-center z-10" style={{ width: 340, height: 340 }}>

        {/* Outer orbital ring */}
        <svg
          className="spin-ccw pointer-events-none absolute inset-0"
          style={{ '--spin-duration': '36s' } as React.CSSProperties}
          width={340} height={340}
        >
          <circle cx={170} cy={170} r={162}
            stroke="rgba(124,58,237,0.15)" strokeWidth={1}
            fill="none" strokeDasharray="4 18" strokeLinecap="round"
          />
        </svg>

        {/* Inner orbital ring + orbiting dot */}
        <svg
          className="spin-cw pointer-events-none absolute inset-0"
          style={{ '--spin-duration': '22s' } as React.CSSProperties}
          width={340} height={340}
        >
          <circle cx={170} cy={170} r={134}
            stroke="rgba(139,92,246,0.22)" strokeWidth={1}
            fill="none" strokeDasharray="2 20"
          />
          {/* Orbiting dot */}
          <circle cx={170} cy={36} r={4} fill="#a78bfa"
            style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }}
          />
        </svg>

        {/* Center glow */}
        <div
          className="absolute pointer-events-none rounded-full animate-glow-pulse"
          style={{
            width: 200, height: 200,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Drop zone */}
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`relative z-10 w-56 h-56 rounded-2xl border-2 border-dashed flex flex-col items-center
            justify-center cursor-pointer transition-all duration-300 select-none
            ${dragging
              ? 'border-passport-accent bg-passport-accent/15 scale-105'
              : 'border-passport-border bg-passport-card/60 hover:border-passport-accent/50 hover:bg-passport-card'}`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <span className="text-3xl mb-3 font-mono text-passport-muted">{ }</span>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" className="mb-3">
            <path d="M12 2L12 14M12 2L8 6M12 2L16 6" stroke="#8b5cf6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V16" stroke="#7c7a9f" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium text-passport-text mb-1">
            {dragging ? 'Drop it!' : 'profile.json'}
          </p>
          <p className="text-xs text-passport-muted text-center px-4">
            Drop here or click to browse
          </p>
        </div>

        <input id="file-input" type="file" accept=".json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {error && (
        <p className="mt-6 text-red-400 text-sm z-10">{error}</p>
      )}

      {/* Generate instructions */}
      <div className="mt-8 z-10 w-full max-w-sm">
        <button
          onClick={() => setShowGen(v => !v)}
          className="flex items-center gap-2 text-xs text-passport-muted hover:text-passport-text transition-colors mx-auto"
        >
          <span className="text-[10px]">{showGen ? '▾' : '▸'}</span>
          <span>Don't have a profile.json? Generate one with the CLI</span>
        </button>

        {showGen && (
          <div className="mt-4 border border-passport-border rounded-xl p-5 text-xs space-y-4"
               style={{ background: 'rgba(15,10,30,0.7)', backdropFilter: 'blur(8px)' }}>

            <div>
              <p className="text-passport-muted font-medium mb-2">1 · Install</p>
              <CodeLine code="pip install ai-passport" comment="(PyPI — coming soon)" />
              <p className="text-passport-muted mt-1">or from source:</p>
              <CodeLine code="pip install -e ." comment="(in the cloned repo)" />
            </div>

            <div>
              <p className="text-passport-muted font-medium mb-2">2 · Set your Anthropic API key</p>
              <CodeLine code="export ANTHROPIC_API_KEY=sk-ant-..." comment="Mac / Linux" />
              <CodeLine code='$env:ANTHROPIC_API_KEY="sk-ant-..."' comment="Windows PowerShell" />
            </div>

            <div>
              <p className="text-passport-muted font-medium mb-2">3 · Run</p>
              <CodeLine code="passport run --open" />
              <p className="text-[11px] text-passport-muted mt-1.5 leading-relaxed">
                Reads your Claude Code session logs (metadata only — no prompts or code),
                generates <span className="text-passport-text font-mono">profile.json</span>, and opens this page.
              </p>
            </div>

            <div className="pt-1 border-t border-passport-border text-[11px] text-passport-muted leading-relaxed">
              Requires Python 3.10+ and an{' '}
              <span className="text-passport-text">ANTHROPIC_API_KEY</span> for profile generation.
              Only behavioral metadata (tool names, counts, timing) reaches the API — never prompts or code.
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 max-w-sm text-[11px] text-passport-muted text-center leading-relaxed z-10">
        <span className="text-passport-text font-medium">Privacy note —</span>{' '}
        Your profile JSON is parsed locally in your browser. Nothing is uploaded. Only you decide what to share.
      </p>
    </div>
  )
}
