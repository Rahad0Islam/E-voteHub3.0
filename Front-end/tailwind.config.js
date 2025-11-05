/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sciBg: '#0b0f1a',
        sciPanel: '#0f1628',
        sciAccent: '#22d3ee',
        sciAccent2: '#8b5cf6',
        lightBg: '#f4f6fb',
        lightPanel: '#ffffff',
        lightText: '#0f172a'
      },
      boxShadow: {
        neon: '0 0 12px rgba(34,211,238,0.55), 0 0 22px rgba(139,92,246,0.35)'
      }
    }
  },
  plugins: [],
}
