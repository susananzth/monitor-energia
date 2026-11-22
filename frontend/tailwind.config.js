/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Colores del logo: azul marino (#244c6c) y verde (#3cb474).
        marca: {
          50: '#eef4f8',
          100: '#d7e4ee',
          200: '#b0c8db',
          300: '#82a6c2',
          400: '#54809f',
          500: '#2f5f84',
          600: '#244c6c',
          700: '#1d3e59',
          800: '#183247',
          900: '#11243a',
          950: '#0b1828',
        },
        acento: {
          50: '#ecf9f1',
          100: '#d2f1df',
          200: '#a6e3c0',
          300: '#74d19c',
          400: '#4fc07f',
          500: '#3cb474',
          600: '#2e9a5f',
          700: '#267c4d',
          800: '#21633f',
          900: '#1b5135',
        },
      },
    },
  },
  plugins: [],
}
