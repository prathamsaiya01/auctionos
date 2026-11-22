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
        admin: {
          bg: '#FFFFFF',
          secondary: '#F5F6FA',
          primary: '#2563EB',
          purple: '#7C3AED',
          text: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626'
        },
        auction: {
          bg: '#090D18',
          surface: '#151C2C',
          card: '#1D2638',
          primary: '#8B5CF6',
          secondary: '#3B82F6',
          success: '#22C55E',
          danger: '#EF4444',
          text: '#F9FAFB',
          muted: '#9CA3AF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
