/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6750E8', // Primary Brand Violet
          600: '#553CDE',
          700: '#4328D0',
          800: '#331BAE',
          900: '#230E85',
        },
        admin: {
          bg: '#F5F6FA',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          text: '#111827',
          muted: '#64748B',
          border: '#E7EAF0',
          hover: '#F1F4F9',
          primary: '#6750E8',
          secondary: '#338CF5',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626'
        },
        auction: {
          bg: '#080D19',
          surface: '#111A2B',
          card: '#18243A',
          border: '#22324F',
          primary: '#8B5CF6',
          secondary: '#38BDF8',
          live: '#22C55E',
          sold: '#16A34A',
          unsold: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
          glow: 'rgba(139, 92, 246, 0.4)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 4px 20px -2px rgba(103, 80, 232, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.5)',
        'glow-green': '0 0 25px -5px rgba(34, 197, 94, 0.5)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'scale-up': 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
