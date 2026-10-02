// Monitoreo de errores con Sentry (https://sentry.io).
//
// Sólo se activa si existe la variable de entorno VITE_SENTRY_DSN (en Vercel:
// Settings → Environment Variables). Sin ella no se descarga nada y la app
// funciona igual. La librería se carga aparte para no hacer más pesada la
// primera carga.
//
// Privacidad: no se envían correos, IPs ni montos; sólo el error, en qué
// pantalla ocurrió y el id interno del usuario para agrupar los reportes.

const DSN = import.meta.env.VITE_SENTRY_DSN;

let sentry = null;

export async function iniciarMonitoreo() {
    if (!DSN || sentry) return;
    try {
        const Sentry = await import('@sentry/react');
        Sentry.init({
            dsn: DSN,
            environment: import.meta.env.MODE,
            sendDefaultPii: false,
            tracesSampleRate: 0,
        });
        sentry = Sentry;
    } catch {
        // Si no carga (bloqueador de anuncios, sin red) la app sigue igual
    }
}

/** Reporta un error que la app atrapó (por ejemplo, en LimiteErrores). */
export function reportarError(error, contexto) {
    sentry?.captureException(error, contexto ? { extra: contexto } : undefined);
}

/** Asocia los reportes al usuario (sólo su id, nunca el correo). */
export function identificarUsuario(userId) {
    sentry?.setUser(userId ? { id: userId } : null);
}
