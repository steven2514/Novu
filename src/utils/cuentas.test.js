import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase simulado. Las cadenas .update().eq().eq() devuelven una promesa.
const rpc = vi.fn();
const pasos = [];
function cadena(tabla) {
    const registro = { tabla, cambios: null, filtros: [] };
    pasos.push(registro);
    const api = {
        update(cambios) { registro.cambios = cambios; return api; },
        eq(campo, valor) { registro.filtros.push([campo, valor]); return api; },
        then(resolver) { return Promise.resolve({ error: null }).then(resolver); },
    };
    return api;
}
vi.mock('../supabase', () => ({ supabase: { rpc: (...a) => rpc(...a), from: (t) => cadena(t) } }));

const { nombreDuplicado, renombrarCuenta } = await import('./cuentas');

beforeEach(() => {
    vi.clearAllMocks();
    pasos.length = 0;
});

describe('nombreDuplicado', () => {
    const cuentas = [{ id: 1, nombre: 'Bancolombia' }, { id: 2, nombre: 'Efectivo' }];

    it('detecta nombres repetidos sin importar mayúsculas ni espacios', () => {
        expect(nombreDuplicado(cuentas, '  bancolombia ')).toBe(true);
        expect(nombreDuplicado(cuentas, 'Nequi')).toBe(false);
    });

    it('al editar, la propia cuenta no cuenta como duplicado', () => {
        expect(nombreDuplicado(cuentas, 'Bancolombia', 1)).toBe(false);
        expect(nombreDuplicado(cuentas, 'Efectivo', 1)).toBe(true);
    });
});

describe('renombrarCuenta', () => {
    const cuenta = { id: 5, nombre: 'Viejo' };

    it('no hace nada si el nombre no cambió', async () => {
        expect(await renombrarCuenta(cuenta, ' Viejo ', 'u1')).toEqual({});
        expect(rpc).not.toHaveBeenCalled();
    });

    it('usa la función SQL, que lo cambia todo en una transacción', async () => {
        rpc.mockResolvedValue({ error: null });
        expect(await renombrarCuenta(cuenta, 'Nuevo', 'u1')).toEqual({});
        expect(rpc).toHaveBeenCalledWith('renombrar_cuenta', { p_cuenta_id: '5', p_nombre: 'Nuevo' });
        expect(pasos).toHaveLength(0);
    });

    it('marca como duplicado el error 23505 de la base de datos', async () => {
        rpc.mockResolvedValue({ error: { code: '23505' } });
        const r = await renombrarCuenta(cuenta, 'Otra', 'u1');
        expect(r.error.duplicado).toBe(true);
    });

    it('sin la migración, renombra la cuenta y todo lo que la menciona', async () => {
        rpc.mockResolvedValue({ error: { code: 'PGRST202' } });
        expect(await renombrarCuenta(cuenta, 'Nuevo', 'u1')).toEqual({});
        expect(pasos.map(p => p.tabla)).toEqual(['cuentas', 'transacciones', 'suscripciones', 'transferencias', 'transferencias']);
        const trans = pasos.find(p => p.tabla === 'transacciones');
        expect(trans.cambios).toEqual({ cuenta: 'Nuevo' });
        expect(trans.filtros).toContainEqual(['cuenta', 'Viejo']);
        expect(trans.filtros).toContainEqual(['user_id', 'u1']);
    });
});
