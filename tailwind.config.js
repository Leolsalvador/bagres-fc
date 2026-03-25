/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        card: '#1F2937',
        elevated: '#1A1A2E',
        primary: '#00C853',
        secondary: '#FFD600',
        danger: '#EF4444',
        'text-main': '#F9FAFB',
        'text-muted': '#9CA3AF',
        border: '#374151',
        input: '#374151',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
