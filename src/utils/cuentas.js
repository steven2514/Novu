import { supabase } from '../supabase';

// Los movimientos, suscripciones y transferencias guardan el NOMBRE de la
// cuenta, no su id. Por eso dos cuentas no pueden llamarse igual, y renombrar
// una tiene que renombrarla también en todo lo que la menciona.

function normalizar(nombre) {
    return String(nombre || '').trim().toLowerCase();
}

/** true si ya existe otra cuenta con ese nombre (sin distinguir mayúsculas). */
export function nombreDuplicado(cuentas, nombre, idExcluir = null) {
    const buscado = normalizar(nombre);
    return cuentas.some(c => c.id !== idExcluir && normalizar(c.nombre) === buscado);
}

/**
 * Cambia el nombre de una cuenta y de todo lo que la referencia.
 *
 * Usa la función renombrar_cuenta de la migración v3, que lo hace todo en una
 * sola transacción. Si esa migración no se ejecutó todavía, actualiza tabla por
 * tabla desde aquí (mismo resultado, pero sin la garantía de "todo o nada").
 *
 * Devuelve {} si salió bien o { error }. error.duplicado = true si el nombre
 * ya lo usa otra cuenta.
 */
export async function renombrarCuenta(cuenta, nuevoNombre, userId) {
    const nombre = String(nuevoNombre || '').trim();
    const anterior = cuenta.nombre;
    if (nombre === anterior) return {};

    const { error } = await supabase.rpc('renombrar_cuenta', { p_cuenta_id: String(cuenta.id), p_nombre: nombre });
    if (!error) return {};
    if (error.code === '23505') return { error: { ...error, duplicado: true } };
    if (error.code !== 'PGRST202' && error.code !== '42883') return { error };

    // Sin la función SQL: se renombra paso a paso.
    const pasos = [
        supabase.from('cuentas').update({ nombre }).eq('id', cuenta.id),
        supabase.from('transacciones').update({ cuenta: nombre }).eq('user_id', userId).eq('cuenta', anterior),
        supabase.from('suscripciones').update({ cuenta: nombre }).eq('user_id', userId).eq('cuenta', anterior),
        supabase.from('transferencias').update({ origen: nombre }).eq('user_id', userId).eq('origen', anterior),
        supabase.from('transferencias').update({ destino: nombre }).eq('user_id', userId).eq('destino', anterior).eq('tipo_destino', 'cuenta'),
    ];
    for (const paso of pasos) {
        const { error: errorPaso } = await paso;
        if (errorPaso) return { error: errorPaso };
    }
    return {};
}
