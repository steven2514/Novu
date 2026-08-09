import { useState } from 'react';
import './Transacciones.css';
import { Icon } from '../components/Icon';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import exportarCSV from '../utils/exportarCSV';

const ITEMS_POR_PAGINA = 10;

function Transacciones({ transacciones, eliminar, abrirModal, sesion }) {

    const [filtro, setFiltro] = useState('todos');
    const [paginaActual, setPaginaActual] = useState(1);
    const { mostrarTour, cerrarTour } = useTour('transacciones', sesion);

    const totalIngresos = transacciones
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGastos = transacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const transaccionesFiltradas = transacciones.filter(t => filtro === 'todos' || t.tipo === filtro);
    const totalPaginas = Math.max(1, Math.ceil(transaccionesFiltradas.length / ITEMS_POR_PAGINA));
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const transaccionesPagina = transaccionesFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);

    function cambiarFiltro(nuevoFiltro) {
        setFiltro(nuevoFiltro);
        setPaginaActual(1);
    }

    return (
        <div className="transacciones-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus transacciones', texto: 'Aquí ves todo tu historial de ingresos y gastos.' },
                { titulo: 'Filtros', texto: 'Filtra por ingresos, gastos o ve todas las transacciones.' }
            ]} />}

            <div className="trans-header">
                <div>
                    <h1>Transacciones</h1>
                    <p>Registro completo de ingresos y gastos</p>
                </div>
                <div className="trans-botones-header">
                    <button className="btn-exportar" onClick={() => exportarCSV(transacciones, 'transacciones')}>⬇ Exportar</button>
                </div>
            </div>

            <div className="trans-totales">
                <div className="tarjeta-total tarjeta-total-ingreso">
                    <p>Total Ingresos</p>
                    <h2>${totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                </div>
                <div className="tarjeta-total tarjeta-total-gasto">
                    <p>Total Gastos</p>
                    <h2>${totalGastos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                </div>
            </div>

            <div className="trans-lista-section">
                <div className="trans-filtros">
                    <button
                        className={filtro === 'todos' ? 'activo' : ''}
                        onClick={() => cambiarFiltro('todos')}>Todas</button>
                    <button
                        className={filtro === 'ingreso' ? 'activo' : ''}
                        onClick={() => cambiarFiltro('ingreso')}>Ingresos</button>
                    <button
                        className={filtro === 'gasto' ? 'activo' : ''}
                        onClick={() => cambiarFiltro('gasto')}>Gastos</button>
                </div>

                <div className="trans-lista">
                    {transaccionesFiltradas.length === 0
                        ? <p className="vacio">No hay transacciones para mostrar</p>
                        : transaccionesPagina.map((t) => (
                            <div className="transaccion-item" key={t.id}>
                                <div className="transaccion-icono" style={{
                                    backgroundColor: t.tipo === 'ingreso' ? '#00D2A022' : '#FF6B6B22'
                                }}>
                                    <span style={{ color: t.tipo === 'ingreso' ? '#00D2A0' : '#FF6B6B' }}>
                                        <Icon name={t.tipo === 'ingreso' ? 'trending-up' : 'trending-down'} size={16} />
                                    </span>
                                </div>
                                <div className="transaccion-info">
                                    <p className="transaccion-descripcion">{t.descripcion}</p>
                                    <p className="transaccion-meta">
                                        {t.categoria} • {t.cuenta} • {new Date(t.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <p className={t.tipo === 'ingreso' ? 'monto-ingreso' : 'monto-gasto'}>
                                    {t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString('es-CO')}
                                </p>
                                <button className="btn-editar-cuenta" onClick={() => abrirModal(t.tipo, t)}>✏️</button>
                                <button className="btn-eliminar" onClick={() => eliminar(t.id)}><Icon name="trash-2" /></button>
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
                            ‹ Anterior
                        </button>

                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                            <button
                                key={num}
                                className={`pagina-btn ${paginaActual === num ? 'activo' : ''}`}
                                onClick={() => setPaginaActual(num)}>
                                {num}
                            </button>
                        ))}

                        <button
                            className="pagina-btn"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => setPaginaActual(p => p + 1)}>
                            Siguiente ›
                        </button>
                    </div>
                )}
            </div>

        </div>

    );
}

export default Transacciones;