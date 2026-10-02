// Pruebas de pantalla: abren la app en Chrome y hacen clic como lo haría una
// persona. Supabase está simulado (e2e/supabaseFalso.js).
// Ejecutar con: npm run test:e2e
import { test, expect } from '@playwright/test';
import { prepararApp } from './supabaseFalso';

// Abre la app con sesión iniciada y espera a que pase la animación de inicio
async function abrir(page, ruta = '/', opciones) {
    const app = await prepararApp(page, opciones);
    await page.goto(ruta);
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 15000 });
    return app;
}

// Elige una opción en uno de los desplegables del formulario
async function elegir(page, etiqueta, opcion) {
    await page.getByRole('combobox', { name: etiqueta }).click();
    await page.getByRole('option', { name: opcion, exact: true }).click();
}

function modal(page) {
    return page.locator('.modal-agregar');
}

test('crear un gasto lo guarda y lo descuenta de la cuenta', async ({ page }) => {
    const { db, llamadas } = await abrir(page);

    await page.getByRole('button', { name: 'Nuevo movimiento' }).first().click();
    await modal(page).getByLabel('Monto (COP)').fill('25000');
    await expect(modal(page).getByLabel('Monto (COP)')).toHaveValue('25.000');
    await elegir(page, 'Categoría', 'Comida');
    await elegir(page, 'Cuenta', 'Nequi');
    await modal(page).getByLabel('Nota').fill('Almuerzo');
    await modal(page).getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Gasto agregado')).toBeVisible();
    await expect(modal(page)).toBeHidden();
    const gasto = llamadas.find(l => l.tipo === 'insert' && l.tabla === 'transacciones').datos[0];
    expect(gasto).toMatchObject({ descripcion: 'Almuerzo', tipo: 'gasto', categoria: 'comida', cuenta: 'Nequi' });
    expect(Number(gasto.monto)).toBe(25000);
    expect(db.cuentas.find(c => c.nombre === 'Nequi').saldo).toBe(275000);

    // El movimiento aparece en la lista de movimientos
    await page.goto('/transacciones');
    await expect(page.getByText('Almuerzo')).toBeVisible();
});

test('un gasto sin categoría no se guarda', async ({ page }) => {
    const { llamadas } = await abrir(page);

    await page.getByRole('button', { name: 'Nuevo movimiento' }).first().click();
    await modal(page).getByLabel('Monto (COP)').fill('10000');
    await modal(page).getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Selecciona una categoría')).toBeVisible();
    expect(llamadas.filter(l => l.tipo === 'insert')).toHaveLength(0);
});

test('transferir mueve el dinero entre cuentas', async ({ page }) => {
    const { db } = await abrir(page);

    await page.getByRole('button', { name: 'Nuevo movimiento' }).first().click();
    await modal(page).getByRole('button', { name: 'Transferencia' }).click();
    await elegir(page, 'Desde la cuenta', 'Nequi');
    await elegir(page, 'Hacia la cuenta', 'Nu');
    await modal(page).getByLabel('Monto (COP)').fill('80000');
    await modal(page).getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Transferencia realizada con éxito')).toBeVisible();
    expect(db.cuentas.find(c => c.nombre === 'Nequi').saldo).toBe(220000);
    expect(db.cuentas.find(c => c.nombre === 'Nu').saldo).toBe(130000);
    expect(db.transferencias).toHaveLength(1);
});

test('no deja transferir más de lo que hay en la cuenta', async ({ page }) => {
    const { db } = await abrir(page);

    await page.getByRole('button', { name: 'Nuevo movimiento' }).first().click();
    await modal(page).getByRole('button', { name: 'Transferencia' }).click();
    await elegir(page, 'Desde la cuenta', 'Nu');
    await elegir(page, 'Hacia la cuenta', 'Nequi');
    await modal(page).getByLabel('Monto (COP)').fill('999999');
    await modal(page).getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Saldo insuficiente en la cuenta de origen')).toBeVisible();
    expect(db.cuentas.find(c => c.nombre === 'Nu').saldo).toBe(50000);
    expect(db.transferencias).toHaveLength(0);
});

test('pagar una suscripción registra el gasto y mueve la renovación', async ({ page }) => {
    const { db } = await abrir(page, '/Suscripciones');
    const renovacionAntes = db.suscripciones[0].fecha_renovacion;

    await page.getByRole('button', { name: 'Pagar $26.900' }).click();

    await expect(page.getByText('Suscripción pagada correctamente')).toBeVisible();
    expect(db.cuentas.find(c => c.nombre === 'Nu').saldo).toBe(50000 - 26900);
    const gasto = db.transacciones.find(t => t.descripcion === 'Netflix');
    expect(gasto).toMatchObject({ tipo: 'gasto', categoria: 'suscripciones', cuenta: 'Nu' });
    expect(db.suscripciones[0].fecha_renovacion > renovacionAntes).toBe(true);
});

test('en dólares los montos se ven convertidos y se guardan en pesos', async ({ page }) => {
    // Tasa simulada: US$1 = $4.000
    const { llamadas } = await abrir(page, '/', { moneda: 'USD' });

    // Balance: 300.000 + 50.000 pesos = US$87.50
    await expect(page.locator('.dashboard-stat-destacada .dashboard-stat-value')).toHaveText('US$87.50');

    await page.getByRole('button', { name: 'Nuevo movimiento' }).first().click();
    await modal(page).getByLabel('Monto (USD)').fill('10.5');
    await elegir(page, 'Categoría', 'Comida');
    await elegir(page, 'Cuenta', 'Nequi');
    await modal(page).getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Gasto agregado')).toBeVisible();
    const gasto = llamadas.find(l => l.tipo === 'insert' && l.tabla === 'transacciones').datos[0];
    expect(Number(gasto.monto)).toBe(42000); // US$10.50 × 4.000
});

test('una cuenta en dólares guarda y muestra su saldo en dólares', async ({ page }) => {
    const { db } = await abrir(page, '/cuentas');

    await page.getByRole('button', { name: 'Nueva cuenta' }).click();
    const formulario = page.locator('.formulario-cuenta');
    await formulario.getByLabel('Nombre').fill('Ahorros USD');
    await formulario.getByLabel('Moneda').selectOption('USD');
    await formulario.getByLabel('Saldo inicial (USD)').fill('120.5');
    await formulario.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Cuenta creada correctamente')).toBeVisible();
    expect(db.cuentas.find(c => c.nombre === 'Ahorros USD')).toMatchObject({ saldo: 120.5, moneda: 'USD' });
    await expect(page.getByText('US$120.50')).toBeVisible();
});
