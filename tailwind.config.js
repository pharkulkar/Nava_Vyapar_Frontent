/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────────
      colors: {
        primary: {
          50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
        },
        info: {
          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb',
        },
        surface: {
          DEFAULT:        '#ffffff',
          subtle:         '#f8fafc',
          muted:          '#f1f5f9',
          dark:           '#0f172a',
          'dark-elevated':'#1e293b',
          'dark-muted':   '#334155',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          hover:   '#1e293b',
          active:  '#2563eb',
          border:  '#1e293b',
        },
        border: {
          DEFAULT: '#e2e8f0',
          dark:    '#1e293b',
          focus:   '#2563eb',
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1' }],
      },
      fontWeight: {
        thin:       '100',
        light:      '300',
        normal:     '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight:   '-0.025em',
        normal:  '0em',
        wide:    '0.025em',
        wider:   '0.05em',
        widest:  '0.1em',
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        sidebar:           '260px',
        'sidebar-collapsed':'64px',
        header:            '64px',
        footer:            '40px',
        4.5:               '1.125rem',
        13:                '3.25rem',
        15:                '3.75rem',
        18:                '4.5rem',
        22:                '5.5rem',
      },

      // ── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        none:  '0',
        sm:    '0.25rem',
        DEFAULT:'0.375rem',
        md:    '0.5rem',
        lg:    '0.75rem',
        xl:    '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full:  '9999px',
      },

      // ── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        xs:          '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm:          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        card:        '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover':'0 4px 12px -2px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.08)',
        md:          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg:          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl:          '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl':       '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        dialog:      '0 25px 50px -12px rgb(0 0 0 / 0.4)',
        sidebar:     '4px 0 12px -2px rgb(0 0 0 / 0.15)',
        inner:       'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none:        'none',
      },

      // ── Z-Index ────────────────────────────────────────────────────────────
      zIndex: {
        0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50',
        sidebar: '100',
        header:  '90',
        overlay: '80',
        dropdown:'150',
        modal:   '200',
        toast:   '300',
        tooltip: '400',
      },

      // ── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        75:      '75ms',
        100:     '100ms',
        150:     '150ms',
        200:     '200ms',
        250:     '250ms',
        300:     '300ms',
        500:     '500ms',
        sidebar: '250ms',
      },
      transitionTimingFunction: {
        DEFAULT:    'cubic-bezier(0.4, 0, 0.2, 1)',
        linear:     'linear',
        in:         'cubic-bezier(0.4, 0, 1, 1)',
        out:        'cubic-bezier(0, 0, 0.2, 1)',
        'in-out':   'cubic-bezier(0.4, 0, 0.2, 1)',
        spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce:     'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ── Animation ──────────────────────────────────────────────────────────
      keyframes: {
        'fade-in':       { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out':      { from: { opacity: '1' }, to: { opacity: '0' } },
        'slide-in-right':{ from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        'slide-in-up':   { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-in-down': { from: { transform: 'translateY(-16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'scale-in':      { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'shimmer':       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'spin-slow':     { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'pulse-soft':    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'bounce-soft':   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'fade-in':        'fade-in 200ms ease-out',
        'fade-out':       'fade-out 200ms ease-in',
        'slide-in-right': 'slide-in-right 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-left':  'slide-in-left 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-up':    'slide-in-up 200ms ease-out',
        'slide-in-down':  'slide-in-down 200ms ease-out',
        'scale-in':       'scale-in 150ms ease-out',
        'shimmer':        'shimmer 1.5s infinite linear',
        'spin-slow':      'spin-slow 3s linear infinite',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        'bounce-soft':    'bounce-soft 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
