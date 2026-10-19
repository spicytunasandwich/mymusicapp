/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        audira: {
          dark: '#0B0C14',
          sidebar: '#06070B',
          card: '#13141F',
          player: '#0E0F1A',
          border: '#1F2030',
          hover: '#1B1C2B',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cyan: '#06B6D4'
        }
      }
    },
  },
  plugins: [],
}
