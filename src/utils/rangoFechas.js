import { aISO, parseFecha } from './fechas';

// ─── Filtro por fechas de Movimientos ───────────────────────────────────────
// Los rangos son 'YYYY-MM-DD' (como los <input type="date">). Vacío = sin límite.

export const ATAJOS_FECHA = ['todo', 'mes', 'mesPasado', 'semana', 'anio'];

/** { desde, hasta } de un atajo, calculado desde hoy. */
export function rangoDeAtajo(atajo, hoy = new Date()) {
    const a = hoy.getFullYear();
    const m = hoy.getMonth();
    if (atajo === 'mes') return { desde: aISO(new Date(a, m, 1)), hasta: aISO(new Date(a, m + 1, 0)) };
    if (atajo === 'mesPasado') return { desde: aISO(new Date(a, m - 1, 1)), hasta: aISO(new Date(a, m, 0)) };
    if (atajo === 'semana') return { desde: aISO(new Date(a, m, hoy.getDate() - 6)), hasta: aISO(hoy) };
    if (atajo === 'anio') return { desde: aISO(new Date(a, 0, 1)), hasta: aISO(new Date(a, 11, 31)) };
    return { desde: '', hasta: '' };
}

/** true si la fecha del movimiento cae dentro del rango (ambos extremos incluidos). */
export function dentroDelRango(valor, { desde, hasta }) {
    if (!desde && !hasta) return true;
    const fecha = parseFecha(valor);
    if (!fecha) return false;
    const dia = aISO(fecha);
    // Si los pusieron al revés (desde después de hasta), se usan en el orden correcto
    const [inicio, fin] = desde && hasta && desde > hasta ? [hasta, desde] : [desde, hasta];
    return (!inicio || dia >= inicio) && (!fin || dia <= fin);
}
