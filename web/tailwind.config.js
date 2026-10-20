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
          bg: '#121212',
          sidebar: '#000000',
          surface: '#181818',
          card: '#181818',
          'card-hover': '#282828',
          player: '#181818',
          border: '#282828',
          'border-subtle': '#1F1F1F',
          hover: '#282828',
          accent: 'var(--audira-accent, #1DB954)',
          'accent-light': 'var(--audira-accent-light, #1ED760)',
          'accent-glow': 'var(--audira-accent-glow, rgba(29, 185, 84, 0.35))',
          green: '#1DB954',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E'
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-accent': '0 0 25px -5px var(--audira-accent-glow, rgba(29, 185, 84, 0.4))',
        'glow-play': '0 8px 24px -4px rgba(29, 185, 84, 0.5)',
        'spotify-card': '0 10px 20px -5px rgba(0, 0, 0, 0.5)'
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
        'scale-up': 'scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' }
        },
        scaleUp: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
