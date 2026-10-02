import { defineConfig } from '@playwright/test';

// Pruebas de pantalla (npm run test:e2e). Usan el Chrome instalado en el
// equipo y levantan la app en el puerto 5199 para no chocar con `npm run dev`.
export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5199',
        channel: 'chrome',
        locale: 'es-CO',
        timezoneId: 'America/Bogota',
        // Sin el service worker de la PWA: así cada prueba ve la versión actual
        serviceWorkers: 'block',
    },
    webServer: {
        command: 'npx vite --port 5199 --strictPort',
        url: 'http://localhost:5199',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
});
