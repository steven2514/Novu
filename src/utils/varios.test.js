import { describe, it, expect } from 'vitest';
import { paginasVisibles } from './paginacion';
import { montoAnual, montoMensual } from './suscripciones';
import { buscarMarca } from './marcas';

describe('paginasVisibles', () => {
    it('muestra primera, última y dos a cada lado de la actual, con huecos', () => {
        expect(paginasVisibles(19, 51)).toEqual([0, '…17', 17, 18, 19, 20, 21, '…50', 50]);
    });

    it('sin huecos cuando hay pocas páginas', () => {
        expect(paginasVisibles(0, 3)).toEqual([0, 1, 2]);
    });

    it('en los extremos no inventa páginas', () => {
        expect(paginasVisibles(0, 10)).toEqual([0, 1, 2, '…9', 9]);
        expect(paginasVisibles(9, 10)).toEqual([0, '…7', 7, 8, 9]);
    });

    it('con una sola página o ninguna', () => {
        expect(paginasVisibles(0, 1)).toEqual([0]);
        expect(paginasVisibles(0, 0)).toEqual([]);
    });
});

describe('suscripciones', () => {
    it('lleva cada frecuencia a su costo mensual promedio', () => {
        expect(montoMensual({ monto: 30000, frecuencia: 'mensual' })).toBe(30000);
        expect(montoMensual({ monto: 10000, frecuencia: 'semanal' })).toBe(43333);
        expect(montoMensual({ monto: 1000, frecuencia: 'diario' })).toBe(30417);
    });

    it('una frecuencia desconocida se trata como mensual', () => {
        expect(montoAnual({ monto: 1000, frecuencia: 'rara' })).toBe(12000);
    });
});

describe('buscarMarca', () => {
    it('reconoce la marca dentro del nombre, sin importar mayúsculas ni tildes', () => {
        expect(buscarMarca('Netflix Premium')?.match).toContain('netflix');
        expect(buscarMarca('SPOTIFY familiar')?.match).toContain('spotify');
    });

    it('devuelve null si no la conoce', () => {
        expect(buscarMarca('Gimnasio del barrio')).toBeNull();
        expect(buscarMarca(null)).toBeNull();
    });
});
