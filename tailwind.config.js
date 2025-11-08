/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          dark: '#312e81',
          light: '#c7d2fe',
        },
      },
      boxShadow: {
        'glow-brand': '0 10px 40px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
}

