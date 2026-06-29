/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        passport: {
          bg:        '#0a0912',
          card:      '#100f1e',
          surface:   '#16152a',
          border:    '#24224a',
          dim:       '#2d2b4a',
          primary:   '#7c3aed',
          accent:    '#8b5cf6',
          accent2:   '#a78bfa',
          highlight: '#c4b5fd',
          amber:     '#fbbf24',
          teal:      '#2dd4bf',
          green:     '#34d399',
          red:       '#f87171',
          text:      '#ede9fe',
          muted:     '#7c7a9f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Code', 'Source Code Pro', 'monospace'],
      },
      animation: {
        'badge-pop':   'badgePop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'glow-pulse':  'glowPulse 4s ease-in-out infinite',
        'fade-up':     'fadeUp 0.6s ease forwards',
        'fade-in':     'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        badgePop: {
          from: { opacity: '0', transform: 'scale(0.75) translateY(6px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.25' },
          '50%':     { opacity: '0.6' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
