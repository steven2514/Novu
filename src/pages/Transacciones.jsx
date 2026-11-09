import { useState } from 'react';
import './Transacciones.css';
import { Icon } from '../components/Icon';
import { IconoMarca } from '../components/IconoMarca';
import { buscarMarca } from '../utils/marcas';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { exportarPDF, pesos } from '../utils/exportarPDF';
import { formatearFecha, compararFechas } from '../utils/fechas';
import { useIdioma, nombreCategoria } from '../i18n/idioma';
import { dinero } from '../utils/moneda';
import { ATAJOS_FECHA, rangoDeAtajo, dentroDelRango } from '../utils/rangoFechas';
import { paginasVisibles } from '../utils/paginacion';

const ITEMS_POR_PAGINA = 10;

function Transacciones({ transacciones, eliminar, abrirModal, sesion }) {

    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    // Rango de fechas: un atajo (este mes, mes pasado...) o 'personalizado'
    const [atajo, setAtajo] = useState('todo');
    const [rango, setRango] = useState({ desde: '', hasta: '' });
    const { mostrarTour, cerrarTour } = useTour('transacciones', sesion);
    const { t } = useIdioma();

    // Los totales de arriba siguen el rango de fechas elegido
    const delRango = transacciones.filter(mov => dentroDelRango(mov.fecha, rango));
    const hayFechas = !!(rango.desde || rango.hasta);

    const totalIngresos = delRango
        .filter(mov => mov.tipo === 'ingreso')
        .reduce((acc, mov) => acc + Number(mov.monto), 0);

    const totalGastos = delRango
        .filter(mov => mov.tipo === 'gasto')
        .reduce((acc, mov) => acc + Number(mov.monto), 0);

    const texto = busqueda.trim().toLowerCase();
    const transaccionesFiltradas = delRango
        .filter(mov => filtro === 'todos' || mov.tipo === filtro)
        .filter(mov => !texto || [mov.descripcion, mov.categoria, nombreCategoria(mov.categoria), mov.cuenta]
            .some(campo => (campo || '').toLowerCase().includes(texto)))
        .slice()
        .sort((a, b) => compararFechas(b.fecha, a.fecha));
    const totalPaginas = Math.max(1, Math.ceil(transaccionesFiltradas.length / ITEMS_POR_PAGINA));
    // Si se borran movimientos y la página actual deja de existir, se va a la última
    const pagina = Math.min(paginaActual, totalPaginas);
    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const transaccionesPagina = transaccionesFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);

    function cambiarFiltro(nuevoFiltro) {
        setFiltro(nuevoFiltro);
        setPaginaActual(1);
    }

    function cambiarBusqueda(valor) {
        setBusqueda(valor);
        setPaginaActual(1);
    }

    function elegirAtajo(nuevo) {
        setAtajo(nuevo);
        setRango(rangoDeAtajo(nuevo));
        setPaginaActual(1);
    }

    // Escribir una fecha a mano pasa a un rango personalizado
    function cambiarFecha(extremo, valor) {
        const nuevo = { ...rango, [extremo]: valor };
        setRango(nuevo);
        setAtajo(nuevo.desde || nuevo.hasta ? 'personalizado' : 'todo');
        setPaginaActual(1);
    }

    // Texto del rango para el PDF: "Del 1 nov 2026 al 30 nov 2026"
    function textoRango() {
        const corta = (valor) => formatearFecha(valor, { day: 'numeric', month: 'short', year: 'numeric' });
        if (rango.desde && rango.hasta) return t('pdf.rango', { desde: corta(rango.desde), hasta: corta(rango.hasta) });
        if (rango.desde) return t('pdf.desdeFecha', { fecha: corta(rango.desde) });
        if (rango.hasta) return t('pdf.hastaFecha', { fecha: corta(rango.hasta) });
        return null;
    }

    // El PDF lleva lo que se está viendo: con el filtro y la búsqueda aplicados.
    function exportar() {
        const suma = (tipo) => transaccionesFiltradas.filter(mov => mov.tipo === tipo).reduce((acc, mov) => acc + Number(mov.monto), 0);
        const ingresos = suma('ingreso');
        const gastos = suma('gasto');
        const neto = ingresos - gastos;

        exportarPDF({
            titulo: t('transacciones.titulo'),
            subtitulo: [
                t('pdf.registros', { n: transaccionesFiltradas.length }),
                textoRango(),
                filtro !== 'todos' ? t(`transacciones.${filtro === 'ingreso' ? 'ingresos' : 'gastos'}`) : null,
                busqueda.trim() ? t('pdf.busqueda', { texto: busqueda.trim() }) : null,
            ].filter(Boolean).join('  ·  '),
            archivo: 'novu-movimientos',
            resumen: [
                { etiqueta: t('transacciones.totalIngresos'), valor: pesos(ingresos), tono: 'positivo' },
                { etiqueta: t('transacciones.totalGastos'), valor: pesos(gastos), tono: 'negativo' },
                { etiqueta: t('transacciones.flujoNeto'), valor: pesos(neto), tono: neto < 0 ? 'negativo' : 'teal' },
            ],
            columnas: [
                { titulo: t('pdf.col.fecha'), ancho: 26 },
                { titulo: t('pdf.col.descripcion'), negrita: true },
                { titulo: t('pdf.col.categoria') },
                { titulo: t('pdf.col.cuenta') },
                { titulo: t('pdf.col.monto'), alinear: 'right', ancho: 32 },
            ],
            filas: transaccionesFiltradas.map(mov => [
                formatearFecha(mov.fecha, { day: 'numeric', month: 'short', year: 'numeric' }),
                mov.descripcion || t('comun.sinDescripcion'),
                nombreCategoria(mov.categoria),
                mov.cuenta || '',
                mov.tipo === 'ingreso'
                    ? { texto: '+' + pesos(mov.monto), tono: 'positivo' }
                    : { texto: '-' + pesos(mov.monto), tono: 'negativo' },
            ]),
        });
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
                    <button className="btn-pildora-secundario" onClick={exportar}>
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
                        <h2>{dinero(totalIngresos)}</h2>
                    </div>
                </div>
                <div className="tarjeta-total tarjeta-total-gasto">
                    <span className="tarjeta-total-icono"><Icon name="arrow-up-right" size={18} /></span>
                    <div>
                        <p>{t('transacciones.totalGastos')}</p>
                        <h2>{dinero(totalGastos)}</h2>
                    </div>
                </div>
                <div className="tarjeta-total tarjeta-total-neto">
                    <span className="tarjeta-total-icono"><Icon name="wallet" size={18} /></span>
                    <div>
                        <p>{t('transacciones.flujoNeto')}</p>
                        <h2>{dinero(totalIngresos - totalGastos)}</h2>
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

                {/* Fechas: atajos rápidos o un rango a mano */}
                <div className="trans-fechas" role="group" aria-label={t('transacciones.filtroFechas')}>
                    <div className="trans-atajos">
                        {ATAJOS_FECHA.map(id => (
                            <button
                                key={id}
                                type="button"
                                className={atajo === id ? 'activo' : ''}
                                aria-pressed={atajo === id}
                                onClick={() => elegirAtajo(id)}
                            >
                                {t(`transacciones.atajos.${id}`)}
                            </button>
                        ))}
                    </div>
                    <div className="trans-rango">
                        <label>
                            <span>{t('transacciones.desde')}</span>
                            <input type="date" value={rango.desde} max={rango.hasta || undefined} onChange={(e) => cambiarFecha('desde', e.target.value)} />
                        </label>
                        <label>
                            <span>{t('transacciones.hasta')}</span>
                            <input type="date" value={rango.hasta} min={rango.desde || undefined} onChange={(e) => cambiarFecha('hasta', e.target.value)} />
                        </label>
                        {hayFechas && (
                            <button type="button" className="trans-limpiar-fechas" onClick={() => elegirAtajo('todo')}>
                                <Icon name="x" size={14} /> {t('transacciones.limpiarFechas')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="trans-lista">
                    {transaccionesFiltradas.length === 0
                        ? (
                            <div className="vacio">
                                <Icon name="receipt" size={28} />
                                <p>{busqueda || hayFechas ? t('transacciones.sinResultados') : t('transacciones.sinMovimientos')}</p>
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
                                    {mov.tipo === 'ingreso' ? '+' : '-'}{dinero(mov.monto)}
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
                    <nav className="trans-paginacion" aria-label={t('transacciones.paginas')}>
                        <button
                            className="pagina-btn"
                            disabled={pagina === 1}
                            onClick={() => setPaginaActual(pagina - 1)}
                            aria-label={t('transacciones.anterior')}>
                            <Icon name="chevron-left" size={16} /> <span className="pagina-btn-texto">{t('transacciones.anterior')}</span>
                        </button>

                        {/* Solo la primera, la última y dos a cada lado de la actual */}
                        <div className="trans-paginacion-numeros">
                            {paginasVisibles(pagina - 1, totalPaginas).map(p => (
                                typeof p === 'string'
                                    ? <span key={p} className="pagina-hueco" aria-hidden="true">…</span>
                                    : (
                                        <button
                                            key={p}
                                            className={`pagina-btn pagina-num ${pagina === p + 1 ? 'activo' : ''}`}
                                            aria-current={pagina === p + 1 ? 'page' : undefined}
                                            onClick={() => setPaginaActual(p + 1)}>
                                            {p + 1}
                                        </button>
                                    )
                            ))}
                        </div>

                        {/* En el celular, en lugar de los números */}
                        <span className="trans-paginacion-texto">{t('transacciones.paginaDe', { actual: pagina, total: totalPaginas })}</span>

                        <button
                            className="pagina-btn"
                            disabled={pagina === totalPaginas}
                            onClick={() => setPaginaActual(pagina + 1)}
                            aria-label={t('transacciones.siguiente')}>
                            <span className="pagina-btn-texto">{t('transacciones.siguiente')}</span> <Icon name="chevron-right" size={16} />
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}

export default Transacciones;
