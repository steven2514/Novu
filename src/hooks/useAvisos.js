import { useEffect, useState } from 'react';
import { useIdioma, nombreCategoria } from '../i18n/idioma';
import { dinero } from '../utils/moneda';
import { avisosVistos, marcarAvisosVistos, alertasPorNotificar } from '../utils/avisos';

// Texto de un aviso en el idioma activo, con los montos ya formateados
export function textoAviso(aviso, t, { ocultable = true } = {}) {
    const vars = { ...aviso.vars };
    ['monto', 'gastado', 'limite'].forEach((clave) => {
        if (clave in vars) vars[clave] = dinero(vars[clave], { ocultable });
    });
    if (vars.categoria) vars.categoria = nombreCategoria(vars.categoria);
    return t(aviso.clave, vars);
}

export const soportaNotificaciones = () => typeof window !== 'undefined' && 'Notification' in window;

/**
 * Estado de la campanita: cuáles avisos son nuevos y el panel abierto/cerrado.
 * Al cerrar el panel, todos los avisos de ese momento quedan como vistos.
 */
export function useAvisos(avisos) {
    const [vistos, setVistos] = useState(() => new Set(avisosVistos()));
    const [abierto, setAbierto] = useState(false);
    const nuevos = avisos.filter(a => !vistos.has(a.id)).length;

    function cerrar() {
        marcarAvisosVistos(avisos);
        setVistos(new Set(avisos.map(a => a.id)));
        setAbierto(false);
    }

    return { nuevos, vistos, abierto, abrir: () => setAbierto(true), cerrar };
}

/**
 * Muestra como notificación del celular las alertas nuevas (cada una una sola
 * vez). Solo si el usuario dio permiso y cuando los datos ya cargaron.
 */
export function useNotificarAlertas(avisos, listo) {
    const { t } = useIdioma();
    useEffect(() => {
        if (!listo || !soportaNotificaciones() || Notification.permission !== 'granted') return;
        const nuevas = alertasPorNotificar(avisos).slice(0, 3);
        nuevas.forEach((aviso) => {
            // En el celular las notificaciones se muestran desde el service worker
            const opciones = { body: textoAviso(aviso, t, { ocultable: false }), tag: aviso.id, icon: '/pwa-192.png' };
            const mostrar = navigator.serviceWorker?.ready
                .then(registro => registro.showNotification('Novu', opciones))
                .catch(() => new Notification('Novu', opciones));
            if (!mostrar) new Notification('Novu', opciones);
        });
    }, [avisos, listo, t]);
}
