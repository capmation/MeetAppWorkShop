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
          50: '#f2f6fb',
          100: '#e4edf6',
          200: '#c8d8ea',
          300: '#9fb9d6',
          400: '#6e93c0',
          500: '#3e6aa4',
          600: '#0a2342', // Capmation blue core
          700: '#081c35',
          800: '#06162b',
          900: '#040f1f',
        },
        accent: {
          50: '#f7fbe9',
          100: '#ecf6ce',
          200: '#d6ec9c',
          300: '#bfdc63',
          400: '#aacb37',
          500: '#9fbf1a', // Capmation green
          600: '#8aa514',
          700: '#728812',
          800: '#5a6a10',
          900: '#4a570f',
        },
        neutral: {
          50: '#fdfdfd',
          100: '#f8f8f8',
          200: '#e3e3e3',
          300: '#c8c8c8',
          700: '#2c2c34',
          800: '#1f1f28',
          900: '#16161d',
        },
        dark: {
          900: '#050b16',
          800: '#0a1628',
          700: '#0f2035',
          600: '#17314d',
        },
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
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
