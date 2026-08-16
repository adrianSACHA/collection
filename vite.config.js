import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/collection/' tylko podczas builda produkcyjnego (GitHub Pages).
// Podczas 'npm run dev' base zostaje '/', żeby lokalny serwer działał normalnie.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/collection/' : '/',
}))