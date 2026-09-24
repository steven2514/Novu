import { useState } from 'react';
import './Transacciones.css';
import { Icon } from '../components/Icon';
import { IconoMarca, buscarMarca } from '../components/IconoMarca';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import exportarCSV from '../utils/exportarCSV';
import { formatearFecha, compararFechas } from '../utils/fechas';
import { useIdioma, nombreCategoria } from '../i18n/idioma';

const ITEMS_POR_PAGINA = 10;

function formatoPesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function Transacciones({ transacciones, eliminar, abrirModal, sesion }) {

    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const { mostrarTour, cerrarTour } = useTour('transacciones', sesion);
    const { t } = useIdioma();

    const totalIngresos = transacciones
        .filter(mov => mov.tipo === 'ingreso')
        .reduce((acc, mov) => acc + Number(mov.monto), 0);

    const totalGastos = transacciones
        .filter(mov => mov.tipo === 'gasto')
        .reduce((acc, mov) => acc + Number(mov.monto), 0);

    const texto = busqueda.trim().toLowerCase();
    const transaccionesFiltradas = transacciones
        .filter(mov => filtro === 'todos' || mov.tipo === filtro)
        .filter(mov => !texto || [mov.descripcion, mov.categoria, nombreCategoria(mov.categoria), mov.cuenta]
            .some(campo => (campo || '').toLowerCase().includes(texto)))
        .slice()
        .sort((a, b) => compararFechas(b.fecha, a.fecha));
    const totalPaginas = Math.max(1, Math.ceil(transaccionesFiltradas.length / ITEMS_POR_PAGINA));
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const transaccionesPagina = transaccionesFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);

    function cambiarFiltro(nuevoFiltro) {
        setFiltro(nuevoFiltro);
        setPaginaActual(1);
    }

    function cambiarBusqueda(valor) {
        setBusqueda(valor);
        setPaginaActual(1);
    }

    return (
        <div className="transacciones-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('transacciones.tour1Titulo'), texto: t('transacciones.tour1Texto') },
                { titulo: t('transacciones.tour2Titulo'), texto: t('transacciones.tour2Texto') }
            ]} />}

            <div className="trans-header">
                <div>
                    <p className="overline">{t('transacciones.overline')}</p>
                    <h1>{t('transacciones.titulo')}</h1>
                    <p>{t('transacciones.subtitulo')}</p>
                </div>
                <div className="header-acciones">
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(transacciones, 'transacciones')}>
                        <Icon name="download" size={16} /> {t('comun.exportar')}
                    </button>
                    <button className="btn-pildora-acento" onClick={() => abrirModal('gasto')}>
                        <Icon name="plus" size={16} /> {t('sidebar.nuevoMovimiento')}
                    </button>
                </div>
            </div>

            <div className="trans-totales">
                <div className="tarjeta-total tarjeta-total-ingreso">
                    <span className="tarjeta-total-icono"><Icon name="arrow-down-left" size={18} /></span>
                    <div>
                        <p>{t('transacciones.totalIngresos')}</p>
                        <h2>{formatoPesos(totalIngresos)}</h2>
                    </div>
                </div>
                <div className="tarjeta-total tarjeta-total-gasto">
                    <span className="tarjeta-total-icono"><Icon name="arrow-up-right" size={18} /></span>
                    <div>
                        <p>{t('transacciones.totalGastos')}</p>
                        <h2>{formatoPesos(totalGastos)}</h2>
                    </div>
                </div>
                <div className="tarjeta-total tarjeta-total-neto">
                    <span className="tarjeta-total-icono"><Icon name="wallet" size={18} /></span>
                    <div>
                        <p>{t('transacciones.flujoNeto')}</p>
                        <h2>{totalIngresos - totalGastos < 0 ? '-' : ''}{formatoPesos(Math.abs(totalIngresos - totalGastos))}</h2>
                    </div>
                </div>
            </div>

            <div className="trans-lista-section">
                <div className="trans-barra">
                    <div className="trans-filtros">
                        <button className={filtro === 'todos' ? 'activo' : ''} onClick={() => cambiarFiltro('todos')}>{t('transacciones.todos')}</button>
                        <button className={filtro === 'ingreso' ? 'activo' : ''} onClick={() => cambiarFiltro('ingreso')}>{t('transacciones.ingresos')}</button>
                        <button className={filtro === 'gasto' ? 'activo' : ''} onClick={() => cambiarFiltro('gasto')}>{t('transacciones.gastos')}</button>
                    </div>
                    <label className="trans-buscador">
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(e) => cambiarBusqueda(e.target.value)}
                            placeholder={t('transacciones.buscar')}
                        />
                    </label>
                </div>

                <div className="trans-lista">
                    {transaccionesFiltradas.length === 0
                        ? (
                            <div className="vacio">
                                <Icon name="receipt" size={28} />
                                <p>{busqueda ? t('transacciones.sinResultados') : t('transacciones.sinMovimientos')}</p>
                            </div>
                        )
                        : transaccionesPagina.map((mov) => (
                            <div className="transaccion-item" key={mov.id}>
                                {buscarMarca(mov.descripcion) ? (
                                    <IconoMarca nombre={mov.descripcion} size={16} badgeSize={40} borderRadius="12px" />
                                ) : (
                                    <div className={`transaccion-icono ${mov.tipo === 'ingreso' ? 'es-ingreso' : 'es-gasto'}`}>
                                        <Icon name={mov.tipo === 'ingreso' ? 'arrow-down-left' : 'arrow-up-right'} size={16} />
                                    </div>
                                )}
                                <div className="transaccion-info">
                                    <p className="transaccion-descripcion">{mov.descripcion || t('comun.sinDescripcion')}</p>
                                    <p className="transaccion-meta">
                                        <span className="transaccion-categoria">{nombreCategoria(mov.categoria)}</span>
                                        <span>{mov.cuenta}</span>
                                    </p>
                                </div>
                                <p className="transaccion-fecha">{formatearFecha(mov.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <p className={mov.tipo === 'ingreso' ? 'monto-ingreso' : 'monto-gasto'}>
                                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatoPesos(mov.monto)}
                                </p>
                                <div className="transaccion-acciones">
                                    <button className="btn-icono" title={t('comun.editar')} onClick={() => abrirModal(mov.tipo, mov)}>
                                        <Icon name="pencil" size={15} />
                                    </button>
                                    <button className="btn-fila-eliminar" title={t('comun.eliminar')} onClick={() => eliminar(mov.id)}>
                                        <Icon name="trash-2" size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {transaccionesFiltradas.length > 0 && totalPaginas > 1 && (
                    <div className="trans-paginacion">
                        <button
                            className="pagina-btn"
                            disabled={paginaActual === 1}
                            onClick={() => setPaginaActual(p => p - 1)}>
                            <Icon name="chevron-left" size={16} /> {t('transacciones.anterior')}
                        </button>

                        <div className="trans-paginacion-numeros">
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    className={`pagina-btn pagina-num ${paginaActual === num ? 'activo' : ''}`}
                                    onClick={() => setPaginaActual(num)}>
                                    {num}
                                </button>
                            ))}
                        </div>

                        <button
                            className="pagina-btn"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => setPaginaActual(p => p + 1)}>
                            {t('transacciones.siguiente')} <Icon name="chevron-right" size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Transacciones;
