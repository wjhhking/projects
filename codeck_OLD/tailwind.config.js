/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-light': 'var(--primary-light)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        'surface': 'var(--surface)',
        'background': 'var(--background)',
        'border': 'var(--border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0px 1px 2px rgba(16, 24, 40, 0.05)',
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
}
