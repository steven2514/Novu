import { describe, it, expect } from 'vitest';
import { parseFecha, aISO, aInputFecha, mismoMes, mismoDia, compararFechas } from './fechas';

// Estos tests corren con TZ=America/Bogota (ver vite.config.js): es la zona
// donde JavaScript corría las fechas un día hacia atrás.

describe('parseFecha', () => {
    it('lee una fecha de calendario como ese mismo día, sin correrla por la zona horaria', () => {
        expect(aISO(parseFecha('2026-09-24'))).toBe('2026-09-24');
    });

    it('lee igual las fechas que Supabase devuelve con medianoche UTC', () => {
        expect(aISO(parseFecha('2026-09-24T00:00:00+00:00'))).toBe('2026-09-24');
        expect(aISO(parseFecha('2026-09-24T00:00:00.000Z'))).toBe('2026-09-24');
        expect(aISO(parseFecha('2026-09-24T00:00:00'))).toBe('2026-09-24');
    });

    it('convierte a hora local los instantes con hora real (filas antiguas)', () => {
        // 02:30 UTC del 25 son las 21:30 del 24 en Bogotá: el usuario lo creó el 24.
        expect(aISO(parseFecha('2026-09-25T02:30:00+00:00'))).toBe('2026-09-24');
    });

    it('devuelve null con valores vacíos o inválidos', () => {
        expect(parseFecha(null)).toBeNull();
        expect(parseFecha('')).toBeNull();
        expect(parseFecha('no es fecha')).toBeNull();
    });
});

describe('mismoMes', () => {
    it('un ingreso del día 1 cuenta en su propio mes (antes caía en el anterior)', () => {
        const unoDeOctubre = parseFecha('2026-10-01T00:00:00+00:00');
        expect(mismoMes(unoDeOctubre, new Date(2026, 9, 15))).toBe(true);
        expect(mismoMes(unoDeOctubre, new Date(2026, 8, 15))).toBe(false);
    });

    it('es falso si falta alguna fecha', () => {
        expect(mismoMes(null, new Date())).toBe(false);
    });
});

describe('utilidades', () => {
    it('aInputFecha deja el formato de <input type="date">', () => {
        expect(aInputFecha('2026-09-24T00:00:00+00:00')).toBe('2026-09-24');
        expect(aInputFecha(null)).toBe('');
    });

    it('mismoDia compara día, mes y año', () => {
        expect(mismoDia(new Date(2026, 8, 24, 8), new Date(2026, 8, 24, 23))).toBe(true);
        expect(mismoDia(new Date(2026, 8, 24), new Date(2026, 8, 25))).toBe(false);
    });

    it('compararFechas ordena de la más antigua a la más reciente', () => {
        const fechas = ['2026-09-24', '2026-01-02', '2026-05-10'];
        expect(fechas.sort(compararFechas)).toEqual(['2026-01-02', '2026-05-10', '2026-09-24']);
    });
});
