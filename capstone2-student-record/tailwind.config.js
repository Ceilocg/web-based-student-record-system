/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Ensure you're scanning the correct files for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          100: '#ffccd5', // Light pink
          300: '#ff99a8', // Medium pink
          500: '#ff667f', // Darker pink
          700: '#ff3361', // Dark pink
        },
      },
    },
  },
  darkMode: 'class', // Enable class-based dark mode
  plugins: [],
}
// tailwind.config.js
