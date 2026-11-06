import { aISO, parseFecha, mismoDia } from './fechas';

// ─── Tiempo, repetición y vistas de las tareas ──────────────────────────────

export const REPETICIONES = ['nunca', 'diaria', 'semanal', 'mensual'];

// Opciones del "tiempo estimado" en el formulario, en minutos
export const ESTIMADOS = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480];

// ---------- Cronómetro ----------

/** Segundos trabajados, contando el rato actual si el cronómetro está corriendo. */
export function segundosTrabajados(tarea, ahora = new Date()) {
    const guardados = Number(tarea.segundos_trabajados) || 0;
    if (!tarea.cronometro_desde) return guardados;
    const desde = new Date(tarea.cronometro_desde).getTime();
    if (isNaN(desde)) return guardados;
    return guardados + Math.max(0, Math.floor((ahora.getTime() - desde) / 1000));
}

/** Cambios para pausar el cronómetro: suma el rato actual y lo detiene. */
export function pausarCronometro(tarea, ahora = new Date()) {
    return { segundos_trabajados: segundosTrabajados(tarea, ahora), cronometro_desde: null };
}

/** '45 s', '12 min', '1 h', '1 h 05 min' */
export function duracionCorta(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    if (s < 60) return `${s} s`;
    const minutos = Math.floor(s / 60);
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`;
}

/** Reloj del cronómetro: '04:09' o '1:04:09' */
export function reloj(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const h = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Segundos entre que se creó y se terminó la tarea, o null si falta alguna fecha. */
export function segundosHastaTerminar(tarea) {
    if (!tarea.creada_en || !tarea.completada_en) return null;
    const inicio = new Date(tarea.creada_en).getTime();
    const fin = new Date(tarea.completada_en).getTime();
    if (isNaN(inicio) || isNaN(fin)) return null;
    return Math.max(0, Math.floor((fin - inicio) / 1000));
}

// ---------- Repetición ----------

// La fecha 'veces' periodos después de 'base'. Se calcula siempre desde la
// base para que una tarea mensual del 31 no se quede en el 28 para siempre.
function sumarPeriodo(base, repetir, veces) {
    const f = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    if (repetir === 'diaria') f.setDate(f.getDate() + veces);
    if (repetir === 'semanal') f.setDate(f.getDate() + 7 * veces);
    if (repetir === 'mensual') {
        // 31 de enero → 28/29 de febrero (no salta a marzo)
        f.setDate(1);
        f.setMonth(f.getMonth() + veces);
        const ultimo = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
        f.setDate(Math.min(base.getDate(), ultimo));
    }
    return f;
}

/**
 * Fecha ('YYYY-MM-DD') de la próxima vez de una tarea que se repite.
 * Parte de su fecha límite (o de hoy si no tiene) y avanza hasta quedar
 * después de hoy: una tarea diaria atrasada 3 días vuelve para mañana.
 */
export function siguienteFecha(fechaLimite, repetir, hoy = new Date()) {
    if (!REPETICIONES.includes(repetir) || repetir === 'nunca') return null;
    const base = parseFecha(fechaLimite) || new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let veces = 1;
    while (sumarPeriodo(base, repetir, veces) <= inicioHoy) veces++;
    return aISO(sumarPeriodo(base, repetir, veces));
}

/** La copia pendiente que se crea al terminar una tarea que se repite. */
export function tareaSiguiente(tarea, hoy = new Date()) {
    const fecha = siguienteFecha(tarea.fecha_limite, tarea.repetir, hoy);
    if (!fecha) return null;
    return {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        categoria: tarea.categoria,
        prioridad: tarea.prioridad,
        fecha_limite: fecha,
        minutos_estimados: tarea.minutos_estimados ?? null,
        repetir: tarea.repetir,
        completada: false,
        user_id: tarea.user_id,
    };
}

// ---------- Vistas: Hoy, Esta semana, Atrasadas ----------

export const VISTAS = ['todas', 'hoy', 'semana', 'atrasadas'];

function inicioDelDia(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** true si la tarea no está hecha y su fecha límite ya pasó. */
export function estaAtrasada(tarea, hoy = new Date()) {
    const fecha = parseFecha(tarea.fecha_limite);
    return !tarea.completada && !!fecha && fecha < inicioDelDia(hoy);
}

/** true si la tarea va en la vista elegida. La semana va de lunes a domingo. */
export function enVista(tarea, vista, hoy = new Date()) {
    if (vista === 'todas') return true;
    if (vista === 'atrasadas') return estaAtrasada(tarea, hoy);
    const fecha = parseFecha(tarea.fecha_limite);
    if (!fecha) return false;
    if (vista === 'hoy') return mismoDia(fecha, hoy);
    if (vista === 'semana') {
        const lunes = inicioDelDia(hoy);
        lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
        const siguienteLunes = new Date(lunes);
        siguienteLunes.setDate(lunes.getDate() + 7);
        return fecha >= lunes && fecha < siguienteLunes;
    }
    return true;
}

// ---------- Base de datos sin la migración v5 ----------

// Si todavía no se ejecutó migracion_v5_tiempo_tareas.sql, Supabase rechaza
// estas columnas (error PGRST204). Se reintenta sin ellas para que crear,
// editar y completar tareas siga funcionando.
const COLUMNAS_V5 = ['creada_en', 'completada_en', 'minutos_estimados', 'segundos_trabajados', 'cronometro_desde', 'repetir'];

export function sinColumnasV5(datos) {
    return Object.fromEntries(Object.entries(datos).filter(([clave]) => !COLUMNAS_V5.includes(clave)));
}

/**
 * Ejecuta 'guardar(datos)' (un insert o update de Supabase). Si falla porque
 * faltan las columnas nuevas, lo repite sin ellas. Si sin ellas no queda nada
 * que guardar, devuelve el error 'sin-migracion'.
 */
export async function guardarConRespaldo(datos, guardar) {
    const resultado = await guardar(datos);
    if (resultado.error?.code !== 'PGRST204') return resultado;
    const basicos = sinColumnasV5(datos);
    if (Object.keys(basicos).length === 0) return { data: null, error: { code: 'sin-migracion' } };
    return guardar(basicos);
}
