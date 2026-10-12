/** @type {import('tailwindcss').Config} */

/* ──────────────────────────────────────────────────────────────────────────
   CodeArena — "Technical Excellence System"
   Tokens mirror the Stitch design system (Material tonal palette, dark mode,
   FIDELITY variant, primary #3b82f6 → #adc6ff on dark).
   ────────────────────────────────────────────────────────────────────────── */

const stitch = {
  // Surfaces — linear stepped tonal elevation
  'surface':                  '#10131a',
  'surface-dim':              '#10131a',
  'surface-bright':           '#363940',
  'surface-container-lowest': '#0b0e14',
  'surface-container-low':    '#191c22',
  'surface-container':        '#1d2026',
  'surface-container-high':   '#272a31',
  'surface-container-highest':'#32353c',
  'surface-variant':          '#32353c',

  // Content
  'on-surface':               '#e1e2eb',
  'on-surface-variant':       '#c2c6d6',
  'inverse-surface':          '#e1e2eb',
  'inverse-on-surface':       '#2e3037',

  // Outlines
  'outline':                  '#8c909f',
  'outline-variant':          '#424754',

  // Primary (blue)
  'primary':                  '#adc6ff',
  'on-primary':               '#002e6a',
  'primary-container':        '#4d8eff',
  'on-primary-container':     '#00285d',
  'inverse-primary':          '#005ac2',
  'primary-fixed':            '#d8e2ff',
  'primary-fixed-dim':        '#adc6ff',
  'on-primary-fixed':         '#001a42',
  'on-primary-fixed-variant': '#004395',

  // Secondary (indigo — system-level states)
  'secondary':                '#c0c1ff',
  'on-secondary':             '#1000a9',
  'secondary-container':      '#3131c0',
  'on-secondary-container':   '#b0b2ff',
  'secondary-fixed':          '#e1e0ff',
  'secondary-fixed-dim':      '#c0c1ff',

  // Tertiary (orange — medium difficulty, contests)
  'tertiary':                 '#ffb786',
  'on-tertiary':              '#502400',
  'tertiary-container':       '#df7412',
  'on-tertiary-container':    '#461f00',
  'tertiary-fixed':           '#ffdcc6',
  'tertiary-fixed-dim':       '#ffb786',

  // Error (hard difficulty, failed verdicts)
  'error':                    '#ffb4ab',
  'on-error':                 '#690005',
  'error-container':          '#93000a',
  'on-error-container':       '#ffdad6',

  'background':               '#10131a',
  'on-background':            '#e1e2eb',
  'surface-tint':             '#adc6ff',
}

/* Primary blue ramp — the brand accent everywhere in the app.
   Replaces the previous emerald accent so existing utility classes
   (text-emerald-400, bg-emerald-500/10, …) resolve to Stitch primary. */
const accent = {
  50:  '#eef3ff',
  100: '#d8e2ff',
  200: '#c3d4ff',
  300: '#d8e2ff',
  400: '#adc6ff',
  500: '#4d8eff',
  600: '#005ac2',
  700: '#004395',
  800: '#002e6a',
  900: '#00285d',
  950: '#001a42',
}

/* Semantic ramps. The 300–500 steps hold the light-on-dark tones so that
   `text-red-400` reads as content and `bg-red-500/10` reads as a 15%-ish tint,
   exactly how Stitch tints its status chips. */
const errorRamp = {
  200: '#ffdad6',
  300: '#ffdad6',
  400: '#ffb4ab',
  500: '#ffb4ab',
  600: '#93000a',
  700: '#93000a',
  800: '#690005',
  900: '#690005',
}

const tertiaryRamp = {
  200: '#ffdcc6',
  300: '#ffdcc6',
  400: '#ffb786',
  500: '#ffb786',
  600: '#df7412',
  700: '#723600',
  800: '#502400',
  900: '#311400',
}

const successRamp = {
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#34d399',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
}

/* Neutral ramp — the stepped tonal scale, light → dark. */
const neutral = {
  50:  '#e1e2eb',
  100: '#e1e2eb',
  200: '#c2c6d6',
  300: '#c2c6d6',
  400: '#c2c6d6',
  500: '#8c909f',
  600: '#8c909f',
  700: '#424754',
  750: '#32353c',
  800: '#272a31',
  850: '#1d2026',
  900: '#191c22',
  950: '#10131a',
}

/* Indigo ramp — system-level states (MLE, compile error) and admin surfaces.
   Replaces the previous violet accent. */
const indigo = {
  200: '#e1e0ff',
  300: '#d2d2ff',
  400: '#c0c1ff',
  500: '#3131c0',
  600: '#2f2ebe',
  700: '#1000a9',
  800: '#07006c',
  900: '#07006c',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...stitch,

        /* Legacy `arena-*` scale remapped onto Stitch tonal steps so existing
           markup inherits the new elevation model without being rewritten. */
        arena: {
          950: '#0b0e14',
          900: '#10131a',
          850: '#191c22',
          800: '#1d2026',
          750: '#272a31',
          700: '#32353c',
          600: '#424754',
          500: '#8c909f',
        },

        /* Brand accent (was emerald green, now Stitch primary blue) */
        emerald: accent,
        accent,

        /* System-level / admin accent (was violet) */
        violet: indigo,
        indigo,

        /* Semantic ramps remapped onto Stitch tokens, so every existing
           `text-red-400` / `bg-amber-500/10` lands on the design system. */
        red: errorRamp,
        rose: errorRamp,
        amber: tertiaryRamp,
        yellow: tertiaryRamp,
        orange: tertiaryRamp,
        blue: accent,
        sky: accent,

        /* True semantic green — reserved for Accepted verdicts, matching
           Stitch's use of emerald-400 in the submissions table. */
        success: successRamp,
        green: successRamp,
        teal: successRamp,

        /* Neutrals remapped onto the Stitch tonal scale, so legacy
           `text-gray-400` / `bg-zinc-900` land on real surfaces. */
        gray: neutral,
        slate: neutral,
        zinc: neutral,
        neutral,
        stone: neutral,
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'Consolas', 'monospace'],
      },

      /* Stitch type scale */
      fontSize: {
        'display-lg':         ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'headline-md':        ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm':        ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':            ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md':           ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'code-md':            ['14px', { lineHeight: '22px', fontWeight: '400' }],
      },

      /* Shape language — soft but technical: 4px controls, 8px containers */
      borderRadius: {
        'sm':      '0.125rem',
        DEFAULT:   '0.25rem',
        'md':      '0.375rem',
        'lg':      '0.25rem',
        'xl':      '0.5rem',
        '2xl':     '0.5rem',
        '3xl':     '0.75rem',
        'full':    '9999px',
      },

      /* 4px baseline rhythm */
      spacing: {
        'base':              '4px',
        'stack-sm':          '8px',
        'stack-md':          '16px',
        'stack-lg':          '32px',
        'gutter':            '16px',
        'container-padding': '24px',
        'margin-mobile':     '16px',
        'sidebar':           '16rem',
      },

      animation: {
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in': 'fadeIn 0.25s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'dot-pulse': 'dotPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(173, 198, 255, 0.25)' },
          '50%': { boxShadow: '0 0 20px rgba(173, 198, 255, 0.5)' },
        },
        dotPulse: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(173, 198, 255, 0.4)' },
          '50%': { boxShadow: '0 0 12px rgba(173, 198, 255, 0.9)' },
        },
      },

      /* Elevation: tonal layers + hairline outlines, not heavy drops */
      boxShadow: {
        'level-1': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'level-2': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'level-3': '0 10px 24px rgba(0, 0, 0, 0.55)',
        'level-4': '0 20px 40px rgba(0, 0, 0, 0.6)',
        'glow-emerald': '0 0 0 1px rgba(173, 198, 255, 0.3)',
        'glow-violet': '0 0 0 1px rgba(192, 193, 255, 0.3)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 10px 24px rgba(0, 0, 0, 0.55)',
        'inner-highlight': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
