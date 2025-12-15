/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0061d5',    // Box blue
          600: '#1e3a5f',    // Deep blue
          700: '#1e40af',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
