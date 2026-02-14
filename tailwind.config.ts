import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Cafe Primary Palette
        'cafe-coffee': '#6F4E37',
        'cafe-cream': '#FAF9F6',
        'cafe-charcoal': '#2D2D2D',
        // Cafe Secondary Palette
        'cafe-espresso': '#3C2415',
        'cafe-latte': '#D4A574',
        'cafe-steam': '#9B9590',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
