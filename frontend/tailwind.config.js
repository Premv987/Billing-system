/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981', // Emerald
          dark: '#059669',
          light: '#4edea3',
        },
        surface: {
          lowest: '#060e20',
          low: '#131b2e',
          DEFAULT: '#0b1326',
          high: '#171f33',
          highest: '#222a3d',
          variant: '#2d3449'
        },
        border: {
          subtle: '#1e293b',
          DEFAULT: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
