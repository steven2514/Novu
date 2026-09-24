import { useState } from "react";
import { parseFecha, mismoMes } from '../utils/fechas';
import './Calendario.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { useIdioma } from '../i18n/idioma';


function Calendario({ metas, transacciones, suscripciones, tareas, sesion }) {

    const [fechaActual, setFechaActual] = useState(new Date());
    const mes = fechaActual.getMonth();
    const anio = fechaActual.getFullYear();
    const diasEnElMes = new Date(anio, mes + 1, 0).getDate();
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const diasDelMes = Array.from({ length: diasEnElMes }, (_, i) => i + 1);
    const celdasVacias = Array.from({ length: primerDiaSemana }, () => null);
    const celdas = [...celdasVacias, ...diasDelMes];
    const { t, locale } = useIdioma();
    const nombreMes = fechaActual.toLocaleDateString(locale, { month: 'long' });
    // 4 de enero de 2026 fue domingo: de ahí salen los 7 nombres cortos de la semana
    const nombresDias = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i).toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''));
    const { mostrarTour, cerrarTour } = useTour('calendario', sesion);

    
    const transaccionesDelMes = transacciones.filter((t) => mismoMes(parseFecha(t.fecha), fechaActual));

   
    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

   
    const totalGastos = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

   
    // Los campos en Supabase van en snake_case (fecha_renovacion, fecha_objetivo,
    // fecha_limite). Antes se leían en camelCase y el calendario nunca mostraba
    // suscripciones, metas ni tareas.
    const suscripcionesDelMes = suscripciones.filter((s) => mismoMes(parseFecha(s.fecha_renovacion), fechaActual)).length;

    // true si el valor de fecha cae en el día 'dia' del mes que se está viendo.
    function esDelDia(valor, dia) {
        const f = parseFecha(valor);
        return !!f && dia === f.getDate() && mes === f.getMonth() && anio === f.getFullYear();
    }

    function mesSiguiente() {
        setFechaActual(new Date(anio, mes + 1, 1));
    }
    function mesAnterior() {
        setFechaActual(new Date(anio, mes - 1, 1));
    }

    function hoy() {
        setFechaActual(new Date());
    }

    return (
        <div className="calendario-page">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('calendario.tour1Titulo'), texto: t('calendario.tour1Texto') },
                { titulo: t('calendario.tour2Titulo'), texto: t('calendario.tour2Texto') }
            ]} />}
            <div className="calendario-header">
                <div>
                    <p className="overline">{t('calendario.overline')}</p>
                    <h1>{t('calendario.titulo')}</h1>
                    <p>{t('calendario.subtitulo')}</p>
                </div>
                <button className="btn-pildora-secundario" onClick={hoy}>
                    <Icon name="calendar-days" size={16} /> {t('calendario.hoy')}
                </button>
            </div>

            <div className="calendario-card">
                <div className="calendario-mes-header">
                    <h2>{nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} <span>{anio}</span></h2>
                    <div className="calendario-flechas">
                        <button onClick={mesAnterior} aria-label={t('comun.mesAnterior')}><Icon name="chevron-left" size={18} /></button>
                        <button onClick={mesSiguiente} aria-label={t('comun.mesSiguiente')}><Icon name="chevron-right" size={18} /></button>
                    </div>
                </div>

                <div className="calendario-dias-semana">
                    {nombresDias.map((dia, index) => (
                        <div key={index} className="dia-semana-nombre">{dia}</div>
                    ))}
                </div>

                <div className="calendario-grid">
                    {celdas.map((dia, index) => {

                        const fechaHoy = new Date();
                        const esHoy = dia === fechaHoy.getDate() && mes === fechaHoy.getMonth() && anio === fechaHoy.getFullYear();

                        const metasDelDia = metas.filter((meta) => esDelDia(meta.fecha_objetivo, dia));

                        const tareasDelDia = tareas.filter((tarea) => esDelDia(tarea.fecha_limite, dia));

                        const ingresosDelDia = transacciones.filter((t) => t.tipo === 'ingreso' && esDelDia(t.fecha, dia));

                        const gastosDelDia = transacciones.filter((t) => t.tipo === 'gasto' && esDelDia(t.fecha, dia));

                        const suscripcionesDelDia = suscripciones.filter((s) => esDelDia(s.fecha_renovacion, dia));
                        

                        return (
                            <div key={index} className={`celda-dia  ${dia === null ? 'celda-vacia' : ''} ${esHoy ? 'dia-hoy' : ''}`}>
                                {dia !== null && <span className="celda-numero">{dia}</span>}
                                <div className="celda-puntos">
                                    {metasDelDia.map((meta, i) => (
                                        <span key={i} className="punto-meta" title={meta.nombre_meta}></span>
                                    ))}
                                    {tareasDelDia.map((tarea, i) => (
                                        <span key={i} className="punto-tarea" title={tarea.titulo}></span>
                                    ))}
                                    {ingresosDelDia.length > 0 && <span className="punto-ingreso" title={t('calendario.ingreso')}></span>}
                                    {gastosDelDia.length > 0 && <span className="punto-gasto" title={t('calendario.gasto')}></span>}
                                    {suscripcionesDelDia.length > 0 && <span className="punto-suscripcion" title={t('calendario.suscripcion')}></span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="calendario-inferior">
                <div className="leyenda-card">
                    <h3>{t('calendario.leyenda')}</h3>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-dia-actual"></span>
                        {t('calendario.diaActual')}
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-ingreso"></span>
                        {t('calendario.ingreso')}
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-gasto"></span>
                        {t('calendario.gasto')}
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-suscripcion"></span>
                        {t('calendario.suscripcion')}
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-meta"></span>
                        {t('calendario.meta')}
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-tarea"></span>
                        {t('calendario.tarea')}
                    </div>
                </div>

                <div className="estadisticas-card">
                    <h3>{t('calendario.estadisticas')}</h3>
                    <div className="estadistica-fila">
                        <span>{t('calendario.totalIngresos')}</span>
                        <span className="estadistica-valor valor-ingreso">${totalIngresos.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="estadistica-fila">
                        <span>{t('calendario.totalGastos')}</span>
                        <span className="estadistica-valor valor-gasto">${totalGastos.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="estadistica-fila">
                        <span>{t('calendario.suscripcionesMes')}</span>
                        <span className="estadistica-valor valor-suscripcion">{suscripcionesDelMes}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calendario;