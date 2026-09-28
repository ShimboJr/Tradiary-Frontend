/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  // Dark mode is toggled via `data-theme="dark"` on <html>
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ─── Colour Palette ─────────────────────────────────────────────────────
      colors: {
        // Backgrounds (dark-mode primary)
        surface: {
          DEFAULT: 'hsl(222, 20%, 10%)',   // deepest bg
          50:      'hsl(222, 18%, 12%)',   // card bg
          100:     'hsl(222, 16%, 15%)',   // raised surface
          200:     'hsl(222, 14%, 19%)',   // hover / input bg
          300:     'hsl(222, 12%, 24%)',   // border / divider
        },
        // Primary brand — indigo-teal
        brand: {
          DEFAULT: 'hsl(213, 90%, 58%)',   // #2a9df4 tone
          muted:   'hsl(213, 60%, 45%)',
          subtle:  'hsl(213, 40%, 25%)',
        },
        // Semantic: profit / gain
        gain: {
          DEFAULT: 'hsl(152, 70%, 48%)',   // emerald green
          subtle:  'hsl(152, 40%, 15%)',
          text:    'hsl(152, 65%, 55%)',
        },
        // Semantic: loss
        loss: {
          DEFAULT: 'hsl(4, 82%, 55%)',     // vivid red
          subtle:  'hsl(4, 50%, 15%)',
          text:    'hsl(4, 75%, 60%)',
        },
        // Text scale
        text: {
          primary:   'hsl(220, 15%, 95%)',
          secondary: 'hsl(220, 10%, 65%)',
          muted:     'hsl(220, 8%, 45%)',
          inverted:  'hsl(222, 20%, 10%)',
        },
        // Light mode overrides (applied via CSS variables — see index.css)
        light: {
          bg:       'hsl(220, 20%, 97%)',
          surface:  'hsl(0, 0%, 100%)',
          border:   'hsl(220, 15%, 88%)',
          text:     'hsl(222, 20%, 12%)',
        },
      },

      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
        card:    '0 1px 3px 0 rgba(0,0,0,0.35), 0 1px 2px -1px rgba(0,0,0,0.35)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.4)',
        glow:    '0 0 16px 0 rgba(42, 157, 244, 0.25)',
        'gain-glow': '0 0 12px 0 rgba(52, 211, 153, 0.3)',
        'loss-glow': '0 0 12px 0 rgba(239, 68, 68, 0.3)',
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
        'slide-in': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.2s ease-out',
        'slide-in':   'slide-in 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
