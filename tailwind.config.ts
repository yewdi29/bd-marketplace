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
        background: '#0A0A0A',
        gold: {
          DEFAULT: '#C8A84B',
          light: '#D4B86A',
          dark: '#A8882B',
        },
        surface: {
          DEFAULT: '#141414',
          elevated: '#1C1C1C',
          border: '#2A2A2A',
        },
        tier: {
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#EF4444',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Bebas Neue', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}

export default config
