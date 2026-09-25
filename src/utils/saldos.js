import { supabase } from '../supabase';

/** Cuánto mueve un movimiento el saldo de su cuenta: los ingresos suman y los gastos restan. */
export function efectoEnSaldo(tipo, monto) {
    return tipo === 'ingreso' ? Number(monto) : -Number(monto);
}

/**
 * Aplica cambios de saldo en Supabase de forma segura.
 *
 * Recibe una lista de { cuenta, delta } (una misma cuenta puede aparecer
 * varias veces; sus deltas se suman). Si alguna actualización falla, deshace
 * las que ya se habían aplicado para que los saldos no queden descuadrados.
 *
 * Devuelve { error } si algo falló, o { saldos } con el nuevo saldo por id
 * de cuenta para actualizar el estado de React.
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
        const saldoOriginal = Number(cuenta.saldo);
        const nuevoSaldo = saldoOriginal + delta;
        const { error } = await supabase.from('cuentas').update({ saldo: nuevoSaldo }).eq('id', cuenta.id);
        if (error) {
            await revertirSaldos(aplicados);
            return { error };
        }
        aplicados.push({ id: cuenta.id, saldoOriginal, nuevoSaldo });
    }

    return { saldos: new Map(aplicados.map(a => [a.id, a.nuevoSaldo])), aplicados };
}

/** Deshace ajustes hechos con ajustarSaldos (se usa cuando falla un paso posterior). */
export async function revertirSaldos(aplicados = []) {
    for (const { id, saldoOriginal } of aplicados) {
        await supabase.from('cuentas').update({ saldo: saldoOriginal }).eq('id', id);
    }
}

/** Devuelve una función para setCuentas que aplica los saldos nuevos. */
export function conSaldosNuevos(saldos) {
    return (prev) => prev.map(c => (saldos.has(c.id) ? { ...c, saldo: saldos.get(c.id) } : c));
}
