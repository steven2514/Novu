import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import './Inicio.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { IconoMarca, buscarMarca } from '../components/IconoMarca';
import { useState, useEffect } from 'react';

function Inicio({ transacciones, metas, suscripciones, cuentas = [], sesion, abrirModal }) {

    const { mostrarTour, cerrarTour } = useTour('dashboard', sesion);

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
    const [ocultarValores, setOcultarValores] = useState(false);
    const [temaOscuro, setTemaOscuro] = useState(() => document.documentElement.getAttribute('data-theme') !== 'light');
    const [periodoResumen, setPeriodoResumen] = useState('mes');

    // Aplica el tema guardado al <html> apenas se monta el dashboard.
    // Antes solo se aplicaba dentro de alternarTema(), así que al cargar/refrescar
    // la página el atributo data-theme="dark" nunca quedaba puesto y el selector
    // [data-theme="dark"] body (blobs de color del fondo) no calzaba nunca.
    // Nota: lo ideal a futuro es mover esto a App.jsx o main.jsx para que aplique
    // en toda la app desde el primer render, no solo cuando se visita Inicio.
    useEffect(() => {
        const guardado = localStorage.getItem('tema'); // 'oscuro' | 'claro' | null
        const oscuro = guardado ? guardado === 'oscuro' : true; // por defecto oscuro si no hay preferencia guardada
        document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
        setTemaOscuro(oscuro);
    }, []);

    function alternarTema() {
        const nuevoOscuro = !temaOscuro;
        document.documentElement.setAttribute('data-theme', nuevoOscuro ? 'dark' : 'light');
        localStorage.setItem('tema', nuevoOscuro ? 'oscuro' : 'claro');
        setTemaOscuro(nuevoOscuro);
    }

    const nombreUsuario = sesion?.user?.user_metadata?.nombre
        || sesion?.user?.user_metadata?.full_name
        || sesion?.user?.email?.split('@')[0]
        || 'Usuario';

    const transaccionesDelMes = transacciones.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesSeleccionado.getMonth() && fecha.getFullYear() === mesSeleccionado.getFullYear();
    });

    const balance = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGasto = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    // Comparación real contra el mes anterior al seleccionado (no inventada)
    const mesAnterior = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1, 1);
    const transaccionesMesAnterior = transacciones.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesAnterior.getMonth() && fecha.getFullYear() === mesAnterior.getFullYear();
    });
    const ingresosMesAnterior = transaccionesMesAnterior
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);
    const gastosMesAnterior = transaccionesMesAnterior
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    function calcularTendencia(actual, anterior) {
        if (anterior <= 0) return null;
        return ((actual - anterior) / anterior) * 100;
    }

    const tendenciaIngresos = calcularTendencia(totalIngresos, ingresosMesAnterior);
    const tendenciaGastos = calcularTendencia(totalGasto, gastosMesAnterior);

    const ahorradoEnMetas = metas.reduce((acc, m) => acc + Number(m.monto_actual || 0), 0);

    const totalSuscripcionesMensual = suscripciones.reduce((acc, s) => acc + Number(s.monto || 0), 0);

    const gastosPorCategoria = transaccionesDelMes
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => {
            const cat = acc.find(c => c.categoria === t.categoria);
            if (cat) cat.valor += Number(t.monto);
            else acc.push({ categoria: t.categoria, valor: Number(t.monto) });
            return acc;
        }, []);

    const hoy = new Date();

    const MESES_CORTOS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    function mismoDia(fechaStr, d) {
        const f = new Date(fechaStr);
        return f.getDate() === d.getDate() && f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear();
    }

    function totalesEntre(inicio, fin, tipo) {
        return transacciones
            .filter(t => {
                const f = new Date(t.fecha);
                return t.tipo === tipo && f >= inicio && f <= fin;
            })
            .reduce((acc, t) => acc + Number(t.monto), 0);
    }

    // Datos reales para "Resumen de movimientos", según el período elegido (Semana / Mes / Año)
    function datosResumen() {
        if (periodoResumen === 'semana') {
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (6 - i));
                const ingresos = transacciones.filter(t => t.tipo === 'ingreso' && mismoDia(t.fecha, d)).reduce((a, t) => a + Number(t.monto), 0);
                const gastos = transacciones.filter(t => t.tipo === 'gasto' && mismoDia(t.fecha, d)).reduce((a, t) => a + Number(t.monto), 0);
                return { mes: `${d.getDate()} ${MESES_CORTOS_ES[d.getMonth()]}`, ingresos, gastos };
            });
        }

        if (periodoResumen === 'año') {
            return Array.from({ length: 12 }, (_, i) => {
                const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
                const inicio = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);
                const fin = new Date(fechaMes.getFullYear(), fechaMes.getMonth() + 1, 0, 23, 59, 59);
                return {
                    mes: MESES_CORTOS_ES[fechaMes.getMonth()],
                    ingresos: totalesEntre(inicio, fin, 'ingreso'),
                    gastos: totalesEntre(inicio, fin, 'gasto'),
                };
            });
        }

        // 'mes': semanas dentro del mes seleccionado
        const inicioMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
        const finMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0, 23, 59, 59);
        const semanas = [];
        let cursor = new Date(inicioMes);
        while (cursor <= finMes) {
            const inicioSemana = new Date(cursor);
            const finSemanaCalculado = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6, 23, 59, 59);
            const finSemana = finSemanaCalculado > finMes ? finMes : finSemanaCalculado;
            semanas.push({
                mes: `${inicioSemana.getDate()} ${MESES_CORTOS_ES[inicioSemana.getMonth()]}`,
                ingresos: totalesEntre(inicioSemana, finSemana, 'ingreso'),
                gastos: totalesEntre(inicioSemana, finSemana, 'gasto'),
            });
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
        }
        return semanas;
    }

    const COLORES = ['#8B7EF6', '#F16C7A', '#FFA94D', '#C9A8F5', '#5FD4D0', '#C9CED6'];

    function formatoMonto(valor, signo = '') {
        if (ocultarValores) return '••••••';
        return `${signo}$${Math.abs(Number(valor)).toLocaleString('es-CO')}`;
    }

    function iniciales(nombre) {
        return (nombre || '?').trim().slice(0, 1).toUpperCase();
    }

    return (
        <div className='dashboard'>
            <div className="dashboard-header">
                <div>
                    <p className="dashboard-saludo">👋 {nombreUsuario}</p>
                    <h1>Inicio</h1>
                </div>
                <div className="dashboard-top-actions">
                    <button className="dashboard-icon-btn" onClick={() => alert('Búsqueda: próximamente 🔍')} title="Buscar">
                        <Icon name="search" size={18} />
                    </button>
                    <button className="dashboard-icon-btn" onClick={() => alert('No tienes notificaciones nuevas por ahora.')} title="Notificaciones">
                        <Icon name="bell" size={18} />
                    </button>
                    <button className="dashboard-icon-btn" onClick={alternarTema} title="Cambiar tema">
                        <Icon name={temaOscuro ? 'sun' : 'moon'} size={18} />
                    </button>
                    <button className="dashboard-btn-ojo" onClick={() => setOcultarValores(v => !v)} title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}>
                        <Icon name={ocultarValores ? 'eye-off' : 'eye'} size={18} />
                    </button>
                    {abrirModal && (
                        <button className="dashboard-btn-nuevo" onClick={() => abrirModal('gasto')}>
                            <Icon name="plus" size={16} /> <span>Nuevo</span>
                        </button>
                    )}
                </div>
            </div>

            <div className='dashboard-mes-selector'>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1))}>
                    <Icon name="chevron-left" size={16} />
                </button>
                <span>{mesSeleccionado.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1))}>
                    <Icon name="chevron-right" size={16} />
                </button>
            </div>

            {/* Fila de 4 tarjetas de estadísticas */}
            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">Balance total</span>
                        <span
                            className="dashboard-stat-icon"
                            style={{
                                backgroundColor: '#6C7FF0',
                                color: '#ffffff',
                                boxShadow: '0 6px 14px rgba(108, 127, 240, 0.45)',
                            }}
                        >
                            <Icon name="wallet" size={18} />
                        </span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(balance)}</div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">Ingresos</span>
                        <span
                            className="dashboard-stat-icon"
                            style={{
                                backgroundColor: '#8B7EF6',
                                color: '#ffffff',
                                boxShadow: '0 6px 14px rgba(139, 126, 246, 0.45)',
                            }}
                        >
                            <Icon name="download" size={18} />
                        </span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(totalIngresos)}</div>
                    {tendenciaIngresos !== null && (
                        <small className={tendenciaIngresos >= 0 ? 'dashboard-tendencia-up-claro' : 'dashboard-tendencia-down-claro'}>
                            {tendenciaIngresos >= 0 ? '▲' : '▼'} {Math.abs(tendenciaIngresos).toFixed(1)}% vs el mes pasado
                        </small>
                    )}
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">Gastos</span>
                        <span
                            className="dashboard-stat-icon"
                            style={{
                                backgroundColor: '#F16C7A',
                                color: '#ffffff',
                                boxShadow: '0 6px 14px rgba(241, 108, 122, 0.45)',
                            }}
                        >
                            <Icon name="arrow-up-circle" size={18} />
                        </span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(totalGasto)}</div>
                    {tendenciaGastos !== null && (
                        <small className={tendenciaGastos <= 0 ? 'dashboard-tendencia-up-claro' : 'dashboard-tendencia-down-claro'}>
                            {tendenciaGastos >= 0 ? '▲' : '▼'} {Math.abs(tendenciaGastos).toFixed(1)}% vs el mes pasado
                        </small>
                    )}
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">Ahorros</span>
                        <span
                            className="dashboard-stat-icon"
                            style={{
                                backgroundColor: '#34D399',
                                color: '#ffffff',
                                boxShadow: '0 6px 14px rgba(52, 211, 153, 0.45)',
                            }}
                        >
                            <Icon name="piggy-bank" size={18} />
                        </span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(ahorradoEnMetas)}</div>
                </div>
            </div>

            {/* Fila principal: gráfica + dona + columna lateral (Metas / Suscripciones) */}
            <div className="dashboard-grid-main">
                <div className="dashboard-caja dashboard-grid-resumen">
                    <div className="dashboard-caja-header">
                        <h3>Resumen de movimientos</h3>
                        <div className="tabs-periodo">
                            <button className={periodoResumen === 'semana' ? 'activo' : ''} onClick={() => setPeriodoResumen('semana')}>Semana</button>
                            <button className={periodoResumen === 'mes' ? 'activo' : ''} onClick={() => setPeriodoResumen('mes')}>Mes</button>
                            <button className={periodoResumen === 'año' ? 'activo' : ''} onClick={() => setPeriodoResumen('año')}>Año</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={datosResumen()}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6EE7A8" stopOpacity={0.55} />
                                    <stop offset="95%" stopColor="#6EE7A8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F16C7A" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#F16C7A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--texto-gris)' }} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'var(--texto-gris)' }}
                                tickFormatter={(valor) => valor === 0 ? '$0' : `$${(valor / 1000).toLocaleString('es-CO')}k`}
                                width={40}
                            />
                            <Tooltip formatter={(valor) => `$${Number(valor).toLocaleString('es-CO')}`} />
                            <Area type="monotone" dataKey="ingresos" stroke="#4ADE80" strokeWidth={2.5} fill="url(#colorIngresos)" />
                            <Area type="monotone" dataKey="gastos" stroke="#F16C7A" strokeWidth={2.5} fill="url(#colorGastos)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="legend-resumen">
                        <span><i className="dot-ingreso" /> Ingresos</span>
                        <span><i className="dot-gasto" /> Gastos</span>
                    </div>
                </div>

                <div className="dashboard-caja dashboard-grid-dona">
                    <h3>Distribución de gastos</h3>
                    {totalGasto === 0 ? (
                        <p className="dashboard-caja-vacia">Sin gastos registrados este mes</p>
                    ) : (
                        <>
                            <div className="dashboard-donut-row">
                                <div className="dashboard-donut-chart-wrap">
                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie data={gastosPorCategoria} dataKey="valor" nameKey="categoria" innerRadius={58} outerRadius={85} paddingAngle={2}>
                                                {gastosPorCategoria.map((entry, index) => (
                                                    <Cell key={index} fill={COLORES[index % COLORES.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(valor) => `$${Number(valor).toLocaleString('es-CO')}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="dashboard-donut-center">
                                        <strong>{formatoMonto(totalGasto)}</strong>
                                        <span>Total</span>
                                    </div>
                                </div>
                                <div className="dashboard-donut-legend">
                                    <div className="dashboard-donut-legend-header">
                                        <span>Categorías</span>
                                        <span>%</span>
                                    </div>
                                    {gastosPorCategoria
                                        .slice()
                                        .sort((a, b) => b.valor - a.valor)
                                        .map((cat) => (
                                            <div key={cat.categoria} className="dashboard-donut-legend-item">
                                                <span>
                                                    <i style={{ backgroundColor: COLORES[gastosPorCategoria.indexOf(cat) % COLORES.length] }} />
                                                    {cat.categoria}
                                                </span>
                                                <b>{Math.round((cat.valor / totalGasto) * 100)}%</b>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="dashboard-col-lateral">
                    <div className="dashboard-caja">
                        <div className="dashboard-caja-header">
                            <h3>Metas</h3>
                            <Link to="/Metas" className="dashboard-ver-todo">Ver todas</Link>
                        </div>
                        {metas.length === 0 ? (
                            <p className="dashboard-caja-vacia">No hay metas activas</p>
                        ) : (
                            metas.slice(0, 3).map((meta, index) => {
                                const porcentaje = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100);
                                return (
                                    <div key={index} className="meta-dashboard">
                                        <div className="meta-dashboard-header">
                                            <span>{meta.nombre_meta}</span>
                                            <span>{formatoMonto(meta.monto_actual)} / {formatoMonto(meta.monto_objetivo)}</span>
                                        </div>
                                        <div className="barra-fondo">
                                            <div className="barra-progreso" style={{ width: `${porcentaje}%`, backgroundColor: meta.color }}></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="dashboard-caja">
                        <div className="dashboard-caja-header">
                            <h3>Suscripciones</h3>
                            <Link to="/Suscripciones" className="dashboard-ver-todo">Ver todas</Link>
                        </div>
                        {suscripciones.length === 0 ? (
                            <p className="dashboard-caja-vacia">No hay suscripciones</p>
                        ) : (
                            <>
                                {suscripciones
                                    .slice()
                                    .sort((a, b) => new Date(a.fecha_renovacion) - new Date(b.fecha_renovacion))
                                    .slice(0, 3)
                                    .map((sus, index) => {
                                        const marca = buscarMarca(sus.nombre);
                                        return (
                                            <div key={index} className="pago-proximo">
                                                <span className="pago-proximo-nombre">
                                                    {marca ? (
                                                        <IconoMarca nombre={sus.nombre} size={14} badgeSize={26} borderRadius="8px" />
                                                    ) : (
                                                        <span className="pago-proximo-icono-generico" style={{ backgroundColor: (sus.color || '#6C63FF') + '22', color: sus.color || '#6C63FF' }}>
                                                            <Icon name={sus.icono} size={13} />
                                                        </span>
                                                    )}
                                                    {sus.nombre}
                                                </span>
                                                <span>{formatoMonto(sus.monto)}</span>
                                            </div>
                                        );
                                    })}
                                <div className="dashboard-total-mensual">
                                    <span>Total mensual</span>
                                    <b>{formatoMonto(totalSuscripcionesMensual)}</b>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="dashboard-caja dashboard-grid-recientes">
                    <div className="dashboard-caja-header">
                        <h3>Movimientos recientes</h3>
                        <Link to="/transacciones" className="dashboard-ver-todo">Ver todos</Link>
                    </div>
                    {transacciones.length === 0 ? (
                        <p className="dashboard-caja-vacia">No tienes movimientos todavía</p>
                    ) : (
                        transacciones
                            .slice()
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .slice(0, 4)
                            .map((t) => {
                                const marca = buscarMarca(t.descripcion);
                                return (
                                    <div key={t.id} className="fila-movimiento-reciente">
                                        {marca ? (
                                            <IconoMarca nombre={t.descripcion} size={16} badgeSize={34} borderRadius="50%" />
                                        ) : (
                                            <div className="fila-movimiento-avatar">{iniciales(t.descripcion)}</div>
                                        )}
                                        <div className="fila-movimiento-info">
                                            <b>{t.descripcion}</b>
                                            <small>{t.categoria || 'Sin categoría'}</small>
                                        </div>
                                        <span className={t.tipo === 'ingreso' ? 'dashboard-monto-in' : 'dashboard-monto-out'}>
                                            {t.tipo === 'ingreso' ? '+ ' : '- '}{formatoMonto(t.monto)}
                                        </span>
                                    </div>
                                );
                            })
                    )}
                </div>

                <div className="dashboard-caja dashboard-grid-transferencia">
                    <h3>Transferencia rápida</h3>
                    <p className="dashboard-transferencia-sub">Mueve dinero entre tus propias cuentas.</p>
                    {cuentas.length === 0 ? (
                        <p className="dashboard-caja-vacia">Agrega una cuenta para transferir</p>
                    ) : (
                        <div className="dashboard-avatares-cuentas">
                            {cuentas.slice(0, 3).map((c) => (
                                <button key={c.id} className="dashboard-avatar-cuenta" onClick={() => abrirModal && abrirModal('transferencia')} title={c.nombre}>
                                    <span style={{ backgroundColor: c.color || 'var(--dash-accent-1)' }}>{iniciales(c.nombre)}</span>
                                    <small>{c.nombre}</small>
                                </button>
                            ))}
                            <Link to="/cuentas" className="dashboard-avatar-cuenta">
                                <span className="dashboard-avatar-agregar"><Icon name="plus" size={16} /></span>
                                <small>Agregar</small>
                            </Link>
                        </div>
                    )}
                    {abrirModal && (
                        <button className="dashboard-btn-transferir" onClick={() => abrirModal('transferencia')}>
                            <Icon name="send" size={14} /> Transferir
                        </button>
                    )}
                </div>
            </div>

            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: '¡Bienvenido a NOVU!', texto: 'Aquí ves tu balance, ingresos, gastos y metas de un vistazo.' },
                { titulo: 'Tus gráficas', texto: 'Visualiza tu flujo mensual y en qué categorías gastas más.' }
            ]} />}
        </div>
    );
}

export default Inicio;