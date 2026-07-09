/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9ecff',
          200: '#bbdbff',
          300: '#8ec3ff',
          400: '#59a5fd',
          500: '#3185fc',
          600: '#1a64f0',
          700: '#1450dd',
          800: '#1641b3',
          900: '#163a8d',
          950: '#111f52',
        },
        surface: {
          DEFAULT: '#f8f9fc',
          50:  '#ffffff',
          100: '#f8f9fc',
          200: '#f0f2f7',
          300: '#e2e6f0',
          400: '#c5cbdc',
          500: '#8f98b5',
          600: '#6b7494',
          700: '#4a5270',
          800: '#2e3650',
          900: '#1a2035',
          950: '#0d1120',
        },
        accent: {
          DEFAULT: '#3185fc',
          glow: 'rgba(49,133,252,0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(49,133,252,0.3)',
        'glow':    '0 0 24px rgba(49,133,252,0.35)',
        'glow-lg': '0 0 48px rgba(49,133,252,0.4)',
        'card':    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        'hero-gradient': 'linear-gradient(135deg, #0b0f1a 0%, #131829 50%, #1e2440 100%)',
        'brand-gradient': 'linear-gradient(135deg, #1a64f0 0%, #3185fc 100%)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 12px rgba(49,133,252,0.3)' }, '50%': { boxShadow: '0 0 28px rgba(49,133,252,0.6)' } },
      },
      transitionDuration: {
        '350': '350ms',
      },
    },
  },
  plugins: [],
};
