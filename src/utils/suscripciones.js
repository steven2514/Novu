// Una suscripción puede cobrarse cada día, cada semana o cada mes.
// Para sumarlas hay que llevarlas a la misma unidad de tiempo.

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
