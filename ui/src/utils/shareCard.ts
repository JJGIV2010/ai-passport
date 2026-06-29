import { PassportProfile } from '../types/profile'

function fmt(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return String(n)
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
}

function arc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  start: number, end: number,
  color: string | CanvasGradient,
  lw: number,
) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, start, end)
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.stroke()
}

export async function generateShareCard(profile: PassportProfile): Promise<string> {
  await document.fonts.ready

  const W = 1080, H = 1080
  const canvas  = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── Background ──────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f0a1e')
  bg.addColorStop(1, '#0a0912')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Purple glow behind score ring
  const glowG = ctx.createRadialGradient(W / 2, 370, 0, W / 2, 370, 380)
  glowG.addColorStop(0, 'rgba(124,58,237,0.28)')
  glowG.addColorStop(1, 'transparent')
  ctx.fillStyle = glowG
  ctx.fillRect(0, 0, W, H)

  // Subtle corner accents
  ;[
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H },
  ].forEach(({ x, y }) => {
    const cg = ctx.createRadialGradient(x, y, 0, x, y, 200)
    cg.addColorStop(0, 'rgba(139,92,246,0.08)')
    cg.addColorStop(1, 'transparent')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, W, H)
  })

  // ── Header ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#3d3a52'
  ctx.font      = '500 24px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AI CAPABILITY PASSPORT', W / 2, 72)

  // thin top rule
  ctx.beginPath(); ctx.moveTo(W * 0.2, 88); ctx.lineTo(W * 0.8, 88)
  ctx.strokeStyle = '#24224a'; ctx.lineWidth = 1; ctx.stroke()

  // ── Score ring ───────────────────────────────────────────────────────────
  const cx = W / 2, cy = 370, r = 168, sw = 14
  const score = profile.summary.ai_engineering_score
  const startA = -Math.PI * 0.78
  const endA   =  Math.PI * 0.78
  const progressA = startA + (score / 100) * (endA - startA)

  arc(ctx, cx, cy, r, startA, endA, '#24224a', sw)

  // Gradient progress arc
  const arcGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
  arcGrad.addColorStop(0, '#7c3aed')
  arcGrad.addColorStop(1, '#c4b5fd')
  arc(ctx, cx, cy, r, startA, progressA, arcGrad, sw)

  // Score number
  ctx.fillStyle = '#c4b5fd'
  ctx.font      = 'bold 130px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(score), cx, cy + 46)

  ctx.fillStyle = '#7c7a9f'
  ctx.font      = '400 30px Inter, system-ui, sans-serif'
  ctx.fillText('/ 100', cx, cy + 92)

  ctx.fillStyle = '#3d3a52'
  ctx.font      = '500 20px Inter, system-ui, sans-serif'
  ctx.fillText('AI ENGINEERING SCORE  ·  HIGH CONFIDENCE', cx, cy + 136)

  // ── Divider ──────────────────────────────────────────────────────────────
  ctx.beginPath(); ctx.moveTo(W * 0.12, 572); ctx.lineTo(W * 0.88, 572)
  ctx.strokeStyle = '#1e1e35'; ctx.lineWidth = 1; ctx.stroke()

  // ── Key stats ────────────────────────────────────────────────────────────
  const ve = profile.verified_experience
  const stats = [
    { val: String(profile.summary.sessions_analyzed), lbl: 'SESSIONS' },
    { val: fmt(ve.token_scale.total_cache_read_tokens), lbl: 'CACHE READ' },
    { val: `${ve.token_scale.context_window_efficiency_pct}%`, lbl: 'CACHE EFF.' },
  ]
  const slotW = W / stats.length
  stats.forEach((s, i) => {
    const x = slotW * i + slotW / 2
    ctx.fillStyle = '#ede9fe'
    ctx.font      = 'bold 56px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s.val, x, 648)
    ctx.fillStyle = '#3d3a52'
    ctx.font      = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText(s.lbl, x, 682)
  })

  // Divider
  ctx.beginPath(); ctx.moveTo(W * 0.12, 710); ctx.lineTo(W * 0.88, 710)
  ctx.strokeStyle = '#1e1e35'; ctx.lineWidth = 1; ctx.stroke()

  // ── Badges ───────────────────────────────────────────────────────────────
  const earned = profile.badges.earned.slice(0, 8)
  const cols   = 4
  const padX   = 90
  const colW   = (W - padX * 2) / cols  // 225px per column — badge text capped inside each cell
  const badgeRowH = 54

  earned.forEach((b, i) => {
    const col   = i % cols
    const row   = Math.floor(i / cols)
    const cellX = padX + col * colW
    const y     = 778 + row * badgeRowH
    const icon  = BADGE_ICONS[b.id] ?? '◦'

    ctx.textAlign = 'left'
    ctx.fillStyle = '#8b5cf6'
    ctx.font      = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText(icon, cellX, y)

    ctx.fillStyle = '#a78bfa'
    ctx.font      = '400 18px Inter, system-ui, sans-serif'
    ctx.fillText(b.label, cellX + 26, y, colW - 34)  // maxWidth prevents right-edge overflow
  })

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(10,9,18,0.6)'
  ctx.fillRect(0, 980, W, 100)

  ctx.beginPath(); ctx.moveTo(0, 980); ctx.lineTo(W, 980)
  ctx.strokeStyle = '#24224a'; ctx.lineWidth = 1; ctx.stroke()

  ctx.fillStyle = '#2d2b4a'
  ctx.font      = '400 20px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Generated from behavioral metadata only — no prompts or source code accessed', W / 2, 1038)

  return canvas.toDataURL('image/png')
}

export function composeXText(profile: PassportProfile, profileUrl?: string): string {
  const score = profile.summary.ai_engineering_score
  const ve    = profile.verified_experience
  const top3  = profile.badges.earned.slice(0, 3).map(b => b.label).join(' · ')
  const link  = profileUrl ? `\n\n👁️ View my passport: ${profileUrl}` : ''
  return `My AI Capability Passport score: ${score}/100

${profile.summary.sessions_analyzed} sessions · ${ve.development_sessions.avg_active_duration_minutes}m avg
${fmt(ve.token_scale.total_cache_read_tokens)} cache tokens · ${ve.token_scale.context_window_efficiency_pct}% efficiency
Badges: ${top3}

Privacy-first — only metadata, never your code.${link}
#AIEngineering #ClaudeCode`
}

// ── Profile URL encoding (self-contained shareable links) ────────────────
// Encodes the full profile into the URL fragment — no backend needed when hosted statically.
// The URL is long (~6KB base64) but functional; Twitter auto-shortens any URL to 23 chars.
export function encodeProfileToUrl(profile: PassportProfile, origin?: string): string {
  const json = JSON.stringify(profile)
  const b64  = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')  // URL-safe base64
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/review#p=${b64}`
}

export function decodeProfileFromHash(hash: string): PassportProfile | null {
  if (!hash.startsWith('#p=')) return null
  try {
    const b64  = hash.slice(3).replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json) as PassportProfile
  } catch { return null }
}

// ── Minimal profile (QR format) ─────────────────────────────────────────────
export interface MiniProfile {
  v: number
  s: number           // score
  d: number           // days
  n: number           // sessions
  ce: number          // cache efficiency %
  t: number           // avg turns/session
  b: string[]         // badge IDs
  sp: [string, number][]  // [domain, confidence]
  mo: string[]        // models used
  pr: number          // project count
}

export function decodeProfileFromMiniHash(hash: string): MiniProfile | null {
  if (!hash.startsWith('#pmin=')) return null
  try {
    const b64 = hash.slice(6).replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json) as MiniProfile
  } catch { return null }
}

export function composeLinkedInText(profile: PassportProfile, profileUrl?: string): string {
  const score  = profile.summary.ai_engineering_score
  const ve     = profile.verified_experience
  const badges = profile.badges.earned.map(b => b.label).join(' · ')
  const top2   = profile.specialties.slice(0, 2).map(s => s.domain).join('\n• ')
  const link   = profileUrl
    ? `\n\n🔗 View my full analysis: ${profileUrl}\n👉 Generate yours: https://aipassport.web.app`
    : `\n\n👉 Generate yours: https://aipassport.web.app`
  return `Just ran my Claude Code + Codex CLI session history through an AI Capability Passport — a privacy-first behavioral analyzer that reads only tool names, timestamps, and counts. Never prompts or source code.

Results from ${profile.metadata.analysis_period.days} days of AI engineering work:

📊 ${score}/100 AI Engineering Score (${profile.summary.analysis_quality} confidence)
⏱ ${profile.summary.sessions_analyzed} sessions · avg ${ve.development_sessions.avg_active_duration_minutes} min active · ${ve.development_sessions.avg_turns_per_session} turns/session
💾 ${fmt(ve.token_scale.total_cache_read_tokens)} cache-read tokens at ${ve.token_scale.context_window_efficiency_pct}% efficiency
🔧 ${ve.integrations_built} integrations built: ${ve.tools_built.join(', ')}
🤖 ${profile.tool_usage.models_used.length} model variants used across platforms

Top specialties:
• ${top2}

Badges earned: ${badges}${link}

#AIEngineering #ClaudeCode #MCP #VerticalAI`
}
