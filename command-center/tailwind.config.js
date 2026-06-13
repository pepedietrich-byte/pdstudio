/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080810',
          panel:   '#0f0f1a',
          card:    '#141420',
          row:     '#10101c',
          border:  '#ffffff12',
        },
        cyan:    { DEFAULT: '#00d4ff', dim: '#00d4ff22', glow: '#00d4ff44' },
        magenta: { DEFAULT: '#e8197f', dim: '#e8197f22' },
        neon:    { green: '#2ddb72',   red: '#f03a3a',   amber: '#f5a623', purple: '#9b6ef3' },
        ink:     { DEFAULT: '#c8c8d8', dim: '#52526b',   hi: '#f0f0f8' },
      },
      fontFamily: {
        ui:   ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        'xs':  ['11px', '16px'],
        'sm':  ['13px', '20px'],
        'base':['14px', '22px'],
        'md':  ['15px', '22px'],
        'lg':  ['17px', '24px'],
        'xl':  ['20px', '28px'],
        '2xl': ['24px', '32px'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm:  '4px',
        md:  '6px',
        lg:  '8px',
        xl:  '10px',
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2.5s ease-in-out infinite',
        'pulse-red':  'pulse-red 1.8s ease-in-out infinite',
        'blink':      'blink 1.2s step-end infinite',
      },
      keyframes: {
        'pulse-cyan': {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
        'pulse-red': {
          '0%,100%': { opacity: '0.5' },
          '50%':     { opacity: '1' },
        },
        'blink': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
