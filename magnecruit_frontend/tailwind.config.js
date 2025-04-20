/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'background': 'var(--color-background)',
          'box': 'var(--color-box)',
          'accent': 'var(--color-accent)',
          'accent-light': 'var(--color-accent-light)',
        },
      },
    },
    plugins: [],
  }