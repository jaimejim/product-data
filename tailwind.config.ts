import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'score-low': '#EF4444',      // red
        'score-medium': '#F59E0B',   // yellow/orange
        'score-high': '#10B981',     // green
      },
    },
  },
  plugins: [],
}
export default config
