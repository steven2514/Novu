import { lazy, Suspense, useState } from 'react';
import './Inicio.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { aplicarTema, temaGuardado } from '../utils/tema';
import { useIdioma, nombreCategoria } from '../i18n/idioma';
import { montoMensual } from '../utils/suscripciones';
import { pxEscalados } from '../utils/escala';
import { dinero } from '../utils/moneda';
import { usePreferencias } from '../Context/preferencias';
import { totalPorTipo, delMes, calcularTendencia, gastosPorCategoria, datosResumen } from '../utils/resumen';
import TarjetasResumen from '../components/Inicio/TarjetasResumen';
import ColumnaLateral from '../components/Inicio/ColumnaLateral';
import { MovimientosRecientes, TransferenciaRapida } from '../components/Inicio/MovimientosRecientes';
import { COLORES } from '../components/Inicio/graficas';

// Las gráficas (recharts) se descargan aparte para que el resto del Inicio
// aparezca sin esperarlas.
const GraficaResumen = lazy(() => import('../components/Inicio/GraficaResumen'));
const GraficaCategorias = lazy(() => import('../components/Inicio/GraficaCategorias'));

const SIN_DATOS = [];

function claveSaludo() {
    const hora = new Date().getHours();
    if (hora < 12) return 'inicio.buenosDias';
    if (hora < 19) return 'inicio.buenasTardes';
    return 'inicio.buenasNoches';
}

function Inicio({ transacciones, metas, suscripciones, cuentas = SIN_DATOS, presupuestos = SIN_DATOS, sesion, abrirModal }) {

    const { mostrarTour, cerrarTour } = useTour('dashboard', sesion);
    const { t, locale } = useIdioma();

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
    const { saldosOcultos, cambiarSaldosOcultos } = usePreferencias();
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

    const transaccionesDelMes = delMes(transacciones, mesSeleccionado);
    const totalIngresos = totalPorTipo(transaccionesDelMes, 'ingreso');
    const totalGasto = totalPorTipo(transaccionesDelMes, 'gasto');

    // Comparación real contra el mes anterior al seleccionado (no inventada)
    const mesAnterior = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1, 1);
    const transaccionesMesAnterior = delMes(transacciones, mesAnterior);

    const porCategoria = gastosPorCategoria(transaccionesDelMes);

    // Presupuestos del mes seleccionado, los más cerca de su límite primero
    const presupuestosDelMes = presupuestos
        .map(p => {
            const gastado = porCategoria.find(c => c.categoria === p.categoria)?.valor || 0;
            const porcentaje = Number(p.monto) > 0 ? (gastado / Number(p.monto)) * 100 : 0;
            return { ...p, gastado, porcentaje };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    const hoy = new Date();

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
                    <button className="dashboard-icon-btn" onClick={() => cambiarSaldosOcultos(!saldosOcultos)} title={saldosOcultos ? t('inicio.mostrarValores') : t('inicio.ocultarValores')}>
                        <Icon name={saldosOcultos ? 'eye-off' : 'eye'} size={18} />
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

            <TarjetasResumen
                balance={cuentas.reduce((acc, c) => acc + Number(c.saldo), 0)}
                numCuentas={cuentas.length}
                ingresos={totalIngresos}
                gastos={totalGasto}
                tendenciaIngresos={calcularTendencia(totalIngresos, totalPorTipo(transaccionesMesAnterior, 'ingreso'))}
                tendenciaGastos={calcularTendencia(totalGasto, totalPorTipo(transaccionesMesAnterior, 'gasto'))}
                ahorrado={metas.reduce((acc, m) => acc + Number(m.monto_actual || 0), 0)}
                numMetas={metas.length}
            />

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
                    <Suspense fallback={<div style={{ height: pxEscalados(270) }} />}>
                        <GraficaResumen datos={datosResumen(transacciones, periodoResumen, mesSeleccionado, locale, hoy)} />
                    </Suspense>
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
                        <div className="dashboard-donut-row">
                            <div className="dashboard-donut-chart-wrap">
                                <Suspense fallback={<div style={{ height: pxEscalados(190) }} />}>
                                    <GraficaCategorias datos={porCategoria} />
                                </Suspense>
                                <div className="dashboard-donut-center">
                                    <strong>{dinero(totalGasto)}</strong>
                                    <span>{t('inicio.total')}</span>
                                </div>
                            </div>
                            <div className="dashboard-donut-legend">
                                <div className="dashboard-donut-legend-header">
                                    <span>{t('inicio.categorias')}</span>
                                    <span>%</span>
                                </div>
                                {porCategoria
                                    .map((cat, index) => ({ ...cat, color: COLORES[index % COLORES.length] }))
                                    .sort((a, b) => b.valor - a.valor)
                                    .map((cat) => (
                                        <div key={cat.categoria} className="dashboard-donut-legend-item">
                                            <span>
                                                <i style={{ backgroundColor: cat.color }} />
                                                {nombreCategoria(cat.categoria)}
                                            </span>
                                            <b>{Math.round((cat.valor / totalGasto) * 100)}%</b>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                <ColumnaLateral
                    metas={metas}
                    presupuestosDelMes={presupuestosDelMes}
                    suscripciones={suscripciones}
                    totalSuscripcionesMensual={suscripciones.reduce((acc, s) => acc + montoMensual(s), 0)}
                />

                <MovimientosRecientes transacciones={transacciones} />

                <TransferenciaRapida cuentas={cuentas} abrirModal={abrirModal} />
            </div>

            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('inicio.tour1Titulo'), texto: t('inicio.tour1Texto') },
                { titulo: t('inicio.tour2Titulo'), texto: t('inicio.tour2Texto') }
            ]} />}
        </div>
    );
}

export default Inicio;
