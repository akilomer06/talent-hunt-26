/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          soft: 'rgb(var(--color-paper-soft) / <alpha-value>)',
          dark: 'rgb(var(--color-paper-dark) / <alpha-value>)',
          border: 'rgba(var(--color-ink), 0.12)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
        },
        electric: {
          blue: 'rgb(var(--color-electric-blue) / <alpha-value>)',
          'blue-hover': 'rgb(var(--color-electric-blue-hover) / <alpha-value>)',
          'blue-light': 'rgb(var(--color-electric-blue-light) / <alpha-value>)',
          'blue-glow': '#2563EB',
        },
        vivid: {
          orange: 'rgb(var(--color-vivid-orange) / <alpha-value>)',
          'orange-hover': 'rgb(var(--color-vivid-orange-hover) / <alpha-value>)',
          'orange-light': 'rgb(var(--color-vivid-orange-light) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        brutal: '4px 4px 0px rgb(var(--color-ink))',
        'brutal-lg': '8px 8px 0px rgb(var(--color-ink))',
        'brutal-orange': '5px 5px 0px rgb(var(--color-vivid-orange))',
        'brutal-blue': '5px 5px 0px rgb(var(--color-electric-blue))',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'marquee': 'marquee 25s linear infinite',
      },
    },
  },
  plugins: [],
}
