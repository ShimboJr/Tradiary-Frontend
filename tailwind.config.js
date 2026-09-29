/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  // Dark mode is toggled via `data-theme="dark"` on <html>
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ─── Colour Palette (Tradiary brand spec) ─────────────────────────────
      colors: {
        // Canonical brand tokens — these are the source of truth
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          raised:  'var(--surface-raised)',
          100:     'var(--surface-100)',
          200:     'var(--surface-200)',
          300:     'var(--surface-300)',
        },
        border: 'var(--border)',

        // Text
        text: {
          DEFAULT: 'var(--text)',
          muted:   'var(--text-muted)',
        },

        // Brand
        brand: {
          indigo:  'var(--brand-indigo)',
          cyan:    'var(--brand-cyan)',
          DEFAULT: 'var(--brand-indigo)',
          subtle:  'var(--brand-indigo-subtle)',
          muted:   'var(--color-brand-muted)',
        },

        // Semantic: profit/loss (reserved — never use decoratively)
        gain: {
          DEFAULT: 'var(--gain)',
          subtle:  'var(--gain-subtle)',
          text:    'var(--gain-text)',
        },
        loss: {
          DEFAULT: 'var(--loss)',
          subtle:  'var(--loss-subtle)',
          text:    'var(--loss-text)',
        },

        warning: {
          DEFAULT: 'var(--warning)',
          subtle:  'var(--warning-subtle)',
        },
      },

      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      // ─── Spacing / Layout ───────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },

      // ─── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        card:         '0 1px 3px 0 rgba(0,0,0,0.35), 0 1px 2px -1px rgba(0,0,0,0.35)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.4)',
        glow:         '0 0 20px 0 rgba(91,108,255,0.25)',
        'glow-cyan':  '0 0 20px 0 rgba(34,211,238,0.20)',
        'gain-glow':  '0 0 12px 0 rgba(34,197,94,0.30)',
        'loss-glow':  '0 0 12px 0 rgba(239,68,68,0.30)',
      },

      // ─── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '200ms',
        fast:    '150ms',
        slow:    '350ms',
      },

      // ─── Keyframes / Animations ─────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.2s ease-out',
        'fade-up':    'fade-up 0.3s ease-out',
        'slide-in':   'slide-in 0.25s ease-out',
        'slide-up':   'slide-up 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer:      'shimmer 2.5s linear infinite',
        'spin-slow':  'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
};
