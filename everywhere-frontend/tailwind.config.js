/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'everywhere': {
          'primary': '#D9043D',
          'secondary': '#BF4968',
          'blue': '#034C8C',
          'light': '#F2F2F2'
        },
        'everywhere-primary': '#D9043D',
        'everywhere-secondary': '#BF4968'
      }
    },
  },
  plugins: [],
}

