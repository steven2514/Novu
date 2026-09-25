import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import './Inicio.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { IconoMarca, buscarMarca } from '../components/IconoMarca';
import { useState } from 'react';
import { parseFecha, mismoMes, mismoDia, compararFechas } from '../utils/fechas';
import { aplicarTema, temaGuardado } from '../utils/tema';
import { useIdioma, nombreCategoria } from '../i18n/idioma';
import { montoMensual } from '../utils/suscripciones';

// Paleta de categorías: teal, coral, ámbar, violeta, menta y gris
const COLORES = ['#0B5E66', '#FF6B4A', '#E39A2D', '#5B4FD6', '#5FC4BA', '#94A3B8'];

const estiloTooltip = {
    contentStyle: {
        background: 'var(--tarjeta)',
        border: '1px solid var(--borde)',
        borderRadius: 12,
        boxShadow: '0 12px 30px rgba(16, 38, 43, 0.12)',
        fontSize: 13,
    },
    labelStyle: { color: 'var(--texto)', fontWeight: 700 },
    itemStyle: { color: 'var(--texto-gris)' },
};

function claveSaludo() {
    const hora = new Date().getHours();
    if (hora < 12) return 'inicio.buenosDias';
    if (hora < 19) return 'inicio.buenasTardes';
    return 'inicio.buenasNoches';
}

function Inicio({ transacciones, metas, suscripciones, cuentas = [], presupuestos = [], sesion, abrirModal }) {

    const { mostrarTour, cerrarTour } = useTour('dashboard', sesion);
    const { t, locale } = useIdioma();

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
    const [ocultarValores, setOcultarValores] = useState(false);
    const [temaOscuro, setTemaOscuro] = useState(() => temaGuardado() === 'oscuro');
    const [periodoResumen, setPeriodoResumen] = useState('mes');

    // El tema se aplica al iniciar la app (main.jsx); aquí solo se alterna.
    function alternarTema() {
        const nuevoOscuro = !temaOscuro;
        aplicarTema(nuevoOscuro ? 'oscuro' : 'claro');
        setTemaOscuro(nuevoOscuro);
    }

    const nombreUsuario = sesion?.user?.user_metadata?.nombre
        || sesion?.user?.user_metadata?.full_name
        || sesion?.user?.email?.split('@')[0]
        || t('comun.usuario');

    const transaccionesDelMes = transacciones.filter(mov => mismoMes(parseFecha(mov.fecha), mesSeleccionado));

    const balance = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGasto = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    // Comparación real contra el mes anterior al seleccionado (no inventada)
    const mesAnterior = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1, 1);
    const transaccionesMesAnterior = transacciones.filter(t => mismoMes(parseFecha(t.fecha), mesAnterior));
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

    const totalSuscripcionesMensual = suscripciones.reduce((acc, s) => acc + montoMensual(s), 0);

    const gastosPorCategoria = transaccionesDelMes
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => {
            const cat = acc.find(c => c.categoria === t.categoria);
            if (cat) cat.valor += Number(t.monto);
            else acc.push({ categoria: t.categoria, valor: Number(t.monto) });
            return acc;
        }, []);

    const hoy = new Date();

    // Presupuestos del mes seleccionado, los más cerca de su límite primero
    const presupuestosDelMes = presupuestos
        .map(p => {
            const gastado = gastosPorCategoria.find(c => c.categoria === p.categoria)?.valor || 0;
            const porcentaje = Number(p.monto) > 0 ? (gastado / Number(p.monto)) * 100 : 0;
            return { ...p, gastado, porcentaje };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    const mesCorto = (fecha) => fecha.toLocaleDateString(locale, { month: 'short' }).replace('.', '');

    function totalesEntre(inicio, fin, tipo) {
        return transacciones
            .filter(t => {
                const f = parseFecha(t.fecha);
                return t.tipo === tipo && f && f >= inicio && f <= fin;
            })
            .reduce((acc, t) => acc + Number(t.monto), 0);
    }

    // Datos reales para "Resumen de movimientos", según el período elegido (Semana / Mes / Año)
    function datosResumen() {
        if (periodoResumen === 'semana') {
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (6 - i));
                const ingresos = transacciones.filter(t => t.tipo === 'ingreso' && mismoDia(parseFecha(t.fecha), d)).reduce((a, t) => a + Number(t.monto), 0);
                const gastos = transacciones.filter(t => t.tipo === 'gasto' && mismoDia(parseFecha(t.fecha), d)).reduce((a, t) => a + Number(t.monto), 0);
                return { mes: `${d.getDate()} ${mesCorto(d)}`, ingresos, gastos };
            });
        }

        if (periodoResumen === 'año') {
            return Array.from({ length: 12 }, (_, i) => {
                const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
                const inicio = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);
                const fin = new Date(fechaMes.getFullYear(), fechaMes.getMonth() + 1, 0, 23, 59, 59);
                return {
                    mes: mesCorto(fechaMes),
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
                mes: `${inicioSemana.getDate()} ${mesCorto(inicioSemana)}`,
                ingresos: totalesEntre(inicioSemana, finSemana, 'ingreso'),
                gastos: totalesEntre(inicioSemana, finSemana, 'gasto'),
            });
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
        }
        return semanas;
    }

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
                    <p className="overline">{t(claveSaludo())}, {nombreUsuario}</p>
                    <h1>{t('inicio.titulo')}</h1>
                    <p>{hoy.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="dashboard-top-actions">
                    <div className='dashboard-mes-selector'>
                        <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1))} aria-label={t('comun.mesAnterior')}>
                            <Icon name="chevron-left" size={16} />
                        </button>
                        <span>{mesSeleccionado.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1))} aria-label={t('comun.mesSiguiente')}>
                            <Icon name="chevron-right" size={16} />
                        </button>
                    </div>
                    <button className="dashboard-icon-btn" onClick={() => setOcultarValores(v => !v)} title={ocultarValores ? t('inicio.mostrarValores') : t('inicio.ocultarValores')}>
                        <Icon name={ocultarValores ? 'eye-off' : 'eye'} size={18} />
                    </button>
                    <button className="dashboard-icon-btn" onClick={alternarTema} title={temaOscuro ? t('inicio.temaClaro') : t('inicio.temaOscuro')}>
                        <Icon name={temaOscuro ? 'sun' : 'moon'} size={18} />
                    </button>
                    {abrirModal && (
                        <button className="btn-pildora-acento" onClick={() => abrirModal('gasto')}>
                            <Icon name="plus" size={16} /> {t('sidebar.nuevoMovimiento')}
                        </button>
                    )}
                </div>
            </div>

            {/* Balance destacado + 3 métricas del mes */}
            <div className="dashboard-stats">
                <div className="dashboard-stat-card dashboard-stat-destacada">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">{t('inicio.balanceTotal')}</span>
                        <span className="dashboard-stat-icon"><Icon name="wallet" size={18} /></span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(balance)}</div>
                    <small className="dashboard-stat-nota">
                        {t('comun.cuentas', { n: cuentas.length })} · {t('inicio.flujoMes')} {formatoMonto(totalIngresos - totalGasto, totalIngresos - totalGasto < 0 ? '-' : '+')}
                    </small>
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">{t('inicio.ingresosMes')}</span>
                        <span className="dashboard-stat-icon stat-icon-positivo"><Icon name="arrow-down-left" size={18} /></span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(totalIngresos)}</div>
                    {tendenciaIngresos !== null ? (
                        <small className={tendenciaIngresos >= 0 ? 'dashboard-tendencia-up-claro' : 'dashboard-tendencia-down-claro'}>
                            {tendenciaIngresos >= 0 ? '▲' : '▼'} {t('inicio.vsMesPasado', { p: Math.abs(tendenciaIngresos).toFixed(1) })}
                        </small>
                    ) : <small className="dashboard-stat-nota">{t('inicio.sinDatosMesPasado')}</small>}
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">{t('inicio.gastosMes')}</span>
                        <span className="dashboard-stat-icon stat-icon-negativo"><Icon name="arrow-up-right" size={18} /></span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(totalGasto)}</div>
                    {tendenciaGastos !== null ? (
                        <small className={tendenciaGastos <= 0 ? 'dashboard-tendencia-up-claro' : 'dashboard-tendencia-down-claro'}>
                            {tendenciaGastos >= 0 ? '▲' : '▼'} {t('inicio.vsMesPasado', { p: Math.abs(tendenciaGastos).toFixed(1) })}
                        </small>
                    ) : <small className="dashboard-stat-nota">{t('inicio.sinDatosMesPasado')}</small>}
                </div>

                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-top">
                        <span className="dashboard-stat-label">{t('inicio.ahorradoMetas')}</span>
                        <span className="dashboard-stat-icon stat-icon-ahorro"><Icon name="piggy-bank" size={18} /></span>
                    </div>
                    <div className="dashboard-stat-value">{formatoMonto(ahorradoEnMetas)}</div>
                    <small className="dashboard-stat-nota">{t('inicio.metasActivas', { n: metas.length })}</small>
                </div>
            </div>

            {/* Fila principal: gráfica + dona + columna lateral (Metas / Suscripciones) */}
            <div className="dashboard-grid-main">
                <div className="dashboard-caja dashboard-grid-resumen">
                    <div className="dashboard-caja-header">
                        <h3>{t('inicio.resumenMovimientos')}</h3>
                        <div className="tabs-periodo">
                            <button className={periodoResumen === 'semana' ? 'activo' : ''} onClick={() => setPeriodoResumen('semana')}>{t('inicio.semana')}</button>
                            <button className={periodoResumen === 'mes' ? 'activo' : ''} onClick={() => setPeriodoResumen('mes')}>{t('inicio.mes')}</button>
                            <button className={periodoResumen === 'año' ? 'activo' : ''} onClick={() => setPeriodoResumen('año')}>{t('inicio.anio')}</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={270}>
                        <AreaChart data={datosResumen()}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#12A77F" stopOpacity={0.28} />
                                    <stop offset="95%" stopColor="#12A77F" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.22} />
                                    <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--texto-gris)' }} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'var(--texto-gris)' }}
                                tickFormatter={(valor) => valor === 0 ? '$0' : `$${(valor / 1000).toLocaleString('es-CO')}k`}
                                width={56}
                            />
                            <Tooltip {...estiloTooltip} formatter={(valor) => `$${Number(valor).toLocaleString("es-CO")}`} />
                            <Area type="monotone" dataKey="ingresos" name={t('inicio.ingresos')} stroke="#12A77F" strokeWidth={2.5} fill="url(#colorIngresos)" dot={false} />
                            <Area type="monotone" dataKey="gastos" name={t('inicio.gastos')} stroke="#FF6B4A" strokeWidth={2.5} fill="url(#colorGastos)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="legend-resumen">
                        <span><i className="dot-ingreso" /> {t('inicio.ingresos')}</span>
                        <span><i className="dot-gasto" /> {t('inicio.gastos')}</span>
                    </div>
                </div>

                <div className="dashboard-caja dashboard-grid-dona">
                    <h3>{t('inicio.distribucion')}</h3>
                    {totalGasto === 0 ? (
                        <p className="dashboard-caja-vacia">{t('inicio.sinGastosMes')}</p>
                    ) : (
                        <>
                            <div className="dashboard-donut-row">
                                <div className="dashboard-donut-chart-wrap">
                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie data={gastosPorCategoria} dataKey="valor" nameKey="categoria" innerRadius={58} outerRadius={85} paddingAngle={2} stroke="none">
                                                {gastosPorCategoria.map((entry, index) => (
                                                    <Cell key={index} fill={COLORES[index % COLORES.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...estiloTooltip} formatter={(valor) => `$${Number(valor).toLocaleString("es-CO")}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="dashboard-donut-center">
                                        <strong>{formatoMonto(totalGasto)}</strong>
                                        <span>{t('inicio.total')}</span>
                                    </div>
                                </div>
                                <div className="dashboard-donut-legend">
                                    <div className="dashboard-donut-legend-header">
                                        <span>{t('inicio.categorias')}</span>
                                        <span>%</span>
                                    </div>
                                    {gastosPorCategoria
                                        .slice()
                                        .sort((a, b) => b.valor - a.valor)
                                        .map((cat) => (
                                            <div key={cat.categoria} className="dashboard-donut-legend-item">
                                                <span>
                                                    <i style={{ backgroundColor: COLORES[gastosPorCategoria.indexOf(cat) % COLORES.length] }} />
                                                    {nombreCategoria(cat.categoria)}
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
                            <h3>{t('inicio.metas')}</h3>
                            <Link to="/Metas" className="dashboard-ver-todo">{t('comun.verTodas')}</Link>
                        </div>
                        {metas.length === 0 ? (
                            <p className="dashboard-caja-vacia">{t('inicio.sinMetas')}</p>
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
                            <h3>{t('inicio.presupuestos')}</h3>
                            <Link to="/presupuestos" className="dashboard-ver-todo">{t('comun.verTodos')}</Link>
                        </div>
                        {presupuestosDelMes.length === 0 ? (
                            <div className="dashboard-caja-vacia">
                                <p>{t('inicio.sinPresupuestos')}</p>
                                <Link to="/presupuestos" className="dashboard-ver-todo">{t('inicio.crearPresupuesto')}</Link>
                            </div>
                        ) : (
                            presupuestosDelMes.slice(0, 3).map((p) => (
                                <div key={p.id} className="meta-dashboard">
                                    <div className="meta-dashboard-header">
                                        <span>{nombreCategoria(p.categoria)}</span>
                                        <span>{formatoMonto(p.gastado)} / {formatoMonto(p.monto)}</span>
                                    </div>
                                    <div className="barra-fondo">
                                        <div
                                            className={`barra-progreso barra-presupuesto ${p.porcentaje > 100 ? 'excedido' : p.porcentaje >= 80 ? 'alerta' : ''}`}
                                            style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dashboard-caja">
                        <div className="dashboard-caja-header">
                            <h3>{t('inicio.suscripciones')}</h3>
                            <Link to="/Suscripciones" className="dashboard-ver-todo">{t('comun.verTodas')}</Link>
                        </div>
                        {suscripciones.length === 0 ? (
                            <p className="dashboard-caja-vacia">{t('inicio.sinSuscripciones')}</p>
                        ) : (
                            <>
                                {suscripciones
                                    .slice()
                                    .sort((a, b) => compararFechas(a.fecha_renovacion, b.fecha_renovacion))
                                    .slice(0, 3)
                                    .map((sus, index) => {
                                        const marca = buscarMarca(sus.nombre);
                                        return (
                                            <div key={index} className="pago-proximo">
                                                <span className="pago-proximo-nombre">
                                                    {marca ? (
                                                        <IconoMarca nombre={sus.nombre} size={14} badgeSize={26} borderRadius="8px" />
                                                    ) : (
                                                        <span className="pago-proximo-icono-generico" style={{ backgroundColor: (sus.color || "#0B5E66") + '22', color: sus.color || "#0B5E66" }}>
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
                                    <span>{t('inicio.totalMensual')}</span>
                                    <b>{formatoMonto(totalSuscripcionesMensual)}</b>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="dashboard-caja dashboard-grid-recientes">
                    <div className="dashboard-caja-header">
                        <h3>{t('inicio.recientes')}</h3>
                        <Link to="/transacciones" className="dashboard-ver-todo">{t('comun.verTodos')}</Link>
                    </div>
                    {transacciones.length === 0 ? (
                        <p className="dashboard-caja-vacia">{t('inicio.sinMovimientos')}</p>
                    ) : (
                        transacciones
                            .slice()
                            .sort((a, b) => compararFechas(b.fecha, a.fecha))
                            .slice(0, 4)
                            .map((mov) => {
                                const marca = buscarMarca(mov.descripcion);
                                return (
                                    <div key={mov.id} className="fila-movimiento-reciente">
                                        {marca ? (
                                            <IconoMarca nombre={mov.descripcion} size={16} badgeSize={34} borderRadius="50%" />
                                        ) : (
                                            <div className="fila-movimiento-avatar">{iniciales(mov.descripcion)}</div>
                                        )}
                                        <div className="fila-movimiento-info">
                                            <b>{mov.descripcion || t('comun.sinDescripcion')}</b>
                                            <small>{nombreCategoria(mov.categoria)}</small>
                                        </div>
                                        <span className={mov.tipo === 'ingreso' ? 'dashboard-monto-in' : 'dashboard-monto-out'}>
                                            {mov.tipo === 'ingreso' ? '+ ' : '- '}{formatoMonto(mov.monto)}
                                        </span>
                                    </div>
                                );
                            })
                    )}
                </div>

                <div className="dashboard-caja dashboard-grid-transferencia">
                    <h3>{t('inicio.transferenciaRapida')}</h3>
                    <p className="dashboard-transferencia-sub">{t('inicio.transferenciaTexto')}</p>
                    {cuentas.length === 0 ? (
                        <p className="dashboard-caja-vacia">{t('inicio.agregaCuenta')}</p>
                    ) : (
                        <div className="dashboard-avatares-cuentas">
                            {cuentas.slice(0, 3).map((c) => (
                                <button key={c.id} className="dashboard-avatar-cuenta" onClick={() => abrirModal && abrirModal('transferencia')} title={c.nombre}>
                                    <span style={{ backgroundColor: c.color || "var(--principal)" }}>{iniciales(c.nombre)}</span>
                                    <small>{c.nombre}</small>
                                </button>
                            ))}
                            <Link to="/cuentas" className="dashboard-avatar-cuenta">
                                <span className="dashboard-avatar-agregar"><Icon name="plus" size={16} /></span>
                                <small>{t('comun.agregar')}</small>
                            </Link>
                        </div>
                    )}
                    {abrirModal && (
                        <button className="dashboard-btn-transferir" onClick={() => abrirModal('transferencia')}>
                            <Icon name="send" size={14} /> {t('comun.transferir')}
                        </button>
                    )}
                </div>
            </div>

            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('inicio.tour1Titulo'), texto: t('inicio.tour1Texto') },
                { titulo: t('inicio.tour2Titulo'), texto: t('inicio.tour2Texto') }
            ]} />}
        </div>
    );
}

export default Inicio;