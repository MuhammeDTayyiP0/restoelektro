/** @type {import('tailwindcss').Config} */
// Tailwind CSS yapılandırması — Dokunmatik ekran POS için optimize edilmiş
module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // POS için özel renk paleti
      colors: {
        // Ana marka renkleri
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f1d44',
        },
        // POS durum renkleri
        pos: {
          bos: '#10b981',       // Boş masa — yeşil
          dolu: '#f59e0b',      // Dolu masa — amber
          rezerve: '#8b5cf6',   // Rezerve — mor
          hesap: '#ef4444',     // Hesap istendi — kırmızı
        },
        // Uygulama yüzey renkleri (koyu tema)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      // Dokunmatik ekran için minimum boyutlar
      spacing: {
        'touch': '48px',       // Minimum dokunmatik hedef alanı
        'touch-lg': '56px',
        'touch-xl': '64px',
      },
      // Minimum buton boyutları
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
      // POS için özel font boyutları
      fontSize: {
        'pos-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'pos-base': ['1rem', { lineHeight: '1.5rem' }],
        'pos-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'pos-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'pos-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'pos-3xl': ['2rem', { lineHeight: '2.5rem' }],
        'pos-price': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
      },
      // Animasyon geçişleri
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      // Özel gölgelendirmeler
      boxShadow: {
        'pos': '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'pos-lg': '0 4px 16px -4px rgba(0, 0, 0, 0.4)',
        'pos-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'pos-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      // Özel border radius değerleri
      borderRadius: {
        'pos': '12px',
        'pos-lg': '16px',
        'pos-xl': '20px',
      },
      // Animasyonlar
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
          '0%': { transform: 'scale(0.95)', opacity: '0' },
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
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
    // Ekran kırılım noktaları (POS monitör boyutları)
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'pos': '1920px',      // Standart POS monitör
      'pos-wide': '2560px', // Geniş POS monitör
    },
  },
  plugins: [],
}
