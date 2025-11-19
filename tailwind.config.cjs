module.exports = {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        'accent-1': '#4A9ADC',
        'accent-2': '#8DC15C',
        brand: {
          50: '#f5f3f2',
          100: '#ede9e7',
          200: '#d9d2cf',
          300: '#c1b5b0',
          400: '#a8948f',
          500: '#967f79',
          600: '#89706d',
          700: '#735d5b',
          800: '#5f4e4d',
          900: '#4e4140',
          950: '#292121',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};