/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Primary Teal Palette ───
        primary: {
          DEFAULT: '#0F766E',
          hover:   '#0D9488',
          light:   '#CCFBF1',
          50:      '#F0FDFA',
        },
        // ─── Accent Amber ───
        accent: {
          DEFAULT: '#F59E0B',
          light:   '#FEF3C7',
        },
        // ─── Danger ───
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEE2E2',
        },
        // ─── Neutral Surfaces ───
        surface: {
          bg:    '#F8FAFB',
          card:  '#FFFFFF',
          hover: '#F1F5F9',
          muted: '#F8FAFC',
        },
        // ─── Text Hierarchy ───
        ink: {
          DEFAULT:   '#1E293B',
          secondary: '#64748B',
          muted:     '#94A3B8',
          inverted:  '#FFFFFF',
        },
        // ─── Borders ───
        line: {
          DEFAULT: '#E2E8F0',
          strong:  '#CBD5E1',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'spatial-sm': '0 1px 3px rgba(15,118,110,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'spatial':    '0 4px 16px rgba(15,118,110,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'spatial-md': '0 8px 30px rgba(15,118,110,0.10), 0 4px 8px rgba(0,0,0,0.04)',
        'spatial-lg': '0 16px 48px rgba(15,118,110,0.12), 0 8px 16px rgba(0,0,0,0.04)',
        'spatial-xl': '0 24px 64px rgba(15,118,110,0.14), 0 12px 24px rgba(0,0,0,0.05)',
        'inner-glow': 'inset 0 1px 2px rgba(15,118,110,0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.5s ease-out forwards',
        'slide-down':  'slideDown 0.4s ease-out forwards',
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 10s ease-in-out infinite',
        'float-delay': 'float 8s ease-in-out 2s infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'scale-in':    'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotate(2deg)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
