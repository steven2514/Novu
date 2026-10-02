// Operaciones principales de dinero: registrar un gasto o ingreso, transferir
// entre cuentas (o aportar a una meta) y pagar una suscripción.
//
// Hablan con Supabase y con utils/saldos.js, pero no tocan el estado de React
// ni muestran mensajes: devuelven { error: 'clave' } (la clave del mensaje) o
// los datos para actualizar la pantalla. Así se pueden probar sin la interfaz.
//
// Cada paso se verifica y, si uno falla, se deshacen los anteriores para que
// nunca "desaparezca" ni "aparezca" dinero.

import { supabase } from '../supabase';
import { ajustarSaldos, ajustarMeta, revertirSaldos, efectoEnSaldo } from './saldos';
import { sumarCiclo } from './suscripciones';
import { hoyISO } from './fechas';

/**
 * Registra un gasto o ingreso y mueve el saldo de su cuenta.
 * Devuelve { transacciones, saldos } o { error: 'agregar.noGuardar' | 'errores.saldo' }.
 */
export async function crearMovimiento({ tipo, monto, categoria, cuenta, fecha, descripcion, userId, cuentas }) {
    const nueva = { descripcion, monto, tipo, categoria, cuenta, fecha, fuente: '', user_id: userId };
    const { data, error } = await supabase.from('transacciones').insert([nueva]).select();
    if (error) return { error: 'agregar.noGuardar' };

    const cuentaObj = cuentas.find(c => c.nombre === cuenta);
    const ajuste = await ajustarSaldos([{ cuenta: cuentaObj, delta: efectoEnSaldo(tipo, monto) }]);
    if (ajuste.error) {
        // Sin saldo actualizado el movimiento quedaría descuadrado: se borra
        await supabase.from('transacciones').delete().eq('id', data[0].id);
        return { error: 'errores.saldo' };
    }
    return { transacciones: data, saldos: ajuste.saldos };
}

/**
 * Edita un movimiento: deshace su efecto en la cuenta original y aplica el
 * nuevo (puede cambiar el monto y también la cuenta).
 * Devuelve { cambios, saldos } o { error: 'agregar.noActualizar' | 'errores.saldo' }.
 */
export async function editarMovimiento({ anterior, monto, categoria, cuenta, fecha, descripcion, cuentas }) {
    const cambios = { descripcion, monto, categoria, cuenta, fecha };
    const { error } = await supabase.from('transacciones').update(cambios).eq('id', anterior.id);
    if (error) return { error: 'agregar.noActualizar' };

    const ajuste = await ajustarSaldos([
        { cuenta: cuentas.find(c => c.nombre === anterior.cuenta), delta: -efectoEnSaldo(anterior.tipo, anterior.monto) },
        { cuenta: cuentas.find(c => c.nombre === cuenta), delta: efectoEnSaldo(anterior.tipo, monto) },
    ]);
    if (ajuste.error) {
        // Si el saldo no se pudo corregir, el movimiento vuelve a como estaba
        await supabase.from('transacciones')
            .update({ descripcion: anterior.descripcion, monto: anterior.monto, categoria: anterior.categoria, cuenta: anterior.cuenta, fecha: anterior.fecha })
            .eq('id', anterior.id);
        return { error: 'errores.saldo' };
    }
    return { cambios, saldos: ajuste.saldos };
}

/**
 * Transfiere de una cuenta a otra (tipoDestino 'cuenta') o aporta a una meta
 * (tipoDestino 'meta'). Devuelve { saldos, meta } —meta es { id, montoActual }
 * o null— o { error } con la clave del mensaje.
 */
export async function transferir({ origen, destino, monto, tipoDestino, cuentas, metas, userId, fecha = hoyISO() }) {
    if (!origen || !destino || !monto) return { error: 'agregar.completaCampos' };
    if (Number(monto) <= 0) return { error: 'agregar.montoMayor' };

    const cuentaOrigen = cuentas.find(c => c.nombre === origen);
    if (!cuentaOrigen || Number(cuentaOrigen.saldo) < Number(monto)) return { error: 'agregar.saldoInsuficiente' };
    const cuentaDestino = tipoDestino === 'cuenta' ? cuentas.find(c => c.nombre === destino) : null;
    const meta = tipoDestino === 'meta' ? metas.find(m => m.nombre_meta === destino) : null;
    if (!cuentaDestino && !meta) return { error: 'agregar.completaCampos' };

    const fallar = async (aplicados, idTransferencia) => {
        await revertirSaldos(aplicados);
        if (idTransferencia) await supabase.from('transferencias').delete().eq('id', idTransferencia);
        return { error: 'errores.transferencia' };
    };

    // 1. Registro de la transferencia (historial)
    const nuevaTransferencia = { user_id: userId, origen, destino, monto, tipo_destino: tipoDestino, fecha };
    const { data: registro, error: errorRegistro } = await supabase.from('transferencias').insert([nuevaTransferencia]).select().single();
    if (errorRegistro) return fallar([]);

    // 2. Saldos: sale de la cuenta de origen (y entra a la de destino si es entre cuentas)
    const ajuste = await ajustarSaldos([
        { cuenta: cuentaOrigen, delta: -Number(monto) },
        { cuenta: cuentaDestino, delta: Number(monto) },
    ]);
    if (ajuste.error) return fallar([], registro.id);

    // 3. Aporte a meta
    if (meta) {
        const { montoActual, error: errorMeta } = await ajustarMeta(meta, Number(monto));
        if (errorMeta) return fallar(ajuste.aplicados, registro.id);
        return { saldos: ajuste.saldos, meta: { id: meta.id, montoActual } };
    }
    return { saldos: ajuste.saldos, meta: null };
}

/**
 * Paga una suscripción: registra el gasto, lo descuenta de su cuenta y mueve
 * la fecha de renovación al siguiente ciclo.
 * Devuelve { transaccion, saldos, nuevaFecha } o { error } con la clave del mensaje.
 */
export async function pagarSuscripcion({ suscripcion: sus, cuentas, userId, fecha = hoyISO() }) {
    const nuevaFecha = sumarCiclo(sus.fecha_renovacion, sus.frecuencia);

    const { data: transaccion, error: errorTransaccion } = await supabase
        .from('transacciones')
        .insert({
            descripcion: sus.nombre,
            monto: sus.monto,
            tipo: 'gasto',
            categoria: 'suscripciones',
            cuenta: sus.cuenta,
            fecha,
            user_id: userId,
        })
        .select()
        .single();
    if (errorTransaccion) return { error: 'suscripciones.errorPago' };
    const borrarTransaccion = () => supabase.from('transacciones').delete().eq('id', transaccion.id);

    const cuenta = cuentas.find(c => c.nombre === sus.cuenta);
    const ajuste = await ajustarSaldos([{ cuenta, delta: -Number(sus.monto) }]);
    if (ajuste.error) {
        await borrarTransaccion();
        return { error: 'suscripciones.errorSaldo' };
    }

    const { error: errorFecha } = await supabase
        .from('suscripciones')
        .update({ fecha_renovacion: nuevaFecha })
        .eq('id', sus.id);
    if (errorFecha) {
        await revertirSaldos(ajuste.aplicados);
        await borrarTransaccion();
        return { error: 'suscripciones.errorActualizar' };
    }

    return { transaccion, saldos: ajuste.saldos, nuevaFecha };
}
