/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
          900: '#4c0519',
        }
      }
    },
  },
  plugins: [],
}
