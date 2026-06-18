import { useState } from "react";
import './Calendario.css';


function Calendario({ metas, transacciones, suscripciones }) {

    const [fechaActual, setFechaActual] = useState(new Date());
    const mes = fechaActual.getMonth();
    const anio = fechaActual.getFullYear();
    const diasEnElMes = new Date(anio, mes + 1, 0).getDate();
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const diasDelMes = Array.from({ length: diasEnElMes }, (_, i) => i + 1);
    const celdasVacias = Array.from({ length: primerDiaSemana }, () => null);
    const celdas = [...celdasVacias, ...diasDelMes];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Transacciones que caen dentro del mes que se está mostrando (mes/anio de arriba)
    const transaccionesDelMes = transacciones.filter((t) => {
        const fechaT = new Date(t.fecha);
        return fechaT.getMonth() === mes && fechaT.getFullYear() === anio;
    });

    // De esas, solo las de tipo ingreso, sumadas con reduce
    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    // De esas, solo las de tipo gasto, sumadas con reduce
    const totalGastos = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    // Cuántas suscripciones se renuevan en el mes que se está mostrando
    const suscripcionesDelMes = suscripciones.filter((s) => {
        if (!s.fechaRenovacion) return false;
        const fechaS = new Date(s.fechaRenovacion);
        return fechaS.getMonth() === mes && fechaS.getFullYear() === anio;
    }).length;

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
            <div className="calendario-header">
                <div>
                    <h1>Calendario de Pagos</h1>
                    <p>Visualiza tus pagos y transacciones</p>
                </div>
                <button onClick={hoy}>Hoy</button>
            </div>

            <div className="calendario-card">
                <div className="calendario-mes-header">
                    <h2>{nombresMeses[mes]} {anio}</h2>
                    <div className="calendario-flechas">
                        <button onClick={mesAnterior}>‹</button>
                        <button onClick={mesSiguiente}>›</button>
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

                        const metasDelDia = metas.filter((meta) => {
                            if (!meta.fechaObjetivo) return false;
                            const fechaMeta = new Date(meta.fechaObjetivo);
                            return dia === fechaMeta.getDate() && mes === fechaMeta.getMonth() && anio === fechaMeta.getFullYear();
                        });

                        return (
                            <div key={index} className={`celda-dia  ${dia === null ? 'celda-vacia' : ''} ${esHoy ? 'dia-hoy' : ''}`}>
                                {dia}
                                {metasDelDia.map((meta, i) => (
                                    <span key={i} className="punto-meta" style={{ backgroundColor: meta.color }} title={meta.nombreMeta}></span>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="calendario-inferior">
                <div className="leyenda-card">
                    <h3>Leyenda</h3>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-dia-actual"></span>
                        Día actual
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-ingreso"></span>
                        Ingreso
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-gasto"></span>
                        Gasto
                    </div>
                    <div className="leyenda-item">
                        <span className="leyenda-color leyenda-suscripcion"></span>
                        Suscripción
                    </div>
                </div>

                <div className="estadisticas-card">
                    <h3>Estadísticas del Mes</h3>
                    <div className="estadistica-fila">
                        <span>Total Ingresos</span>
                        <span className="estadistica-valor valor-ingreso">${totalIngresos.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="estadistica-fila">
                        <span>Total Gastos</span>
                        <span className="estadistica-valor valor-gasto">${totalGastos.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="estadistica-fila">
                        <span>Suscripciones del Mes</span>
                        <span className="estadistica-valor valor-suscripcion">{suscripcionesDelMes}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calendario;