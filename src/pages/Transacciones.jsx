import { useState } from 'react';
import './Transacciones.css';


function Transacciones({ transacciones, eliminar, abrirModal }) {

    const [filtro, setFiltro] = useState('todos');

    const totalIngresos = transacciones
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGastos = transacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const transaccionesFiltradas = transacciones
        .filter(t => filtro === 'todos' || t.tipo === filtro);



    return (
        <div className="transacciones-page">

            <div className="trans-header">
                <div>
                    <h1>Transacciones</h1>
                    <p>Registro completo de ingresos y gastos</p>
                </div>
                <div className="trans-botones-header">
                    <button className="btn-ingreso" onClick={() => abrirModal('ingreso')}>+ Ingreso</button>
                    <button className="btn-gasto" onClick={() => abrirModal('gasto')}>+ Gasto</button>
                </div>
            </div>

            <div className="trans-totales">
                <div className="tarjeta-total">
                    <p>Total Ingresos</p>
                    <h2 className="monto-ingreso">${totalIngresos}</h2>
                </div>
                <div className="tarjeta-total">
                    <p>Total Gastos</p>
                    <h2 className="monto-gasto">${totalGastos}</h2>
                </div>
            </div>

            <div className="trans-lista-section">
                <div className="trans-filtros">
                    <button onClick={() => setFiltro('todos')}>Todas</button>
                    <button onClick={() => setFiltro('ingreso')}>Ingresos</button>
                    <button onClick={() => setFiltro('gasto')}>Gastos</button>
                </div>

                <div className="trans-lista">
                    {transacciones.length === 0
                        ? <p className="vacio">No hay transacciones para mostrar</p>
                        : transacciones
                            .map((t, index) => ({ ...t, index }))
                            .filter(t => filtro === 'todos' || t.tipo === filtro)
                            .map((t) => (
                                <div className="transaccion-item" key={t.index}>
                                    <div>
                                        <p>{t.descripcion}</p>
                                        <p>{t.tipo}</p>
                                    </div>
                                    <p className={t.tipo === 'ingreso' ? 'monto-ingreso' : 'monto-gasto'}>
                                        ${t.monto}
                                    </p>
                                    <button className="btn-eliminar" onClick={() => eliminar(t.index)}>🗑️</button>
                                </div>
                            ))
                    }
                </div>
            </div>

        </div>
    );
}

export default Transacciones;