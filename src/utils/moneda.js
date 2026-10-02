// Formato de dinero de toda la app.
//
// La moneda (COP, USD, EUR) es una preferencia del perfil y "ocultar saldos" es
// una preferencia de este dispositivo. Ambas viven a nivel de módulo para que
// cualquier función pueda formatear sin recibirlas por props; PreferenciasProvider
// las cambia y hace que la app se vuelva a dibujar.
//
// Los montos se guardan como números sin moneda: cambiar de moneda cambia cómo
// se muestran (símbolo, separadores, decimales), no convierte valores.

export const MONEDAS = {
    COP: { locale: 'es-CO', decimales: 0 },
    USD: { locale: 'en-US', decimales: 2 },
    EUR: { locale: 'es-ES', decimales: 2 },
};

export const OCULTO = '••••••';

function leer(clave) {
    try {
        return localStorage.getItem(clave);
    } catch {
        return null;
    }
}

let monedaActual = MONEDAS[leer('moneda')] ? leer('moneda') : 'COP';
let saldosOcultos = leer('ocultar-saldos') === '1';

export function obtenerMoneda() {
    return monedaActual;
}

export function establecerMoneda(codigo) {
    monedaActual = MONEDAS[codigo] ? codigo : 'COP';
    try { localStorage.setItem('moneda', monedaActual); } catch { /* sin almacenamiento */ }
    return monedaActual;
}

export function saldosEstanOcultos() {
    return saldosOcultos;
}

export function establecerSaldosOcultos(valor) {
    saldosOcultos = !!valor;
    try { localStorage.setItem('ocultar-saldos', saldosOcultos ? '1' : '0'); } catch { /* sin almacenamiento */ }
    return saldosOcultos;
}

// Un formateador por combinación (crearlos es costoso)
const cache = new Map();
function formateador(codigo, compacto) {
    const clave = `${codigo}-${compacto ? 'c' : 'n'}`;
    if (!cache.has(clave)) {
        const { locale, decimales } = MONEDAS[codigo];
        cache.set(clave, new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: codigo,
            currencyDisplay: 'narrowSymbol',
            ...(compacto
                ? { notation: 'compact', maximumFractionDigits: 1 }
                : { minimumFractionDigits: decimales, maximumFractionDigits: decimales }),
        }));
    }
    return cache.get(clave);
}

/**
 * Formatea un monto en la moneda elegida.
 *   dinero(1234567)                     → "$1.234.567" (COP) · "$1,234,567.00" (USD)
 *   dinero(-500, { signo: true })       → "-$500"   (y "+$500" si es positivo)
 *   dinero(2800000, { compacto: true }) → "$2,8 M"  (ejes de gráficas)
 *   ocultable: false → se muestra aunque "ocultar saldos" esté activo (PDF)
 */
export function dinero(valor, { signo = false, compacto = false, ocultable = true } = {}) {
    if (ocultable && saldosOcultos) return OCULTO;
    const n = Number(valor || 0);
    // En pesos colombianos se escribe "$1.000" (sin el espacio de Intl)
    const texto = formateador(monedaActual, compacto).format(Math.abs(n)).replace(/^\$\s/, '$');
    if (n < 0) return `-${texto}`;
    return signo && n > 0 ? `+${texto}` : texto;
}
