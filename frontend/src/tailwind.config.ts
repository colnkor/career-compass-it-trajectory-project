import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0a0b10',
        card:         'rgba(17,19,24,0.62)',
        'card-strong':'rgba(16,18,27,0.90)',
        border:       '#2b2f3e',
        'border-soft':'rgba(255,255,255,0.08)',
        text:         '#eceef5',
        muted:        '#9ca3af',
        accent:       '#534ab7',
        'accent-light':'#afa9ec',
        success:      '#1d9e75',
        danger:       '#ef6b70',
        amber:        '#ba7517',
      },
      fontFamily: {
        display: ['Syne', 'Arial', 'sans-serif'],
        body:    ['Manrope', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        glass:   '0 22px 70px rgba(0,0,0,0.34)',
        accent:  '0 12px 30px rgba(83,74,183,0.32)',
        'accent-hover': '0 18px 38px rgba(83,74,183,0.47)',
      },
      borderRadius: {
        '4xl': '22px',
        '5xl': '26px',
      },
    },
  },
  plugins: [],
} satisfies Config