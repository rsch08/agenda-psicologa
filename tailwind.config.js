/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1E2230',
        'ink-soft': '#2B3142',
        paper: '#EFEEE7',
        'paper-2': '#F1F0E9',
        tint1: '#DFE5DD',
        tint2: '#D2DCD5',
        thread: '#2F5D57',
        'thread-bright': '#3C736B',
        muted: '#6B6E73',
        line: 'rgba(30,34,48,.14)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
