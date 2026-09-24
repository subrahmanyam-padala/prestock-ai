/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F5F9',
        ink: { DEFAULT: '#0F1B2D', soft: '#33445C', mute: '#5B6B82' },
        line: '#DFE4EC',
        data: { DEFAULT: '#0B8F74', tint: '#E3F5F0' },
        ai: { DEFAULT: '#6236D6', tint: '#ECE6FB' },
        warn: { DEFAULT: '#A96A0B', tint: '#FBF0DC' },
        up: '#0B8F74',
        down: '#CF3E58',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { panel: '0 1px 0 rgba(15,27,45,.04), 0 8px 24px -16px rgba(15,27,45,.18)' },
    },
  },
  plugins: [],
};
