import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Puerto fijo: si el 5173 está ocupado, Vite avisa en vez de saltar a otro
  server: {
    port: 5173,
    strictPort: true,
  },
  // Tests (npm test). La zona horaria se fija en Bogotá: los errores de fechas
  // que corrigen utils/fechas.js sólo aparecen en zonas con desfase respecto a
  // UTC, y así los tests dan lo mismo en cualquier máquina o en GitHub Actions.
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    env: { TZ: 'America/Bogota' },
  },
})
