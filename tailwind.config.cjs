module.exports = {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        'accent-1': '#156bc3',
        'accent-2': '#8DC15C',
        'accent-3': '#235985',
        'accent-4': '#6da933',
        brand: {
          50: '#f5f3f2',
          100: '#ede9e7',
          200: '#d9d2cf',
          300: '#c1b5b0',
          400: '#a8948f',
          500: '#7A6157',
          600: '#3d3735',
          700: '#322b29',
          800: '#28211f',
          900: '#1f1a18',
          950: '#18181B',
        },
      },
      fontFamily: {
        sans: [
          'Work Sans',
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