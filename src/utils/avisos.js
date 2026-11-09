import { parseFecha, aISO } from './fechas';
import { delMes, gastosPorCategoria } from './resumen';

// ─── Avisos del panel (la campanita) ────────────────────────────────────────
//
// Se calculan con los datos que ya están cargados; no se guardan en Supabase.
// Cada aviso:
//   { id, tipo, nivel: 'alerta' | 'info', clave, vars, ruta, icono, orden }
// 'clave' y 'vars' son el texto traducible. El id cambia cuando cambia la
// situación (otra fecha, otro mes, pasar de 80% a 100%), así un aviso nuevo
// vuelve a marcarse como no leído.

const DIA = 86400000;

function diasHasta(valor, hoy) {
    const fecha = parseFecha(valor);
    if (!fecha) return null;
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.round((fecha - inicioHoy) / DIA);
}

/** Suscripciones que se cobran en los próximos 3 días o ya vencieron. */
function avisosSuscripciones(suscripciones, hoy) {
    return suscripciones.flatMap((s) => {
        const dias = diasHasta(s.fecha_renovacion, hoy);
        if (dias === null || dias > 3) return [];
        const base = { id: `suscripcion-${s.id}-${s.fecha_renovacion}`, tipo: 'suscripcion', ruta: '/Suscripciones', icono: 'credit-card', orden: dias };
        const vars = { nombre: s.nombre, monto: Number(s.monto) };
        if (dias < 0) return [{ ...base, nivel: 'alerta', clave: 'avisos.suscripcionVencida', vars: { ...vars, n: -dias } }];
        if (dias === 0) return [{ ...base, nivel: 'alerta', clave: 'avisos.suscripcionHoy', vars }];
        if (dias === 1) return [{ ...base, nivel: 'alerta', clave: 'avisos.suscripcionManana', vars }];
        return [{ ...base, nivel: 'info', clave: 'avisos.suscripcionPronto', vars: { ...vars, n: dias } }];
    });
}

/** Presupuestos del mes en curso que pasaron el 80% o el 100%. */
function avisosPresupuestos(presupuestos, transacciones, hoy) {
    const gastos = gastosPorCategoria(delMes(transacciones, hoy));
    const mes = aISO(hoy).slice(0, 7);
    return presupuestos.flatMap((p) => {
        const limite = Number(p.monto);
        if (!(limite > 0)) return [];
        const gastado = gastos.find(c => c.categoria === p.categoria)?.valor || 0;
        const porcentaje = Math.round((gastado / limite) * 100);
        if (porcentaje < 80) return [];
        const pasado = porcentaje >= 100;
        return [{
            id: `presupuesto-${p.id}-${mes}-${pasado ? 'pasado' : 'cerca'}`,
            tipo: 'presupuesto',
            nivel: pasado ? 'alerta' : 'info',
            clave: pasado ? 'avisos.presupuestoPasado' : 'avisos.presupuestoCerca',
            vars: { categoria: p.categoria, gastado, limite, porcentaje },
            ruta: '/presupuestos',
            icono: 'calculator',
            orden: pasado ? -1 : 2,
        }];
    });
}

/** Tareas pendientes atrasadas, que vencen hoy o mañana. */
function avisosTareas(tareas, hoy) {
    return tareas.flatMap((tarea) => {
        if (tarea.completada) return [];
        const dias = diasHasta(tarea.fecha_limite, hoy);
        if (dias === null || dias > 1) return [];
        const base = { id: `tarea-${tarea.id}-${String(tarea.fecha_limite).slice(0, 10)}-${dias < 0 ? 'atrasada' : dias}`, tipo: 'tarea', ruta: '/Aprendizaje', icono: 'list-checks', orden: dias };
        const vars = { nombre: tarea.titulo };
        if (dias < 0) return [{ ...base, nivel: 'alerta', clave: 'avisos.tareaAtrasada', vars: { ...vars, n: -dias } }];
        if (dias === 0) return [{ ...base, nivel: 'alerta', clave: 'avisos.tareaHoy', vars }];
        return [{ ...base, nivel: 'info', clave: 'avisos.tareaManana', vars }];
    });
}

/** Todos los avisos: primero las alertas, y dentro de cada grupo lo más urgente. */
export function calcularAvisos({ suscripciones = [], presupuestos = [], transacciones = [], tareas = [] }, hoy = new Date()) {
    return [
        ...avisosSuscripciones(suscripciones, hoy),
        ...avisosPresupuestos(presupuestos, transacciones, hoy),
        ...avisosTareas(tareas, hoy),
    ].sort((a, b) => (a.nivel === b.nivel ? a.orden - b.orden : a.nivel === 'alerta' ? -1 : 1));
}

// ---------- Leídos (se guardan solo en este dispositivo) ----------

const CLAVE_VISTOS = 'avisos-vistos';
const CLAVE_NOTIFICADOS = 'avisos-notificados';

function leerLista(clave) {
    try {
        const lista = JSON.parse(localStorage.getItem(clave) || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

function guardarLista(clave, ids) {
    // Solo se guardan los ids de avisos que siguen activos, para que no crezca
    try { localStorage.setItem(clave, JSON.stringify(ids)); } catch { /* sin almacenamiento */ }
}

export function avisosVistos() {
    return leerLista(CLAVE_VISTOS);
}

export function marcarAvisosVistos(avisos) {
    guardarLista(CLAVE_VISTOS, avisos.map(a => a.id));
}

/** Alertas que todavía no se mostraron como notificación del celular; las marca. */
export function alertasPorNotificar(avisos) {
    const anteriores = leerLista(CLAVE_NOTIFICADOS);
    const yaNotificados = new Set(anteriores);
    const nuevas = avisos.filter(a => a.nivel === 'alerta' && !yaNotificados.has(a.id));
    // Se suman a los anteriores (los últimos 200) para no repetir ninguna
    guardarLista(CLAVE_NOTIFICADOS, [...anteriores, ...nuevas.map(a => a.id)].slice(-200));
    return nuevas;
}
