/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0a0d14',
          surface: '#10131a',
          card: '#161f30',
          elevated: '#1f2c42',
          emerald: '#00f59b',
          'emerald-glow': 'rgba(0, 245, 155, 0.4)',
          gold: '#ffd15c',
          'gold-glow': 'rgba(255, 209, 92, 0.4)',
          cyan: '#0ea5e9',
          danger: '#ff3366',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.15)'
        }
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
        sans: ['Inter', 'sans-serif']
      },
      backdropBlur: {
        glass: '20px'
      }
    },
  },
  plugins: [],
}
