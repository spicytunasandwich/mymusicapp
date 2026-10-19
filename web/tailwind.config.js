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
          bg: '#08090E',
          sidebar: '#06070B',
          surface: '#10111B',
          card: '#151724',
          'card-hover': '#1C1F30',
          player: '#0B0C14',
          border: '#222538',
          'border-subtle': '#181A28',
          hover: '#181A29',
          accent: 'var(--audira-accent, #8B5CF6)',
          'accent-light': 'var(--audira-accent-light, #A78BFA)',
          'accent-glow': 'var(--audira-accent-glow, rgba(139, 92, 246, 0.35))',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E'
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-accent': '0 0 25px -5px var(--audira-accent-glow, rgba(139, 92, 246, 0.4))',
        'glow-play': '0 8px 24px -4px rgba(139, 92, 246, 0.5)',
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
