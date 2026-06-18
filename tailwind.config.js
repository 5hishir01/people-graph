/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0f0f0f',
          secondary: '#141414',
          tertiary:  '#1a1a1a',
          card:      '#1e1e1e',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          mid:    'rgba(255,255,255,0.12)',
          strong: 'rgba(255,255,255,0.20)',
        },
        text: {
          primary:   '#f0f0f0',
          secondary: '#9a9a9a',
          muted:     '#555555',
        },
        accent: {
          teal:       '#1D9E75',
          'teal-dim': '#0f6e56',
          amber:      '#EF9F27',
          purple:     '#7F77DD',
          blue:       '#378ADD',
        },
        node: {
          mentor:    '#1D9E75',
          employer:  '#EF9F27',
          hackathon: '#7F77DD',
          teammate:  '#378ADD',
          default:   '#888780',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
