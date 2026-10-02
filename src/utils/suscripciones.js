// Una suscripción puede cobrarse cada día, cada semana o cada mes.
// Para sumarlas hay que llevarlas a la misma unidad de tiempo.

import { parseFecha, aISO } from './fechas';

const COBROS_POR_ANIO = { diario: 365, semanal: 52, mensual: 12 };

/** Lo que cuesta la suscripción en un año, según su frecuencia de cobro. */
export function montoAnual(suscripcion) {
    const cobros = COBROS_POR_ANIO[suscripcion.frecuencia] || COBROS_POR_ANIO.mensual;
    return Number(suscripcion.monto || 0) * cobros;
}

/** Lo que cuesta la suscripción en un mes promedio (ej: una semanal de $10.000 ≈ $43.333). */
export function montoMensual(suscripcion) {
    return Math.round(montoAnual(suscripcion) / 12);
}

/** Fecha (YYYY-MM-DD) del siguiente cobro después de 'fecha', según la frecuencia. */
export function sumarCiclo(fecha, frecuencia) {
    const d = parseFecha(fecha) || new Date();
    if (frecuencia === 'diario') d.setDate(d.getDate() + 1);
    else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7);
    else {
        // Mensual: el 31 de enero pasa al 28/29 de febrero, no al 3 de marzo.
        const dia = d.getDate();
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
        const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(dia, ultimoDia));
    }
    // aISO y no toISOString: este último pasa por UTC y puede cambiar el día.
    return aISO(d);
}
