import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F7F8F9',
        ink: {
          DEFAULT: '#1A1D20',
          2: '#4A4D52',
          3: '#9A9DA2',
        },
        orange: {
          DEFAULT: '#FF6B35',
          lt: '#FF8855',
          bg: '#FFF2ED',
          bdr: '#FFD4C2',
        },
        'badge-green': {
          DEFAULT: '#A2FF9A',
          text: '#1A5C18',
          bg: '#F0FFF0',
          bdr: '#C8F5C4',
        },
        'badge-gold': {
          DEFAULT: '#D4A017',
          text: '#7A5C00',
          bg: '#FDF6E3',
          bdr: '#F0D98A',
        },
        'badge-blue': {
          DEFAULT: '#0066CC',
          text: '#004499',
          bg: '#E6F0FF',
          bdr: '#B3D1FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['Andale Mono', 'monospace'],
      },
      borderRadius: {
        pill: '100px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.10)',
        navbar: '0 2px 16px rgba(0,0,0,0.05)',
        'orange-glow': '0 4px 16px rgba(255,107,53,0.30)',
        search: '0 2px 12px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}

export default config
