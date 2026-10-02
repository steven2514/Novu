import { supabase } from '../supabase';

// ─── Cambios de saldo ───────────────────────────────────────────────────────
//
// Lo ideal es que la suma ocurra DENTRO de Supabase (saldo = saldo + delta):
// así dos dispositivos abiertos a la vez no se pisan. Eso lo hacen las funciones
// ajustar_saldo / ajustar_meta de database/migracion_v3_saldos_y_seguridad.sql.
//
// Si esa migración todavía no se ejecutó, Supabase responde que la función no
// existe y se usa el método anterior (calcular el saldo nuevo en el navegador y
// escribirlo). La app funciona igual en los dos casos; sólo la primera forma es
// segura con varios dispositivos.

/** Cuánto mueve un movimiento el saldo de su cuenta: los ingresos suman y los gastos restan. */
export function efectoEnSaldo(tipo, monto) {
    return tipo === 'ingreso' ? Number(monto) : -Number(monto);
}

// Se recuerda si las funciones existen para no preguntar en cada operación.
// null = no se sabe todavía.
let funcionesDisponibles = null;

/** Sólo para los tests: vuelve a averiguar si existen las funciones. */
export function reiniciarDeteccion() {
    funcionesDisponibles = null;
}

/** true si el error de Supabase significa "esa función no existe". */
function esFuncionInexistente(error) {
    return error?.code === 'PGRST202' || error?.code === '42883';
}

/**
 * Suma 'delta' a un campo numérico con la función SQL indicada, o con el
 * método anterior si no existe. Devuelve { valor, modo } o { error }.
 */
async function sumarEnBase({ funcion, parametros, tabla, campo, id, valorConocido, delta }) {
    if (funcionesDisponibles !== false) {
        const { data, error } = await supabase.rpc(funcion, parametros);
        if (!error) {
            funcionesDisponibles = true;
            return { valor: Number(data), modo: 'atomico' };
        }
        if (!esFuncionInexistente(error)) return { error };
        funcionesDisponibles = false;
    }

    // Método anterior: parte del valor que la app tiene cargado.
    const valor = Number(valorConocido || 0) + delta;
    const { error } = await supabase.from(tabla).update({ [campo]: valor }).eq('id', id);
    if (error) return { error };
    return { valor, modo: 'local' };
}

/**
 * Aplica cambios de saldo en Supabase.
 *
 * Recibe una lista de { cuenta, delta } (una misma cuenta puede aparecer
 * varias veces; sus deltas se suman). Si alguna actualización falla, deshace
 * las que ya se habían aplicado para que los saldos no queden descuadrados.
 *
 * Devuelve { error } si algo falló, o { saldos, aplicados }: saldos es un Map
 * id de cuenta → saldo nuevo, para actualizar el estado de React.
 */
export async function ajustarSaldos(cambios) {
    const porCuenta = new Map();
    for (const { cuenta, delta } of cambios) {
        if (!cuenta || !delta) continue;
        const previo = porCuenta.get(cuenta.id);
        porCuenta.set(cuenta.id, {
            cuenta,
            delta: (previo?.delta || 0) + Number(delta),
        });
    }

    const aplicados = [];
    for (const { cuenta, delta } of porCuenta.values()) {
        if (delta === 0) continue;
        const resultado = await sumarEnBase({
            funcion: 'ajustar_saldo',
            parametros: { p_cuenta_id: String(cuenta.id), p_delta: delta },
            tabla: 'cuentas', campo: 'saldo', id: cuenta.id,
            valorConocido: cuenta.saldo, delta,
        });
        if (resultado.error) {
            await revertirSaldos(aplicados);
            return { error: resultado.error };
        }
        aplicados.push({
            id: cuenta.id,
            delta,
            saldoOriginal: Number(cuenta.saldo),
            nuevoSaldo: resultado.valor,
            modo: resultado.modo,
        });
    }

    return { saldos: new Map(aplicados.map(a => [a.id, a.nuevoSaldo])), aplicados };
}

/**
 * Deshace ajustes hechos con ajustarSaldos (se usa cuando falla un paso posterior).
 * Con las funciones atómicas resta lo que se sumó; con el método anterior
 * vuelve a escribir el saldo original.
 */
export async function revertirSaldos(aplicados = []) {
    // Cada cuenta se revierte por separado: pueden ir en paralelo.
    await Promise.all(aplicados.map(a => (a.modo === 'atomico'
        ? supabase.rpc('ajustar_saldo', { p_cuenta_id: String(a.id), p_delta: -a.delta })
        : supabase.from('cuentas').update({ saldo: a.saldoOriginal }).eq('id', a.id))));
}

/**
 * Suma 'delta' al monto ahorrado de una meta.
 * Devuelve { montoActual } o { error }.
 */
export async function ajustarMeta(meta, delta) {
    const resultado = await sumarEnBase({
        funcion: 'ajustar_meta',
        parametros: { p_meta_id: String(meta.id), p_delta: Number(delta) },
        tabla: 'metas', campo: 'monto_actual', id: meta.id,
        valorConocido: meta.monto_actual, delta: Number(delta),
    });
    if (resultado.error) return { error: resultado.error };
    return { montoActual: resultado.valor };
}

/** Devuelve una función para setCuentas que aplica los saldos nuevos. */
export function conSaldosNuevos(saldos) {
    return (prev) => prev.map(c => (saldos.has(c.id) ? { ...c, saldo: saldos.get(c.id) } : c));
}
