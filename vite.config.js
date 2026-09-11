import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base = '/collection/' tylko podczas builda produkcyjnego (GitHub Pages).
// Podczas 'npm run dev' base zostaje '/', żeby lokalny serwer działał normalnie.
export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), react()],
  base: command === 'build' ? '/collection/' : '/',
  build: {
    rollupOptions: {
      output: {
        // Rozdzielenie bibliotek zewnętrznych od kodu aplikacji - mniejsze,
        // lepiej cache'owane chunki i szybszy pierwszy render.
        codeSplitting: {
          groups: [
            {
              name: 'supabase',
              test: /node_modules[\\/]@supabase/,
            },
            {
              name: 'react-query',
              test: /node_modules[\\/]@tanstack/,
            },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
}))