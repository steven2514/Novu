import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase simulado: rpc() y from().update().eq() devuelven lo que diga cada test.
const rpc = vi.fn();
const eq = vi.fn();
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
vi.mock('../supabase', () => ({ supabase: { rpc: (...a) => rpc(...a), from: (...a) => from(...a) } }));

const { ajustarSaldos, revertirSaldos, ajustarMeta, efectoEnSaldo, conSaldosNuevos, reiniciarDeteccion } = await import('./saldos');

const funcionInexistente = { code: 'PGRST202', message: 'Could not find the function' };

beforeEach(() => {
    vi.clearAllMocks();
    reiniciarDeteccion();
    eq.mockResolvedValue({ error: null });
});

describe('efectoEnSaldo', () => {
    it('los ingresos suman y los gastos restan', () => {
        expect(efectoEnSaldo('ingreso', '5000')).toBe(5000);
        expect(efectoEnSaldo('gasto', 5000)).toBe(-5000);
    });
});

describe('ajustarSaldos con las funciones SQL (migración v3)', () => {
    it('suma dentro de la base de datos y usa el saldo que devuelve', async () => {
        rpc.mockResolvedValue({ data: 130000, error: null });
        const cuenta = { id: 7, saldo: 100000 };

        const r = await ajustarSaldos([{ cuenta, delta: 30000 }]);

        expect(rpc).toHaveBeenCalledWith('ajustar_saldo', { p_cuenta_id: '7', p_delta: 30000 });
        expect(from).not.toHaveBeenCalled();
        expect(r.saldos.get(7)).toBe(130000);
    });

    it('junta los cambios de una misma cuenta en una sola operación', async () => {
        rpc.mockResolvedValue({ data: 90000, error: null });
        const cuenta = { id: 1, saldo: 100000 };

        await ajustarSaldos([{ cuenta, delta: -20000 }, { cuenta, delta: 10000 }]);

        expect(rpc).toHaveBeenCalledTimes(1);
        expect(rpc).toHaveBeenCalledWith('ajustar_saldo', { p_cuenta_id: '1', p_delta: -10000 });
    });

    it('ignora cuentas vacías y deltas en cero', async () => {
        const r = await ajustarSaldos([{ cuenta: null, delta: 5 }, { cuenta: { id: 2, saldo: 0 }, delta: 0 }]);
        expect(rpc).not.toHaveBeenCalled();
        expect(r.saldos.size).toBe(0);
    });

    it('si la segunda cuenta falla, deshace la primera restando lo sumado', async () => {
        rpc
            .mockResolvedValueOnce({ data: 50000, error: null })             // origen: -50.000
            .mockResolvedValueOnce({ data: null, error: { code: 'P0002' } }) // destino falla
            .mockResolvedValueOnce({ data: 100000, error: null });           // reversión
        const origen = { id: 1, saldo: 100000 };
        const destino = { id: 2, saldo: 0 };

        const r = await ajustarSaldos([{ cuenta: origen, delta: -50000 }, { cuenta: destino, delta: 50000 }]);

        expect(r.error).toBeTruthy();
        expect(rpc).toHaveBeenLastCalledWith('ajustar_saldo', { p_cuenta_id: '1', p_delta: 50000 });
    });
});

describe('ajustarSaldos sin la migración (método anterior)', () => {
    it('si la función no existe, calcula el saldo y lo escribe', async () => {
        rpc.mockResolvedValue({ data: null, error: funcionInexistente });
        const cuenta = { id: 3, saldo: 20000 };

        const r = await ajustarSaldos([{ cuenta, delta: -5000 }]);

        expect(from).toHaveBeenCalledWith('cuentas');
        expect(update).toHaveBeenCalledWith({ saldo: 15000 });
        expect(r.saldos.get(3)).toBe(15000);
    });

    it('recuerda que no hay función y no vuelve a preguntar', async () => {
        rpc.mockResolvedValue({ data: null, error: funcionInexistente });
        await ajustarSaldos([{ cuenta: { id: 1, saldo: 0 }, delta: 1 }]);
        await ajustarSaldos([{ cuenta: { id: 1, saldo: 1 }, delta: 1 }]);
        expect(rpc).toHaveBeenCalledTimes(1);
    });

    it('revertirSaldos vuelve a escribir el saldo original', async () => {
        await revertirSaldos([{ id: 4, delta: -100, saldoOriginal: 900, nuevoSaldo: 800, modo: 'local' }]);
        expect(update).toHaveBeenCalledWith({ saldo: 900 });
        expect(rpc).not.toHaveBeenCalled();
    });
});

describe('ajustarMeta', () => {
    it('suma el aporte con la función SQL', async () => {
        rpc.mockResolvedValue({ data: 250000, error: null });
        const r = await ajustarMeta({ id: 9, monto_actual: 200000 }, 50000);
        expect(rpc).toHaveBeenCalledWith('ajustar_meta', { p_meta_id: '9', p_delta: 50000 });
        expect(r.montoActual).toBe(250000);
    });

    it('sin la función, parte del monto que tiene la app', async () => {
        rpc.mockResolvedValue({ data: null, error: funcionInexistente });
        const r = await ajustarMeta({ id: 9, monto_actual: null }, 50000);
        expect(update).toHaveBeenCalledWith({ monto_actual: 50000 });
        expect(r.montoActual).toBe(50000);
    });
});

describe('conSaldosNuevos', () => {
    it('actualiza sólo las cuentas que cambiaron', () => {
        const antes = [{ id: 1, saldo: 10 }, { id: 2, saldo: 20 }];
        const despues = conSaldosNuevos(new Map([[2, 25]]))(antes);
        expect(despues).toEqual([{ id: 1, saldo: 10 }, { id: 2, saldo: 25 }]);
    });
});
