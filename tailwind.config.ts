import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bafd',
          400: '#8196fb',
          500: '#6272f6',
          600: '#4a4fea',
          700: '#3d3dd0',
          800: '#3334a8',
          900: '#2e3185',
          950: '#1c1d50',
        },
        dark: {
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1)', opacity: '0' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} satisfies Config
