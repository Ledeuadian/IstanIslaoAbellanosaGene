/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tree: {
          male: '#3B82F6',
          female: '#EC4899',
          branch: '#8B5CF6',
          leaf: '#10B981',
        },
      },
    },
  },
  plugins: [],
}