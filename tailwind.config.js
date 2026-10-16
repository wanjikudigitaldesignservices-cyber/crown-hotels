/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        crown: {
          navy: '#0B1F3A',
          'navy-light': '#142C4E',
          'navy-dark': '#071527',
          gold: '#C9A227',
          'gold-light': '#DFC25E',
          'gold-dark': '#A38018',
          ivory: '#FAF6EC',
          'ivory-muted': '#F0EAD6',
          terracotta: '#B4532A',
          'terracotta-dark': '#8E3E1C',
          charcoal: '#1C1C1C',
          'charcoal-light': '#2A2A2A',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0B1F3A',
          foreground: '#FAF6EC',
        },
        secondary: {
          DEFAULT: '#C9A227',
          foreground: '#0B1F3A',
        },
        accent: {
          DEFAULT: '#B4532A',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F0EAD6',
          foreground: '#5A5852',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'crown-card': '0 4px 20px -2px rgba(11, 31, 58, 0.08), 0 2px 6px -1px rgba(11, 31, 58, 0.04)',
        'crown-elevated': '0 10px 30px -5px rgba(11, 31, 58, 0.15), 0 4px 10px -2px rgba(11, 31, 58, 0.06)',
        'crown-gold': '0 4px 14px 0 rgba(201, 162, 39, 0.35)',
      },
    },
  },
  plugins: [],
}
