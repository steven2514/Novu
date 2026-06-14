import { useState } from 'react';
import './Transacciones.css';


function Transacciones({ transacciones, eliminar }) {

    const [filtro, setFiltro] = useState('todos');

    return (
        <div className="container">
            <h2 className="titulo">RECIENTES</h2>

            <div className="botones">
                <button onClick={() => setFiltro('todos')}>Todos</button>
                <button onClick={() => setFiltro('ingreso')}>Ingreso</button>
                <button onClick={() => setFiltro('gasto')}>Gastos</button>
            </div>

            <div className="lista">
                {transacciones
                    .filter((t) => filtro === 'todos' || t.tipo === filtro)
                    .map((t, index) => (
                        <div className="transaccion" key={index}>
                            <div className="info">
                                <p className="descripcion">{t.descripcion}</p>
                                <p className="tipo">{t.tipo}</p>
                            </div>
                            <p className={`monto ${t.tipo}`}>{t.monto}</p>
                            <button className="eliminar" onClick={() => eliminar(index)}>
                                Eliminar
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default Transacciones;