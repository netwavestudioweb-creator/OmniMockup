import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Accent primaire violet
          700: '#6d28d9', // Hover violet
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Palette des pages claires (tarifs, connexion, compte, pages légales, fenêtres) :
        // utilisée partout dans le code mais jamais définie jusqu'ici (les classes ne produisaient rien)
        sand: {
          50: '#faf8f5',
          100: '#f4f0ea',
          200: '#e8e1d6',
          300: '#d9cfc0',
          400: '#bfb19c',
          500: '#a3937b',
        },
        // Gris intermédiaires utilisés dans le studio
        zinc: {
          150: '#ececee',
          650: '#4a4a52',
          750: '#323238',
          850: '#1f1f23',
        },
        neutral: {
          50: '#fafafa',  // Fond général blanc cassé très léger
          100: '#f4f4f5', // Fond secondaire / cartes légères
          200: '#e4e4e7', // Bordures délicates
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
      spacing: {
        '0.2': '0.05rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      borderRadius: {
        xs: '0.125rem',
      },
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      opacity: {
        '8': '0.08',
      },
      zIndex: {
        '25': '25',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'scale-up': 'scaleUp 0.25s ease-out forwards',
        'shake': 'shake 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slideInLeft': 'slideInLeft 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
