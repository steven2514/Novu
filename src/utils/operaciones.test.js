import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase simulado ──────────────────────────────────────────────────────
// Guarda cada consulta (tabla, operación, datos, filtros) en `consultas` y
// responde con lo que diga `responder`. Las funciones SQL ajustar_saldo /
// ajustar_meta suman sobre `saldos` y `metas`, como lo haría la base de datos.
let consultas;
let responder;
let saldos;
let ahorrado;
let fallaRpc;

function crearConsulta(tabla) {
    const q = { tabla, op: 'select', datos: null, filtros: [] };
    const cadena = {
        insert(datos) { q.op = 'insert'; q.datos = datos; return cadena; },
        update(datos) { q.op = 'update'; q.datos = datos; return cadena; },
        delete() { q.op = 'delete'; return cadena; },
        select() { return cadena; },
        single() { q.single = true; return cadena; },
        eq(campo, valor) { q.filtros.push([campo, valor]); return cadena; },
        then(ok, mal) {
            consultas.push(q);
            return Promise.resolve(responder(q)).then(ok, mal);
        },
    };
    return cadena;
}

const rpc = vi.fn(async (funcion, p) => {
    if (fallaRpc(funcion, p)) return { data: null, error: { code: 'P0001', message: 'falla simulada' } };
    if (funcion === 'ajustar_saldo') {
        saldos[p.p_cuenta_id] += p.p_delta;
        return { data: saldos[p.p_cuenta_id], error: null };
    }
    ahorrado[p.p_meta_id] += p.p_delta;
    return { data: ahorrado[p.p_meta_id], error: null };
});

vi.mock('../supabase', () => ({
    supabase: { from: (tabla) => crearConsulta(tabla), rpc: (...a) => rpc(...a) },
}));

const { crearMovimiento, editarMovimiento, transferir, pagarSuscripcion } = await import('./operaciones');
const { reiniciarDeteccion } = await import('./saldos');

// Respuesta por defecto: todo sale bien; los insert devuelven la fila con id
function respuestaNormal(q) {
    if (q.op === 'insert') {
        const fila = { id: `${q.tabla}-1`, ...(Array.isArray(q.datos) ? q.datos[0] : q.datos) };
        return { data: q.single ? fila : [fila], error: null };
    }
    return { data: null, error: null };
}

const nequi = { id: 1, nombre: 'Nequi', saldo: 300000 };
const nu = { id: 2, nombre: 'Nu', saldo: 50000 };
const cuentas = [nequi, nu];
const viaje = { id: 9, nombre_meta: 'Viaje', monto_actual: 100000 };

const hechas = (tabla, op) => consultas.filter(q => q.tabla === tabla && q.op === op);

beforeEach(() => {
    vi.clearAllMocks();
    reiniciarDeteccion();
    consultas = [];
    responder = respuestaNormal;
    saldos = { 1: 300000, 2: 50000 };
    ahorrado = { 9: 100000 };
    fallaRpc = () => false;
});

// ─── Crear gasto / ingreso ──────────────────────────────────────────────────

describe('crear un gasto', () => {
    const gasto = { tipo: 'gasto', monto: '25000', categoria: 'comida', cuenta: 'Nequi', fecha: '2026-10-01', descripcion: 'Almuerzo', userId: 'u1', cuentas };

    it('guarda el movimiento y lo descuenta de la cuenta', async () => {
        const r = await crearMovimiento(gasto);

        expect(r.error).toBeUndefined();
        const [insert] = hechas('transacciones', 'insert');
        expect(insert.datos[0]).toMatchObject({ tipo: 'gasto', monto: '25000', cuenta: 'Nequi', user_id: 'u1' });
        expect(rpc).toHaveBeenCalledWith('ajustar_saldo', { p_cuenta_id: '1', p_delta: -25000 });
        expect(r.saldos.get(1)).toBe(275000);
        expect(r.transacciones[0].id).toBe('transacciones-1');
    });

    it('un ingreso suma al saldo', async () => {
        const r = await crearMovimiento({ ...gasto, tipo: 'ingreso', monto: '100000' });
        expect(r.saldos.get(1)).toBe(400000);
    });

    it('si no se puede guardar, no toca el saldo', async () => {
        responder = (q) => (q.op === 'insert' ? { data: null, error: { message: 'sin red' } } : respuestaNormal(q));

        const r = await crearMovimiento(gasto);

        expect(r.error).toBe('agregar.noGuardar');
        expect(rpc).not.toHaveBeenCalled();
    });

    it('si el saldo falla, borra el movimiento para no dejarlo descuadrado', async () => {
        fallaRpc = () => true;

        const r = await crearMovimiento(gasto);

        expect(r.error).toBe('errores.saldo');
        const [borrado] = hechas('transacciones', 'delete');
        expect(borrado.filtros).toEqual([['id', 'transacciones-1']]);
    });
});

describe('editar un movimiento', () => {
    it('al cambiarlo de cuenta, devuelve el dinero a la anterior y lo cobra en la nueva', async () => {
        const anterior = { id: 'm1', tipo: 'gasto', monto: 20000, cuenta: 'Nequi', categoria: 'comida', fecha: '2026-10-01', descripcion: 'Almuerzo' };

        const r = await editarMovimiento({ anterior, monto: '30000', categoria: 'comida', cuenta: 'Nu', fecha: '2026-10-01', descripcion: 'Almuerzo', cuentas });

        expect(rpc).toHaveBeenCalledWith('ajustar_saldo', { p_cuenta_id: '1', p_delta: 20000 });
        expect(rpc).toHaveBeenCalledWith('ajustar_saldo', { p_cuenta_id: '2', p_delta: -30000 });
        expect(r.saldos.get(1)).toBe(320000);
        expect(r.saldos.get(2)).toBe(20000);
    });
});

// ─── Transferir ─────────────────────────────────────────────────────────────

describe('transferir entre cuentas', () => {
    const base = { origen: 'Nequi', destino: 'Nu', monto: '80000', tipoDestino: 'cuenta', cuentas, metas: [viaje], userId: 'u1', fecha: '2026-10-02' };

    it('registra la transferencia, resta del origen y suma al destino', async () => {
        const r = await transferir(base);

        expect(r.error).toBeUndefined();
        const [registro] = hechas('transferencias', 'insert');
        expect(registro.datos[0]).toMatchObject({ origen: 'Nequi', destino: 'Nu', monto: '80000', tipo_destino: 'cuenta', fecha: '2026-10-02' });
        expect(r.saldos.get(1)).toBe(220000);
        expect(r.saldos.get(2)).toBe(130000);
        expect(r.meta).toBeNull();
    });

    it('no deja transferir más de lo que hay en la cuenta', async () => {
        const r = await transferir({ ...base, monto: '999999' });

        expect(r.error).toBe('agregar.saldoInsuficiente');
        expect(consultas).toHaveLength(0);
        expect(rpc).not.toHaveBeenCalled();
    });

    it('pide los campos y un monto mayor que cero', async () => {
        expect((await transferir({ ...base, destino: '' })).error).toBe('agregar.completaCampos');
        expect((await transferir({ ...base, monto: '' })).error).toBe('agregar.completaCampos');
        expect((await transferir({ ...base, monto: '0' })).error).toBe('agregar.montoMayor');
        expect((await transferir({ ...base, monto: '-5' })).error).toBe('agregar.montoMayor');
    });

    it('si falla el saldo del destino, deshace el origen y borra el registro', async () => {
        fallaRpc = (funcion, p) => p.p_cuenta_id === '2';

        const r = await transferir(base);

        expect(r.error).toBe('errores.transferencia');
        expect(saldos[1]).toBe(300000); // el dinero volvió a Nequi
        expect(hechas('transferencias', 'delete')[0].filtros).toEqual([['id', 'transferencias-1']]);
    });
});

describe('aportar a una meta', () => {
    const aporte = { origen: 'Nequi', destino: 'Viaje', monto: '40000', tipoDestino: 'meta', cuentas, metas: [viaje], userId: 'u1' };

    it('sale de la cuenta y entra a la meta', async () => {
        const r = await transferir(aporte);

        expect(r.saldos.get(1)).toBe(260000);
        expect(r.meta).toEqual({ id: 9, montoActual: 140000 });
    });

    it('si la meta falla, el dinero vuelve a la cuenta', async () => {
        fallaRpc = (funcion) => funcion === 'ajustar_meta';

        const r = await transferir(aporte);

        expect(r.error).toBe('errores.transferencia');
        expect(saldos[1]).toBe(300000);
        expect(hechas('transferencias', 'delete')).toHaveLength(1);
    });
});

// ─── Pagar suscripción ──────────────────────────────────────────────────────

describe('pagar una suscripción', () => {
    const netflix = { id: 's1', nombre: 'Netflix', monto: 26900, cuenta: 'Nu', frecuencia: 'mensual', fecha_renovacion: '2026-10-31' };
    const pago = { suscripcion: netflix, cuentas, userId: 'u1', fecha: '2026-10-02' };

    it('registra el gasto, lo descuenta y pasa la renovación al mes siguiente', async () => {
        const r = await pagarSuscripcion(pago);

        expect(r.error).toBeUndefined();
        const [gasto] = hechas('transacciones', 'insert');
        expect(gasto.datos).toMatchObject({ descripcion: 'Netflix', monto: 26900, tipo: 'gasto', categoria: 'suscripciones', cuenta: 'Nu', fecha: '2026-10-02' });
        expect(r.saldos.get(2)).toBe(23100);
        // 31 de octubre + 1 mes = 30 de noviembre (no 1 de diciembre)
        expect(r.nuevaFecha).toBe('2026-11-30');
        const [renovacion] = hechas('suscripciones', 'update');
        expect(renovacion.datos).toEqual({ fecha_renovacion: '2026-11-30' });
        expect(renovacion.filtros).toEqual([['id', 's1']]);
    });

    it('una semanal se renueva 7 días después', async () => {
        const r = await pagarSuscripcion({ ...pago, suscripcion: { ...netflix, frecuencia: 'semanal', fecha_renovacion: '2026-10-28' } });
        expect(r.nuevaFecha).toBe('2026-11-04');
    });

    it('si no se puede mover la fecha, devuelve el dinero y borra el gasto', async () => {
        responder = (q) => (q.tabla === 'suscripciones' ? { data: null, error: { message: 'sin red' } } : respuestaNormal(q));

        const r = await pagarSuscripcion(pago);

        expect(r.error).toBe('suscripciones.errorActualizar');
        expect(saldos[2]).toBe(50000);
        expect(hechas('transacciones', 'delete')[0].filtros).toEqual([['id', 'transacciones-1']]);
    });

    it('si el saldo falla, borra el gasto y no cambia la fecha', async () => {
        fallaRpc = () => true;

        const r = await pagarSuscripcion(pago);

        expect(r.error).toBe('suscripciones.errorSaldo');
        expect(hechas('transacciones', 'delete')).toHaveLength(1);
        expect(hechas('suscripciones', 'update')).toHaveLength(0);
    });
});
