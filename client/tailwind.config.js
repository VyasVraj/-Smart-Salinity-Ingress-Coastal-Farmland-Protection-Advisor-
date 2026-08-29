/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Coastal palette
        ocean: {
          950: '#071923',
          900: '#0B2430',
          800: '#102D38',
          700: '#163A45',
          600: '#1E4D5C',
          500: '#256070',
          400: '#2D7A8F',
          300: '#3A9AB5',
          200: '#5BBCD4',
          100: '#A8DDE9',
        },
        seafoam: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        agri: {
          400: '#3FAE5A',
          500: '#2D9B47',
          600: '#1E7A34',
        },
        sand: {
          200: '#E8D9B8',
          300: '#D6C29E',
          400: '#C4A97A',
        },
        risk: {
          low:      '#3FAE5A',
          medium:   '#E6A23C',
          high:     '#E45756',
          critical: '#C83E4D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
