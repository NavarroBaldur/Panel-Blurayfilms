// tailwind.config.js
module.exports = {
    darkMode: ['class'], // Asegura que el modo oscuro funcione con `.dark`
    content: [
      './app/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './pages/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {
        borderRadius: {
          sm: 'calc(var(--radius) - 4px)',
          md: 'calc(var(--radius) - 2px)',
          lg: 'var(--radius)',
          xl: 'calc(var(--radius) + 4px)',
        },
        colors: {
          background: 'oklch(1 0 0)',
          foreground: 'oklch(0.129 0.042 264.695)',
          primary: 'oklch(0.208 0.042 265.755)',
          'primary-foreground': 'oklch(0.984 0.003 247.858)',
          // Agrega aquí las demás variables si quieres que Tailwind las use directamente
        },
      },
    },
    plugins: [require('tailwindcss-animate')],
  }