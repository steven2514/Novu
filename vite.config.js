import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA: se puede instalar en el celular o el PC y abre aunque no haya
    // internet (la app queda guardada; los datos se cargan al volver la red).
    // Las respuestas de Supabase NO se guardan en caché: son datos privados y
    // quedarían en el equipo después de cerrar sesión.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'NovuApp · Tus finanzas, en calma',
        short_name: 'Novu',
        description: 'Gastos, cuentas, metas y suscripciones en un solo lugar.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#F7F4EE',
        theme_color: '#0A3A40',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Tipografías de Google Fonts
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
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
