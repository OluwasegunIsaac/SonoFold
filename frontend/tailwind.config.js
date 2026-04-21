/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f5f5f7',
          card:    '#ffffff',
          border:  '#e0e0e0',
        },
        accent: {
          DEFAULT: '#5b9bd5',
          hover:   '#4a8bc4',
        },
        helix:  '#e88080',
        sheet:  '#5ab898',
        coil:   '#7bc8d4',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
