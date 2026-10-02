import { describe, it, expect, beforeEach } from 'vitest';
import { dinero, aPesos, aMonedaElegida, montoParaCampo, establecerMoneda, establecerSaldosOcultos, obtenerTasas } from './moneda';

// Sin internet en los tests: se usan las tasas de respaldo
// (1 COP = 0.000302 USD = 0.000268 EUR)

beforeEach(() => {
    establecerMoneda('COP');
    establecerSaldosOcultos(false);
});

describe('mostrar montos en la moneda elegida', () => {
    it('en pesos no convierte', () => {
        expect(dinero(30000)).toBe('$30.000');
        expect(dinero(-26900)).toBe('-$26.900');
    });

    it('en dólares convierte con la tasa', () => {
        establecerMoneda('USD');
        expect(obtenerTasas().USD).toBe(0.000302);
        expect(dinero(30000)).toBe('US$9.06');
        expect(dinero(1000000)).toBe('US$302.00');
    });

    it('en euros convierte con la tasa', () => {
        establecerMoneda('EUR');
        // Intl separa el € con un espacio especial (no separable)
        expect(dinero(30000).replace(/\s/, ' ')).toBe('8,04 €');
    });

    it('ocultar saldos tapa el monto en cualquier moneda', () => {
        establecerMoneda('USD');
        establecerSaldosOcultos(true);
        expect(dinero(30000)).toBe('••••••');
        expect(dinero(30000, { ocultable: false })).toBe('US$9.06');
    });
});

describe('formularios', () => {
    it('lo escrito en dólares se guarda en pesos', () => {
        establecerMoneda('USD');
        expect(aPesos('10')).toBe(33113);
        expect(aMonedaElegida(33113)).toBe(10);
    });

    it('lo escrito en euros se guarda en pesos', () => {
        establecerMoneda('EUR');
        expect(aPesos('10')).toBe(37313);
    });

    it('en pesos se guarda tal cual', () => {
        expect(aPesos('30000')).toBe(30000);
        expect(montoParaCampo(30000)).toBe('30000');
    });

    it('al editar sin tocar el monto, conserva los pesos exactos', () => {
        establecerMoneda('USD');
        const campo = montoParaCampo(26900); // "8.12"
        expect(campo).toBe('8.12');
        expect(aPesos(campo, 26900)).toBe(26900);
        // si sí lo cambia, se convierte
        expect(aPesos('10', 26900)).toBe(33113);
    });

    it('un campo vacío queda vacío', () => {
        expect(montoParaCampo(undefined)).toBe('');
        expect(montoParaCampo(null)).toBe('');
    });
});
