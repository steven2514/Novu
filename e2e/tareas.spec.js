// Tareas: tiempo estimado, cronómetro, tareas que se repiten y vistas por fecha
import { test, expect } from '@playwright/test';
import { prepararApp, USUARIO } from './supabaseFalso';

function dia(desplazamiento = 0) {
    const d = new Date();
    d.setDate(d.getDate() + desplazamiento);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Abre Tareas con estas tareas ya guardadas
async function abrirTareas(page, tareas = []) {
    const app = await prepararApp(page);
    app.db.tareas.push(...tareas.map((tarea, i) => ({
        id: 500 + i, user_id: USUARIO.id, descripcion: '', categoria: 'Tarea', prioridad: 'media',
        completada: false, segundos_trabajados: 0, repetir: 'nunca', creada_en: new Date(Date.now() - 2 * 86400000).toISOString(),
        ...tarea,
    })));
    await page.goto('/Aprendizaje');
    await expect(page.locator('.aprendizaje-page')).toBeVisible({ timeout: 15000 });
    return app;
}

const fila = (page, titulo) => page.locator('.tarea-item').filter({ hasText: titulo });

test('crear una tarea con tiempo estimado y que se repite cada día', async ({ page }) => {
    const { llamadas } = await abrirTareas(page);

    await page.getByRole('button', { name: 'Nueva tarea' }).click();
    const formulario = page.locator('.formulario-tarea');
    await formulario.getByLabel('Título').fill('Leer 30 páginas');
    await formulario.getByLabel('Fecha límite (opcional)').fill(dia(0));
    await formulario.getByLabel('Tiempo estimado (opcional)').selectOption('60');
    await formulario.getByLabel('Repetir').selectOption('diaria');
    await formulario.getByRole('button', { name: 'Crear tarea' }).click();
    await expect(fila(page, 'Leer 30 páginas')).toBeVisible();

    const nueva = llamadas.find(l => l.tipo === 'insert' && l.tabla === 'tareas').datos[0];
    expect(nueva).toMatchObject({ titulo: 'Leer 30 páginas', minutos_estimados: 60, repetir: 'diaria', completada: false });
    expect(nueva.creada_en).toBeTruthy();

    const tarea = fila(page, 'Leer 30 páginas');
    await expect(tarea.getByText('Cada día')).toBeVisible();
    await expect(tarea.getByText('Estimado 1 h')).toBeVisible();

    // Está en "Hoy" y no en "Atrasadas"
    await page.getByRole('button', { name: /^Hoy/ }).click();
    await expect(tarea).toBeVisible();
    await page.getByRole('button', { name: /^Atrasadas/ }).click();
    await expect(tarea).toBeHidden();
});

test('el cronómetro cuenta el tiempo trabajado y se guarda al pausar', async ({ page }) => {
    const { db } = await abrirTareas(page, [{ titulo: 'Informe' }]);

    await page.getByRole('button', { name: 'Empezar cronómetro de Informe' }).click();
    expect(db.tareas[0].cronometro_desde).toBeTruthy();
    await expect(page.locator('.cronometro-corriendo')).toHaveText(/00:0[1-9]/, { timeout: 5000 });

    await page.getByRole('button', { name: 'Pausar cronómetro de Informe' }).click();
    await expect.poll(() => db.tareas[0].cronometro_desde).toBeNull();
    expect(db.tareas[0].segundos_trabajados).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Empezar cronómetro de Informe' })).toHaveText(/\d+ s/);
});

test('solo corre un cronómetro a la vez', async ({ page }) => {
    const { db } = await abrirTareas(page, [{ titulo: 'Uno' }, { titulo: 'Dos' }]);

    await page.getByRole('button', { name: 'Empezar cronómetro de Uno' }).click();
    await page.getByRole('button', { name: 'Empezar cronómetro de Dos' }).click();

    await expect.poll(() => db.tareas[1].cronometro_desde).toBeTruthy();
    expect(db.tareas[0].cronometro_desde).toBeNull();
    await expect(page.locator('.cronometro-corriendo')).toHaveCount(1);
});

test('terminar una tarea guarda cuánto tardó y crea la próxima si se repite', async ({ page }) => {
    const { db } = await abrirTareas(page, [{ titulo: 'Gimnasio', fecha_limite: dia(0), repetir: 'diaria', segundos_trabajados: 3000, minutos_estimados: 60 }]);

    await fila(page, 'Gimnasio').getByRole('button', { name: 'Marcar como completada' }).click();

    await expect(page.getByText(/La próxima queda para el/)).toBeVisible();
    expect(db.tareas[0]).toMatchObject({ completada: true });
    expect(db.tareas[0].completada_en).toBeTruthy();
    const proxima = db.tareas.find(t => t.id !== 500);
    expect(proxima).toMatchObject({ titulo: 'Gimnasio', fecha_limite: dia(1), completada: false, repetir: 'diaria' });

    const terminada = page.locator('.tarea-completada').filter({ hasText: 'Gimnasio' });
    await expect(terminada.getByText('Terminada en 2 días')).toBeVisible();
    await expect(terminada.getByText('Trabajaste 50 min de 1 h')).toBeVisible();
});

test('la vista Atrasadas muestra las pendientes vencidas con su contador', async ({ page }) => {
    await abrirTareas(page, [
        { titulo: 'Pagar recibo', fecha_limite: dia(-2) },
        { titulo: 'Llamar al banco', fecha_limite: dia(3) },
    ]);

    const atrasadas = page.getByRole('button', { name: /^Atrasadas/ });
    await expect(atrasadas.locator('.tab-contador')).toHaveText('1');
    await atrasadas.click();
    await expect(fila(page, 'Pagar recibo')).toBeVisible();
    await expect(fila(page, 'Llamar al banco')).toBeHidden();
    await expect(fila(page, 'Pagar recibo').locator('.tarea-fecha-atrasada')).toBeVisible();
});
