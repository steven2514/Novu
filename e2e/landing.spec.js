// Landing: barra fija y botones visibles en celular
import { test, expect } from '@playwright/test';
import { prepararApp } from './supabaseFalso';

async function abrirLanding(page) {
    await prepararApp(page, { conSesion: false });
    await page.goto('/');
    await expect(page.locator('.lp-nav-barra')).toBeVisible({ timeout: 15000 });
}

test('la barra superior queda fija al bajar por la página', async ({ page }) => {
    await abrirLanding(page);

    await page.locator('.lp').evaluate((lp) => lp.scrollTo({ top: 2500, behavior: 'instant' }));
    await page.waitForTimeout(300);

    const caja = await page.locator('.lp-nav-barra').boundingBox();
    expect(Math.round(caja.y)).toBe(0);
    await expect(page.getByRole('button', { name: 'Crear cuenta' }).first()).toBeInViewport();
});

test.describe('en el celular', () => {
    test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

    test('se ven "Iniciar sesión" y "Crear cuenta"', async ({ page }) => {
        await abrirLanding(page);
        const barra = page.locator('.lp-nav-barra');

        await expect(barra.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
        await expect(barra.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();

        // Nada se sale de la pantalla a lo ancho
        const anchoPagina = await page.locator('.lp').evaluate((lp) => lp.scrollWidth);
        expect(anchoPagina).toBeLessThanOrEqual(360);

        await barra.getByRole('button', { name: 'Iniciar sesión' }).tap();
        await expect(page).toHaveURL(/\/login$/);
    });
});
