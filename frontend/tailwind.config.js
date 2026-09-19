/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f8faf0',
          100: '#f0f4dc',
          200: '#dde8b4',
          300: '#c4d67e',
          500: '#6b8c3a',
          600: '#4d6b2a',
        },
      },
    },
  },
  plugins: [],
}