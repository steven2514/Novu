import { describe, it, expect, vi } from 'vitest';
import {
    segundosTrabajados, pausarCronometro, duracionCorta, reloj, segundosHastaTerminar,
    siguienteFecha, tareaSiguiente, estaAtrasada, enVista, guardarConRespaldo,
} from './tareas';

// Miércoles 4 de noviembre de 2026, 10:00 a. m.
const HOY = new Date(2026, 10, 4, 10, 0, 0);

describe('cronómetro', () => {
    it('suma lo guardado y el rato que lleva corriendo', () => {
        const desde = new Date(HOY.getTime() - 90 * 1000).toISOString();
        expect(segundosTrabajados({ segundos_trabajados: 600 }, HOY)).toBe(600);
        expect(segundosTrabajados({ segundos_trabajados: 600, cronometro_desde: desde }, HOY)).toBe(690);
        expect(segundosTrabajados({}, HOY)).toBe(0);
    });

    it('al pausar guarda el total y lo detiene', () => {
        const desde = new Date(HOY.getTime() - 60 * 1000).toISOString();
        expect(pausarCronometro({ segundos_trabajados: 30, cronometro_desde: desde }, HOY))
            .toEqual({ segundos_trabajados: 90, cronometro_desde: null });
    });

    it('muestra los tiempos de forma corta', () => {
        expect(duracionCorta(45)).toBe('45 s');
        expect(duracionCorta(12 * 60)).toBe('12 min');
        expect(duracionCorta(3600)).toBe('1 h');
        expect(duracionCorta(3600 + 5 * 60)).toBe('1 h 05 min');
        expect(reloj(249)).toBe('04:09');
        expect(reloj(3849)).toBe('1:04:09');
    });

    it('calcula cuánto tardó desde que se creó hasta que se terminó', () => {
        expect(segundosHastaTerminar({ creada_en: '2026-11-02T10:00:00Z', completada_en: '2026-11-04T10:00:00Z' })).toBe(2 * 86400);
        expect(segundosHastaTerminar({ completada_en: '2026-11-04T10:00:00Z' })).toBeNull();
    });
});

describe('tareas que se repiten', () => {
    it('la próxima fecha sale de la fecha límite', () => {
        expect(siguienteFecha('2026-11-04', 'diaria', HOY)).toBe('2026-11-05');
        expect(siguienteFecha('2026-11-04', 'semanal', HOY)).toBe('2026-11-11');
        expect(siguienteFecha('2026-11-04', 'mensual', HOY)).toBe('2026-12-04');
    });

    it('una tarea atrasada vuelve después de hoy, no en el pasado', () => {
        expect(siguienteFecha('2026-10-30', 'diaria', HOY)).toBe('2026-11-05');
        expect(siguienteFecha('2026-10-28', 'semanal', HOY)).toBe('2026-11-11');
    });

    it('sin fecha límite parte de hoy', () => {
        expect(siguienteFecha(null, 'semanal', HOY)).toBe('2026-11-11');
    });

    it('el 31 de cada mes cae en el último día de los meses cortos y vuelve al 31', () => {
        const enero = new Date(2027, 0, 31, 12);
        expect(siguienteFecha('2027-01-31', 'mensual', enero)).toBe('2027-02-28');
        const febrero = new Date(2027, 1, 28, 12);
        expect(siguienteFecha('2027-01-31', 'mensual', febrero)).toBe('2027-03-31');
    });

    it('las que no se repiten no tienen próxima fecha', () => {
        expect(siguienteFecha('2026-11-04', 'nunca', HOY)).toBeNull();
        expect(siguienteFecha('2026-11-04', undefined, HOY)).toBeNull();
        expect(tareaSiguiente({ titulo: 'x', repetir: 'nunca' }, HOY)).toBeNull();
    });

    it('la copia nueva queda pendiente y sin tiempo trabajado', () => {
        const copia = tareaSiguiente({
            id: 1, titulo: 'Gym', categoria: 'Actividad Diaria', prioridad: 'media', fecha_limite: '2026-11-04',
            repetir: 'diaria', completada: true, segundos_trabajados: 3600, minutos_estimados: 60, user_id: 'u',
        }, HOY);
        expect(copia).toMatchObject({ titulo: 'Gym', fecha_limite: '2026-11-05', completada: false, repetir: 'diaria', minutos_estimados: 60 });
        expect(copia).not.toHaveProperty('id');
        expect(copia).not.toHaveProperty('segundos_trabajados');
    });
});

describe('vistas', () => {
    const tarea = (fecha_limite, completada = false) => ({ fecha_limite, completada });

    it('Hoy muestra solo las de hoy', () => {
        expect(enVista(tarea('2026-11-04'), 'hoy', HOY)).toBe(true);
        expect(enVista(tarea('2026-11-05'), 'hoy', HOY)).toBe(false);
        expect(enVista(tarea(null), 'hoy', HOY)).toBe(false);
    });

    it('Esta semana va de lunes a domingo', () => {
        expect(enVista(tarea('2026-11-02'), 'semana', HOY)).toBe(true); // lunes
        expect(enVista(tarea('2026-11-08'), 'semana', HOY)).toBe(true); // domingo
        expect(enVista(tarea('2026-11-01'), 'semana', HOY)).toBe(false);
        expect(enVista(tarea('2026-11-09'), 'semana', HOY)).toBe(false);
    });

    it('Atrasadas son las pendientes con fecha pasada', () => {
        expect(estaAtrasada(tarea('2026-11-03'), HOY)).toBe(true);
        expect(estaAtrasada(tarea('2026-11-03', true), HOY)).toBe(false);
        expect(estaAtrasada(tarea('2026-11-04'), HOY)).toBe(false);
        expect(enVista(tarea(null), 'atrasadas', HOY)).toBe(false);
        expect(enVista(tarea(null), 'todas', HOY)).toBe(true);
    });
});

describe('base de datos sin la migración v5', () => {
    it('si faltan las columnas nuevas, reintenta sin ellas', async () => {
        const guardar = vi.fn()
            .mockResolvedValueOnce({ error: { code: 'PGRST204' } })
            .mockResolvedValueOnce({ data: 'ok', error: null });
        const r = await guardarConRespaldo({ completada: true, completada_en: 'x' }, guardar);
        expect(r.data).toBe('ok');
        expect(guardar).toHaveBeenLastCalledWith({ completada: true });
    });

    it('si solo había columnas nuevas, avisa en vez de guardar vacío', async () => {
        const guardar = vi.fn().mockResolvedValue({ error: { code: 'PGRST204' } });
        const r = await guardarConRespaldo({ cronometro_desde: 'x' }, guardar);
        expect(r.error.code).toBe('sin-migracion');
        expect(guardar).toHaveBeenCalledTimes(1);
    });
});
