import { useState } from 'react'
import { PassportProfile } from '../types/profile'
import { generateShareCard, composeXText, composeLinkedInText, encodeProfileToUrl } from '../utils/shareCard'

interface Props {
  profile: PassportProfile
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href     = dataUrl
  a.download = filename
  a.click()
}

// ── Platform icons ────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function IconLink() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function ShareButtons({ profile }: Props) {
  const [generating, setGenerating]   = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function getCard(): Promise<string> {
    setGenerating(true)
    try {
      return await generateShareCard(profile)
    } finally {
      setGenerating(false)
    }
  }

  async function handleX() {
    const profileUrl = encodeProfileToUrl(profile)
    const text = composeXText(profile, profileUrl)
    // intent/tweet pre-populates the compose box — Twitter auto-shortens any URL to 23 chars
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    const card = await getCard()
    download(card, 'ai-passport-card.png')
    showToast('Draft opened on X — attach the card!')
  }

  async function handleLinkedIn() {
    const profileUrl = encodeProfileToUrl(profile)
    const text = composeLinkedInText(profile, profileUrl)
    // LinkedIn has no URL parameter for pre-filling post text — clipboard is the only reliable path
    await navigator.clipboard.writeText(text).catch(() => {})
    const card = await getCard()
    download(card, 'ai-passport-card.png')
    window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank')
    showToast('Text copied + card saved — paste with Ctrl/Cmd+V and attach the image')
  }

  async function handleInstagram() {
    const card = await getCard()
    download(card, 'ai-passport-card.png')
    showToast('Card saved — share it on Instagram!')
  }

  async function handleCopyLink() {
    const url = encodeProfileToUrl(profile)
    await navigator.clipboard.writeText(url).catch(() => {})
    showToast('Profile link copied!')
  }

  const btnBase = `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
    border transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] select-none`

  return (
    <div className="relative flex items-center gap-2">
      {/* Toast */}
      {toast && (
        <div
          className="absolute -top-10 right-0 whitespace-nowrap px-3 py-1.5 rounded-lg
            border border-passport-accent/30 bg-passport-card text-xs text-passport-text
            shadow-lg z-50"
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          {toast}
        </div>
      )}

      {/* X */}
      <button
        onClick={handleX}
        disabled={generating}
        title="Share on X"
        className={`${btnBase} border-[#333] bg-black/40 text-white hover:bg-black/60`}
      >
        <IconX />
        <span>X</span>
      </button>

      {/* LinkedIn */}
      <button
        onClick={handleLinkedIn}
        disabled={generating}
        title="Share on LinkedIn"
        className={`${btnBase} border-[#0077b5]/40 bg-[#0077b5]/10 text-[#60aed4] hover:bg-[#0077b5]/20`}
      >
        <IconLinkedIn />
        <span>LinkedIn</span>
      </button>

      {/* Instagram */}
      <button
        onClick={handleInstagram}
        disabled={generating}
        title="Download card for Instagram"
        className={`${btnBase} border-[#e1306c]/30 text-[#e1306c]/80 hover:bg-[#e1306c]/10`}
        style={{ background: 'rgba(225,48,108,0.06)' }}
      >
        <IconInstagram />
        <span>{generating ? '…' : 'Instagram'}</span>
      </button>

      {/* Copy profile link */}
      <button
        onClick={handleCopyLink}
        disabled={generating}
        title="Copy shareable profile link"
        className={`${btnBase} border-passport-border text-passport-muted hover:text-passport-text hover:border-passport-accent/40`}
      >
        <IconLink />
        <span>Link</span>
      </button>
    </div>
  )
}
