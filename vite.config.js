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
})
