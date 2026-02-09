module.exports = {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        'accent-1': '#2C303A',
        'accent-2': '#2C303A',
        'accent-3': '#9CA3AF',
        'accent-4': '#9CA3AF',
        brand: {
          50: '#FEFEFE',
          100: '#EAEAEB',
          200: '#C1C7D2',
          300: '#9CA3AF',
          400: '#69768E',
          500: '#545F75',
          600: '#52555D',
          700: '#6B6E75',
          800: '#3A3E48',
          900: '#2C303A',
          950: '#2C303A',
        },
      },
      fontFamily: {
        sans: [
          'Public Sans',
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