import { localeActual } from '../i18n/idioma';

// ─── Fechas de calendario ───────────────────────────────────────────────────
//
// Las transacciones, metas, suscripciones y tareas tienen una fecha de
// CALENDARIO (un día), no un instante. JavaScript las trata como instantes en
// UTC, y eso corre el día en Colombia (UTC-5):
//
//   new Date('2026-09-24')      -> 23 sep a las 19:00 en Bogotá
//   new Date().toISOString()    -> después de las 7 p.m. ya es "mañana"
//
// Regla de este archivo: una fecha se guarda como 'YYYY-MM-DD' y se lee como
// ese mismo día en la hora local, sin conversiones de zona horaria.

function dosDigitos(n) {
    return String(n).padStart(2, '0');
}

/** Un Date local a 'YYYY-MM-DD' (sin pasar por UTC). */
export function aISO(fecha) {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Hoy, en la zona del usuario, como 'YYYY-MM-DD'. Sirve de valor para <input type="date">. */
export function hoyISO() {
    return aISO(new Date());
}

/**
 * Convierte lo que venga de Supabase en un Date local, o null.
 *
 * - '2026-09-24' o '2026-09-24T00:00:00+00:00' (una fecha guardada como día):
 *   se toma el día tal cual.
 * - Un instante con hora real (filas antiguas guardadas con toISOString()):
 *   se convierte a la hora local, que es lo que el usuario vio al crearla.
 */
export function parseFecha(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return isNaN(valor) ? null : valor;

    const texto = String(valor);
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]00:?00)?)?/.exec(texto);
    if (m) {
        const [, a, mes, d, h, min, s, zona] = m;
        const esSoloDia = h === undefined || (h === '00' && min === '00' && s === '00' && (zona !== undefined || texto.length <= 19));
        if (esSoloDia) return new Date(Number(a), Number(mes) - 1, Number(d));
    }

    const instante = new Date(texto);
    return isNaN(instante) ? null : instante;
}

/** 'YYYY-MM-DD' de cualquier valor de fecha, para rellenar un <input type="date">. */
export function aInputFecha(valor) {
    const f = parseFecha(valor);
    return f ? aISO(f) : '';
}

export function mismoDia(a, b) {
    return !!a && !!b
        && a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

/** true si la fecha cae en el mes y año de 'referencia'. */
export function mismoMes(fecha, referencia) {
    return !!fecha && !!referencia
        && fecha.getFullYear() === referencia.getFullYear()
        && fecha.getMonth() === referencia.getMonth();
}

/** Formatea un valor de fecha en el idioma activo de la app. Devuelve '' si no es válida. */
export function formatearFecha(valor, opciones = { day: 'numeric', month: 'long', year: 'numeric' }) {
    const f = parseFecha(valor);
    return f ? f.toLocaleDateString(localeActual(), opciones) : '';
}

/** Compara dos valores de fecha para ordenar (más antiguo primero). */
export function compararFechas(a, b) {
    const fa = parseFecha(a);
    const fb = parseFecha(b);
    return (fa ? fa.getTime() : 0) - (fb ? fb.getTime() : 0);
}
