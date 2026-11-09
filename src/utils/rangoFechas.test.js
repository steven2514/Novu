import { describe, it, expect } from 'vitest';
import { rangoDeAtajo, dentroDelRango } from './rangoFechas';

// Domingo 8 de noviembre de 2026
const HOY = new Date(2026, 10, 8, 21, 0, 0);

describe('atajos de fecha', () => {
    it('calcula cada rango desde hoy', () => {
        expect(rangoDeAtajo('mes', HOY)).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' });
        expect(rangoDeAtajo('mesPasado', HOY)).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
        expect(rangoDeAtajo('semana', HOY)).toEqual({ desde: '2026-11-02', hasta: '2026-11-08' });
        expect(rangoDeAtajo('anio', HOY)).toEqual({ desde: '2026-01-01', hasta: '2026-12-31' });
        expect(rangoDeAtajo('todo', HOY)).toEqual({ desde: '', hasta: '' });
    });

    it('el mes pasado de enero es diciembre del año anterior', () => {
        expect(rangoDeAtajo('mesPasado', new Date(2027, 0, 15))).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' });
    });
});

describe('dentro del rango', () => {
    it('incluye los dos extremos', () => {
        const rango = { desde: '2026-11-01', hasta: '2026-11-30' };
        expect(dentroDelRango('2026-11-01', rango)).toBe(true);
        expect(dentroDelRango('2026-11-30', rango)).toBe(true);
        expect(dentroDelRango('2026-10-31', rango)).toBe(false);
        expect(dentroDelRango('2026-12-01', rango)).toBe(false);
    });

    it('funciona con solo "desde" o solo "hasta"', () => {
        expect(dentroDelRango('2026-12-25', { desde: '2026-11-01', hasta: '' })).toBe(true);
        expect(dentroDelRango('2026-10-25', { desde: '2026-11-01', hasta: '' })).toBe(false);
        expect(dentroDelRango('2020-01-01', { desde: '', hasta: '2026-11-01' })).toBe(true);
    });

    it('sin rango deja pasar todo; si están al revés los ordena', () => {
        expect(dentroDelRango('2026-11-05', { desde: '', hasta: '' })).toBe(true);
        expect(dentroDelRango('2026-11-05', { desde: '2026-11-30', hasta: '2026-11-01' })).toBe(true);
    });

    it('fechas guardadas con hora se toman como su día', () => {
        expect(dentroDelRango('2026-11-30T00:00:00+00:00', { desde: '2026-11-30', hasta: '2026-11-30' })).toBe(true);
    });
});
