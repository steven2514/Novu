// Pruebas en tamaño de celular (iPhone 13: 390 × 844)
import { test, expect } from '@playwright/test';
import { prepararApp } from './supabaseFalso';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('iniciar sesión en el celular entra al panel', async ({ page }) => {
    // Antes la cuadrícula decorativa del panel de marca tapaba el formulario
    // y el botón "Iniciar sesión" no respondía al tocarlo.
    const { llamadas } = await prepararApp(page, { conSesion: false });
    await page.goto('/login');

    await page.locator('#login-email').fill('prueba@novu.app');
    await page.locator('#login-password').fill('secreta123');
    await page.locator('.login-btn-principal').tap();

    await expect(page.locator('.topbar-movil')).toBeVisible({ timeout: 15000 });
    expect(llamadas.find(l => l.tipo === 'login').datos).toMatchObject({ email: 'prueba@novu.app' });
});

test('en el celular el texto tiene tamaño normal y los campos no hacen zoom', async ({ page }) => {
    await prepararApp(page);
    await page.goto('/');
    await expect(page.locator('.topbar-movil')).toBeVisible({ timeout: 15000 });

    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('16px');
    await page.locator('.topbar-movil-agregar').tap();
    const letraCampo = await page.locator('.modal-agregar input').first().evaluate(e => parseFloat(getComputedStyle(e).fontSize));
    expect(letraCampo).toBeGreaterThanOrEqual(16);
});
