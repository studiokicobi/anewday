module.exports = {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6edff',
          200: '#c4d3ff',
          300: '#9eb6ff',
          400: '#6a8cff',
          500: '#3e66f2',
          600: '#2b4fd6',
          700: '#1d3cb3',
          800: '#142a8a',
          900: '#0d1b63',
        },
      },
      fontFamily: {
        sans: [
          'IBM Plex Sans',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Crimson Pro',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
      },
    },
  },
  plugins: [],
};
