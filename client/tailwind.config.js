/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arena: {
          950: '#06070C',
          900: '#0E0F18',
          850: '#121320',
          800: '#171828',
          750: '#1C1E30',
          700: '#22243C',
          600: '#2C304C',
          500: '#373B5C',
        },
        emerald: {
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'Consolas', 'monospace'],
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
          '0%, 100%': { boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(16, 185, 129, 0.6), 0 0 48px rgba(16, 185, 129, 0.2)' },
        },
        dotPulse: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 12px rgba(16, 185, 129, 0.9)' },
        },
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.08)',
        'glow-violet': '0 0 20px rgba(124, 58, 237, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 12px 48px rgba(0, 0, 0, 0.65)',
        'inner-highlight': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
