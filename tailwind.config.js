/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e1e2e',
          'dark-elevated': '#2a2a3e',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          hover: '#334155',
          active: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '64px',
        header: '64px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        sidebar: '4px 0 6px -1px rgb(0 0 0 / 0.1)',
      },
      transitionDuration: {
        sidebar: '250ms',
      },
      zIndex: {
        sidebar: '100',
        header: '90',
        overlay: '80',
        modal: '200',
        toast: '300',
      },
    },
  },
  plugins: [],
};
