/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jupyter: {
          orange: '#FF6F00',
          blue: '#1976D2',
          green: '#388E3C',
          red: '#D32F2F',
          gray: '#424242',
        }
      }
    },
  },
  plugins: [],
}