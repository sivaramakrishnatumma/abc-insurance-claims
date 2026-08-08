/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1edfe',
          100: '#e4dbfd',
          200: '#c9b8fb',
          300: '#a98ff7',
          400: '#8b68f2',
          500: '#5932ea',
          600: '#4a28c7',
          700: '#3c2099',
          800: '#2c1870',
          900: '#1f1050',
        },
        canvas: '#f6f8fc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(38, 45, 118, 0.12)',
      },
    },
  },
  plugins: [],
};
