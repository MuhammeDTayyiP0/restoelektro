/** @type {import('tailwindcss').Config} */
// Tailwind CSS — Dokunmatik POS, Windows 7 / Electron 22 uyumlu
module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Kil / terracotta marka paleti (restoran, sıcak)
        brand: {
          50: '#f7f1ed',
          100: '#eadad2',
          200: '#d4b5a6',
          300: '#c08f7a',
          400: '#b07860',
          500: '#9a5f48',
          600: '#824e3c',
          700: '#6a4032',
          800: '#533329',
          900: '#3d261f',
          950: '#241612',
        },
        // POS durum renkleri
        pos: {
          bos: '#3d9a6e',
          dolu: '#d4a017',
          rezerve: '#8a8178',
          hesap: '#c45c4a',
        },
        // Sıcak espresso yüzeyler
        surface: {
          50: '#f7f4ef',
          100: '#ebe6dc',
          200: '#d6cfc2',
          300: '#bdb3a3',
          400: '#9c9284',
          500: '#7a7166',
          600: '#5c554c',
          700: '#3f3a34',
          800: '#2a2622',
          900: '#1c1915',
          950: '#0b0a08',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        mono: ['Consolas', '"Courier New"', 'ui-monospace', 'monospace'],
      },
      spacing: {
        'touch': '48px',
        'touch-lg': '56px',
        'touch-xl': '64px',
        '18': '4.5rem',
        '26': '6.5rem',
        '84': '21rem',
        '92': '23rem',
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '56px',
        'touch-xl': '64px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '56px',
        'touch-xl': '64px',
      },
      fontSize: {
        'pos-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'pos-base': ['1rem', { lineHeight: '1.5rem' }],
        'pos-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'pos-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'pos-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'pos-3xl': ['2rem', { lineHeight: '2.5rem' }],
        'pos-price': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      boxShadow: {
        'pos': '0 1px 0 0 rgba(255, 248, 238, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.45)',
        'pos-lg': '0 1px 0 0 rgba(255, 248, 238, 0.05), 0 8px 24px -8px rgba(0, 0, 0, 0.55)',
        'pos-glow': '0 0 0 1px rgba(154, 95, 72, 0.35)',
        'pos-inset': 'inset 0 1px 0 rgba(255, 248, 238, 0.04), inset 0 2px 6px rgba(0, 0, 0, 0.28)',
      },
      borderRadius: {
        'pos': '10px',
        'pos-lg': '14px',
        'pos-xl': '20px',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'shake': 'shake 0.2s ease-in-out 0s 2',
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'pos': '1920px',
      'pos-wide': '2560px',
    },
  },
  plugins: [],
}
