// Movimientos: filtro por fechas
import { test, expect } from '@playwright/test';
import { prepararApp, USUARIO } from './supabaseFalso';

const mov = (id, descripcion, fecha, monto, tipo = 'gasto') => ({
    id, user_id: USUARIO.id, descripcion, monto, tipo, categoria: tipo === 'gasto' ? 'comida' : 'salario', cuenta: 'Nequi', fecha,
});

async function abrirMovimientos(page) {
    const app = await prepararApp(page);
    app.db.transacciones = [
        mov(1, 'Mercado de enero', '2026-01-15', 100000),
        mov(2, 'Cena de marzo', '2026-03-10', 50000),
        mov(3, 'Pago de marzo', '2026-03-20', 900000, 'ingreso'),
        mov(4, 'Regalo de junio', '2026-06-05', 70000),
    ];
    await page.goto('/transacciones');
    await expect(page.getByText('Mercado de enero')).toBeVisible({ timeout: 15000 });
    return app;
}

test('elegir un rango de fechas muestra solo esos movimientos y ajusta los totales', async ({ page }) => {
    await abrirMovimientos(page);

    await page.getByLabel('Desde').fill('2026-03-01');
    await page.getByLabel('Hasta').fill('2026-03-31');

    await expect(page.getByText('Cena de marzo')).toBeVisible();
    await expect(page.getByText('Pago de marzo')).toBeVisible();
    await expect(page.getByText('Mercado de enero')).toBeHidden();
    await expect(page.getByText('Regalo de junio')).toBeHidden();
    await expect(page.locator('.tarjeta-total-gasto h2')).toHaveText('$50.000');
    await expect(page.locator('.tarjeta-total-ingreso h2')).toHaveText('$900.000');

    // Se combina con el buscador y con el tipo
    await page.getByRole('button', { name: 'Gastos', exact: true }).click();
    await expect(page.getByText('Pago de marzo')).toBeHidden();
    await expect(page.getByText('Cena de marzo')).toBeVisible();

    // Quitar fechas vuelve a mostrar todo
    await page.getByRole('button', { name: 'Gastos', exact: true }).click();
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await page.getByRole('button', { name: 'Quitar fechas' }).click();
    await expect(page.getByText('Mercado de enero')).toBeVisible();
    await expect(page.getByText('Regalo de junio')).toBeVisible();
    await expect(page.getByLabel('Desde')).toHaveValue('');
});

test('los atajos rápidos llenan las fechas', async ({ page }) => {
    await abrirMovimientos(page);
    await page.getByRole('button', { name: 'Este año' }).click();
    const anio = new Date().getFullYear();
    await expect(page.getByLabel('Desde')).toHaveValue(`${anio}-01-01`);
    await expect(page.getByLabel('Hasta')).toHaveValue(`${anio}-12-31`);
    await expect(page.getByRole('button', { name: 'Este año' })).toHaveAttribute('aria-pressed', 'true');

    // Cambiar una fecha a mano desmarca el atajo
    await page.getByLabel('Desde').fill(`${anio}-02-01`);
    await expect(page.getByRole('button', { name: 'Este año' })).toHaveAttribute('aria-pressed', 'false');
});
