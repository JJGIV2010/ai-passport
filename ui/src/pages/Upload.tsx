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

export function UploadWidget() {
  const navigate  = useNavigate()
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

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
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        <svg className="spin-ccw pointer-events-none absolute inset-0"
          style={{ '--spin-duration': '36s' } as React.CSSProperties} width={280} height={280}>
          <circle cx={140} cy={140} r={132} stroke="rgba(124,58,237,0.15)"
            strokeWidth={1} fill="none" strokeDasharray="4 18" strokeLinecap="round" />
        </svg>
        <svg className="spin-cw pointer-events-none absolute inset-0"
          style={{ '--spin-duration': '22s' } as React.CSSProperties} width={280} height={280}>
          <circle cx={140} cy={140} r={108} stroke="rgba(139,92,246,0.22)"
            strokeWidth={1} fill="none" strokeDasharray="2 20" />
          <circle cx={140} cy={32} r={3.5} fill="#a78bfa"
            style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }} />
        </svg>

        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input-upload')?.click()}
          className={`relative z-10 w-44 h-44 rounded-2xl border-2 border-dashed flex flex-col items-center
            justify-center cursor-pointer transition-all duration-300 select-none
            ${dragging
              ? 'border-passport-accent bg-passport-accent/15 scale-105'
              : 'border-passport-border bg-passport-card/60 hover:border-passport-accent/50 hover:bg-passport-card'}`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" className="mb-2">
            <path d="M12 2L12 14M12 2L8 6M12 2L16 6" stroke="#8b5cf6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V16" stroke="#7c7a9f" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium text-passport-text mb-0.5">
            {dragging ? 'Drop it!' : 'profile.json'}
          </p>
          <p className="text-[11px] text-passport-muted text-center px-3">
            Drop or click to browse
          </p>
        </div>
        <input id="file-input-upload" type="file" accept=".json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </div>
  )
}

// ── Upload page (fallback route /upload) ─────────────────────────────────────

export default function Upload() {
  const [showGen, setShowGen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob absolute rounded-full"
          style={{ width: 600, height: 600, top: '-200px', left: '-100px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            '--blob-duration': '11s' } as React.CSSProperties} />
        <div className="blob absolute rounded-full"
          style={{ width: 400, height: 400, bottom: '-100px', right: '-50px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            '--blob-duration': '14s', animationDelay: '-5s' } as React.CSSProperties} />
      </div>

      <div className="mb-8 text-center relative z-10">
        <a href="/" className="text-[11px] text-passport-muted hover:text-passport-text transition-colors mb-6 block">
          ← Back
        </a>
        <h1 className="text-3xl font-bold mb-2 tracking-tight"
          style={{ background: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Upload profile.json
        </h1>
        <p className="text-passport-muted text-sm max-w-xs mx-auto">
          Already have a profile? Drop it below to view your passport.
        </p>
      </div>

      <div className="relative z-10">
        <UploadWidget />
      </div>

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
              <CodeLine code="npx ai-passport" comment="(no install required)" />
              <p className="text-passport-muted mt-1.5">or with pip:</p>
              <CodeLine code="pip install ai-passport" />
            </div>
            <div>
              <p className="text-passport-muted font-medium mb-2">2 · Set your Anthropic API key</p>
              <CodeLine code="export ANTHROPIC_API_KEY=sk-ant-..." comment="Mac / Linux" />
              <CodeLine code='$env:ANTHROPIC_API_KEY="sk-ant-..."' comment="Windows PowerShell" />
            </div>
            <div>
              <p className="text-passport-muted font-medium mb-2">3 · Run</p>
              <CodeLine code="passport run --open" />
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 max-w-sm text-[11px] text-passport-muted text-center leading-relaxed z-10">
        Parsed locally in your browser. Nothing is uploaded to any server.
      </p>
    </div>
  )
}
