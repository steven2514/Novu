// Campanita de avisos y resumen del mes
import { test, expect } from '@playwright/test';
import { prepararApp, USUARIO } from './supabaseFalso';

function dia(desplazamiento = 0) {
    const d = new Date();
    d.setDate(d.getDate() + desplazamiento);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function abrir(page, preparar, ruta = '/') {
    const app = await prepararApp(page);
    preparar?.(app.db);
    await page.goto(ruta);
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 15000 });
    return app;
}

test('la campanita cuenta los avisos nuevos y lleva a cada sección', async ({ page }) => {
    await abrir(page, (db) => {
        db.tareas.push({ id: 70, user_id: USUARIO.id, titulo: 'Pagar arriendo', fecha_limite: dia(-2), completada: false, categoria: 'Tarea', prioridad: 'alta' });
        db.presupuestos.push({ id: 80, user_id: USUARIO.id, categoria: 'comida', monto: 10000 });
        db.transacciones.push({ id: 81, user_id: USUARIO.id, descripcion: 'Mercado', monto: 25000, tipo: 'gasto', categoria: 'comida', cuenta: 'Nequi', fecha: dia(0) });
    });

    // Netflix (se cobra en 3 días), presupuesto pasado y tarea atrasada
    const campana = page.getByRole('button', { name: /Ver avisos \(3 nuevos\)/ });
    await expect(campana).toBeVisible();
    await campana.click();

    const panel = page.locator('.avisos-panel');
    await expect(panel.getByText('"Pagar arriendo" está atrasada 2 días')).toBeVisible();
    await expect(panel.getByText(/Te pasaste del presupuesto de Comida/)).toBeVisible();
    await expect(panel.getByText(/Netflix se cobra en 3 días/)).toBeVisible();
    // Las alertas van primero
    await expect(panel.locator('.aviso').first()).toHaveClass(/aviso-alerta/);

    await panel.getByText('"Pagar arriendo" está atrasada 2 días').click();
    await expect(page).toHaveURL(/\/Aprendizaje$/);
    await expect(panel).toBeHidden();

    // Ya vistos: la campanita queda sin número
    await expect(page.getByRole('button', { name: 'Ver avisos', exact: true })).toBeVisible();
});

test('sin pendientes la campanita dice que todo está en orden', async ({ page }) => {
    await abrir(page, (db) => { db.suscripciones = []; });
    await page.getByRole('button', { name: 'Ver avisos', exact: true }).click();
    await expect(page.getByText('Todo en orden')).toBeVisible();
});

test('el resumen del mes muestra ahorro, categorías y destacados', async ({ page }) => {
    await abrir(page, (db) => {
        db.transacciones = [
            { id: 1, user_id: USUARIO.id, descripcion: 'Salario', monto: 2000000, tipo: 'ingreso', categoria: 'salario', cuenta: 'Nequi', fecha: dia(0) },
            { id: 2, user_id: USUARIO.id, descripcion: 'Mercado', monto: 300000, tipo: 'gasto', categoria: 'comida', cuenta: 'Nequi', fecha: dia(0) },
            { id: 3, user_id: USUARIO.id, descripcion: 'Bus', monto: 100000, tipo: 'gasto', categoria: 'transporte', cuenta: 'Nequi', fecha: dia(0) },
        ];
    });

    await page.getByRole('button', { name: 'Resumen del mes' }).click();
    const resumen = page.locator('.resumen-mes');
    await expect(resumen.getByText('Ahorraste $1.600.000')).toBeVisible();
    await expect(resumen.getByText('El 80% de lo que ganaste quedó sin gastar.')).toBeVisible();
    await expect(resumen.locator('.resumen-mes-categorias li').first()).toContainText('Comida');
    await expect(resumen.getByText('Tu mayor gasto')).toBeVisible();
    await expect(resumen.getByText('Mercado')).toBeVisible();

    await resumen.getByRole('button', { name: 'Cerrar' }).click();
    await expect(resumen).toBeHidden();
});
