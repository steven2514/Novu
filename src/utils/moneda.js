// Formato de dinero de toda la app.
//
// La moneda (COP, USD, EUR) es una preferencia del perfil y "ocultar saldos" es
// una preferencia de este dispositivo. Ambas viven a nivel de módulo para que
// cualquier función pueda formatear sin recibirlas por props; PreferenciasProvider
// las cambia y hace que la app se vuelva a dibujar.
//
// Los montos se guardan en pesos colombianos. Al elegir USD o EUR se muestran
// convertidos con la tasa del día (ej: $30.000 COP → US$9.06).

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

// ─── Tasas de cambio ───
// Cuánto vale 1 peso colombiano en cada moneda. Se consultan una vez al día
// (open.er-api.com, gratis y sin clave) y se guardan; sin internet se usa la
// última conocida o, la primera vez, estas aproximadas (oct. 2026).
const TASAS_RESPALDO = { COP: 1, USD: 0.000302, EUR: 0.000268 };
const URL_TASAS = 'https://open.er-api.com/v6/latest/COP';
const UN_DIA = 24 * 60 * 60 * 1000;

function tasasGuardadas() {
    try {
        const guardado = JSON.parse(leer('tasas-cambio'));
        if (guardado?.tasas?.USD > 0 && guardado?.tasas?.EUR > 0) return guardado;
    } catch { /* dato dañado: se ignora */ }
    return null;
}

let tasas = tasasGuardadas()?.tasas || TASAS_RESPALDO;

/** Tasas actuales: { COP: 1, USD, EUR } (cuánto vale 1 COP en cada una). */
export function obtenerTasas() {
    return tasas;
}

/**
 * Trae las tasas del día si las guardadas tienen más de un día.
 * Devuelve true si cambiaron (para volver a dibujar la app).
 */
export async function actualizarTasas() {
    const guardado = tasasGuardadas();
    if (guardado && Date.now() - guardado.fecha < UN_DIA) return false;
    try {
        const respuesta = await fetch(URL_TASAS);
        if (!respuesta.ok) return false;
        const { result, rates } = await respuesta.json();
        if (result !== 'success' || !(rates?.USD > 0) || !(rates?.EUR > 0)) return false;
        tasas = { COP: 1, USD: rates.USD, EUR: rates.EUR };
        try { localStorage.setItem('tasas-cambio', JSON.stringify({ tasas, fecha: Date.now() })); } catch { /* sin almacenamiento */ }
        return true;
    } catch {
        return false; // sin internet: se sigue con las que hay
    }
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
 * Convierte un monto en pesos a la moneda elegida y lo formatea.
 *   dinero(30000)                       → "$30.000" (COP) · "US$9.06" (USD) · "8,04 €" (EUR)
 *   dinero(-500, { signo: true })       → "-$500"   (y "+$500" si es positivo)
 *   dinero(2800000, { compacto: true }) → "$2,8 M"  (ejes de gráficas)
 *   ocultable: false → se muestra aunque "ocultar saldos" esté activo (PDF)
 */
export function dinero(valor, { signo = false, compacto = false, ocultable = true } = {}) {
    if (ocultable && saldosOcultos) return OCULTO;
    return formatear(Number(valor || 0) * tasas[monedaActual], monedaActual, { signo, compacto });
}

/**
 * Formatea un valor que YA está en la moneda indicada, sin convertir.
 * Se usa para el saldo de una cuenta en su propia moneda: dineroEn(120.5, 'USD') → "US$120.50"
 */
export function dineroEn(valor, codigo, { ocultable = true } = {}) {
    if (ocultable && saldosOcultos) return OCULTO;
    return formatear(Number(valor || 0), MONEDAS[codigo] ? codigo : 'COP', {});
}

function formatear(n, codigo, { signo = false, compacto = false }) {
    // En pesos colombianos se escribe "$1.000" (sin el espacio de Intl)
    let texto = formateador(codigo, compacto).format(Math.abs(n)).replace(/^\$\s/, '$');
    // "US$" para que el dólar no se confunda con el peso, que también usa "$"
    if (codigo === 'USD') texto = texto.replace(/^\$/, 'US$');
    if (n < 0) return `-${texto}`;
    return signo && n > 0 ? `+${texto}` : texto;
}

// ─── Cuentas en otra moneda ───
// El saldo de una cuenta está en SU moneda (cuenta.moneda; sin ella, pesos).
// Todo lo demás está en pesos, así que al sumar saldos o mover dinero entre
// una cuenta y el resto de la app se pasa por pesos con la tasa del día.

export function monedaDeCuenta(cuenta) {
    return MONEDAS[cuenta?.moneda] ? cuenta.moneda : 'COP';
}

/** Saldo de la cuenta expresado en pesos (para sumarlo con otros). */
export function saldoEnPesos(cuenta) {
    const saldo = Number(cuenta?.saldo || 0);
    const codigo = monedaDeCuenta(cuenta);
    return codigo === 'COP' ? saldo : saldo / tasas[codigo];
}

/** Un monto en pesos expresado en la moneda de la cuenta (redondeado a sus decimales). */
export function pesosEnCuenta(pesos, cuenta) {
    const codigo = monedaDeCuenta(cuenta);
    if (codigo === 'COP') return Number(pesos);
    const factor = 10 ** MONEDAS[codigo].decimales;
    return Math.round(Number(pesos) * tasas[codigo] * factor) / factor;
}

// ─── Formularios ───
// En los formularios se escribe en la moneda elegida y en Supabase se guarda
// en pesos.

/** Monto en pesos → número en la moneda elegida (redondeado a sus decimales). */
export function aMonedaElegida(pesos) {
    const { decimales } = MONEDAS[monedaActual];
    const factor = 10 ** decimales;
    return Math.round(Number(pesos || 0) * tasas[monedaActual] * factor) / factor;
}

/**
 * Lo escrito en la moneda elegida → pesos para guardar.
 * Si se edita algo y el monto no se tocó, devuelve el original: así 26.900
 * pesos no pasan a 26.887 por ir y volver de US$8.12.
 */
export function aPesos(escrito, pesosOriginales) {
    const valor = Number(escrito || 0);
    if (pesosOriginales !== undefined && pesosOriginales !== null && valor === aMonedaElegida(pesosOriginales)) {
        return Number(pesosOriginales);
    }
    if (monedaActual === 'COP') return Math.round(valor);
    return Math.round(valor / tasas[monedaActual]);
}

/** Texto inicial de un campo de monto al editar ('' si no hay valor). */
export function montoParaCampo(pesos) {
    if (pesos === undefined || pesos === null || pesos === '') return '';
    return String(aMonedaElegida(pesos));
}
