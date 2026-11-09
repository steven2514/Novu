import { describe, it, expect, beforeEach } from 'vitest';
import { calcularAvisos, alertasPorNotificar, marcarAvisosVistos, avisosVistos } from './avisos';
import { resumenDelMes } from './resumenMes';

// Miércoles 4 de noviembre de 2026
const HOY = new Date(2026, 10, 4, 10, 0, 0);

describe('avisos', () => {
    it('suscripciones: vencida, hoy, mañana y en pocos días; las lejanas no', () => {
        const avisos = calcularAvisos({
            suscripciones: [
                { id: 1, nombre: 'Netflix', monto: 26900, fecha_renovacion: '2026-11-02' },
                { id: 2, nombre: 'Spotify', monto: 16900, fecha_renovacion: '2026-11-04' },
                { id: 3, nombre: 'iCloud', monto: 3900, fecha_renovacion: '2026-11-05' },
                { id: 4, nombre: 'Disney', monto: 20000, fecha_renovacion: '2026-11-07' },
                { id: 5, nombre: 'Gym', monto: 90000, fecha_renovacion: '2026-11-20' },
            ],
        }, HOY);
        expect(avisos.map(a => [a.vars.nombre, a.clave, a.nivel])).toEqual([
            ['Netflix', 'avisos.suscripcionVencida', 'alerta'],
            ['Spotify', 'avisos.suscripcionHoy', 'alerta'],
            ['iCloud', 'avisos.suscripcionManana', 'alerta'],
            ['Disney', 'avisos.suscripcionPronto', 'info'],
        ]);
        expect(avisos[0].vars.n).toBe(2);
        expect(avisos[3].vars.n).toBe(3);
    });

    it('presupuestos: avisa desde el 80% y alerta al pasarse, solo con gastos del mes', () => {
        const transacciones = [
            { tipo: 'gasto', categoria: 'comida', monto: 450000, fecha: '2026-11-02' },
            { tipo: 'gasto', categoria: 'transporte', monto: 85000, fecha: '2026-11-03' },
            { tipo: 'gasto', categoria: 'ocio', monto: 999999, fecha: '2026-10-15' }, // otro mes
        ];
        const avisos = calcularAvisos({
            presupuestos: [
                { id: 1, categoria: 'comida', monto: 400000 },
                { id: 2, categoria: 'transporte', monto: 100000 },
                { id: 3, categoria: 'ocio', monto: 100000 },
            ],
            transacciones,
        }, HOY);
        expect(avisos).toHaveLength(2);
        expect(avisos[0]).toMatchObject({ clave: 'avisos.presupuestoPasado', nivel: 'alerta', vars: { categoria: 'comida', porcentaje: 113 } });
        expect(avisos[1]).toMatchObject({ clave: 'avisos.presupuestoCerca', nivel: 'info', vars: { categoria: 'transporte', porcentaje: 85 } });
    });

    it('tareas: atrasadas, de hoy y de mañana; no las completadas', () => {
        const avisos = calcularAvisos({
            tareas: [
                { id: 1, titulo: 'Informe', fecha_limite: '2026-11-01', completada: false },
                { id: 2, titulo: 'Llamar', fecha_limite: '2026-11-04', completada: false },
                { id: 3, titulo: 'Pagar', fecha_limite: '2026-11-05', completada: false },
                { id: 4, titulo: 'Hecha', fecha_limite: '2026-11-01', completada: true },
                { id: 5, titulo: 'Lejos', fecha_limite: '2026-11-30', completada: false },
                { id: 6, titulo: 'Sin fecha', completada: false },
            ],
        }, HOY);
        expect(avisos.map(a => [a.vars.nombre, a.clave])).toEqual([
            ['Informe', 'avisos.tareaAtrasada'],
            ['Llamar', 'avisos.tareaHoy'],
            ['Pagar', 'avisos.tareaManana'],
        ]);
    });

    describe('leídos y notificados', () => {
        // Las pruebas corren sin navegador: localStorage simulado en memoria
        beforeEach(() => {
            const datos = new Map();
            globalThis.localStorage = {
                getItem: (k) => (datos.has(k) ? datos.get(k) : null),
                setItem: (k, v) => datos.set(k, String(v)),
            };
        });

        it('marca como vistos los avisos actuales', () => {
            marcarAvisosVistos([{ id: 'a' }, { id: 'b' }]);
            expect(avisosVistos()).toEqual(['a', 'b']);
        });

        it('cada alerta se notifica una sola vez', () => {
            const avisos = [{ id: 'x', nivel: 'alerta' }, { id: 'y', nivel: 'info' }];
            expect(alertasPorNotificar(avisos).map(a => a.id)).toEqual(['x']);
            expect(alertasPorNotificar(avisos)).toEqual([]);
            expect(alertasPorNotificar([...avisos, { id: 'z', nivel: 'alerta' }]).map(a => a.id)).toEqual(['z']);
        });
    });
});

describe('resumen del mes', () => {
    const transacciones = [
        { tipo: 'ingreso', categoria: 'salario', monto: 3000000, fecha: '2026-11-01', descripcion: 'Salario' },
        { tipo: 'gasto', categoria: 'comida', monto: 300000, fecha: '2026-11-02', descripcion: 'Mercado' },
        { tipo: 'gasto', categoria: 'comida', monto: 100000, fecha: '2026-11-02', descripcion: 'Almuerzo' },
        { tipo: 'gasto', categoria: 'transporte', monto: 200000, fecha: '2026-11-03', descripcion: 'Gasolina' },
        // Mes anterior
        { tipo: 'ingreso', categoria: 'salario', monto: 2000000, fecha: '2026-10-01' },
        { tipo: 'gasto', categoria: 'comida', monto: 200000, fecha: '2026-10-05' },
        { tipo: 'gasto', categoria: 'transporte', monto: 400000, fecha: '2026-10-06' },
    ];

    it('totales, ahorro y comparación con el mes anterior', () => {
        const r = resumenDelMes(transacciones, HOY, HOY);
        expect(r).toMatchObject({ hayDatos: true, movimientos: 4, ingresos: 3000000, gastos: 600000, balance: 2400000 });
        expect(r.tasaAhorro).toBe(80);
        expect(r.tendenciaIngresos).toBe(50);
        expect(r.tendenciaGastos).toBe(0);
    });

    it('categorías ordenadas y la que más subió', () => {
        const r = resumenDelMes(transacciones, HOY, HOY);
        expect(r.categorias.map(c => [c.categoria, c.valor, Math.round(c.porcentaje)])).toEqual([
            ['comida', 400000, 67],
            ['transporte', 200000, 33],
        ]);
        expect(r.masSubio).toMatchObject({ categoria: 'comida', diferencia: 200000 });
    });

    it('mayor gasto, día de más gasto y promedio por día transcurrido', () => {
        const r = resumenDelMes(transacciones, HOY, HOY);
        expect(r.mayorGasto).toMatchObject({ descripcion: 'Mercado', monto: 300000 });
        expect(r.diaMasGasto).toEqual({ fecha: '2026-11-02', valor: 400000 });
        expect(r.promedioDiario).toBe(150000); // 600.000 en 4 días
    });

    it('un mes pasado divide entre todos sus días; uno sin datos lo indica', () => {
        const octubre = resumenDelMes(transacciones, new Date(2026, 9, 1), HOY);
        expect(octubre.promedioDiario).toBeCloseTo(600000 / 31);
        expect(octubre.tasaAhorro).toBe(70);
        const vacio = resumenDelMes(transacciones, new Date(2026, 5, 1), HOY);
        expect(vacio.hayDatos).toBe(false);
        expect(vacio.tasaAhorro).toBeNull();
        expect(vacio.mayorGasto).toBeNull();
    });
});
