
import TarjetaResumen from '../components/TarjetaResumen/TarjetaResumen';

import { useState } from 'react';

function Inicio({ transacciones, setTransacciones }) {

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const balance = transacciones.reduce((acc, t) => {
        if (t.tipo === 'ingreso') return acc + Number(t.monto);
        return acc - Number(t.monto);
    }, 0);

    const totalIngresos = transacciones
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto)
            , 0);

    const totalGasto = transacciones
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto)
            , 0);


    const fecha = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });


    return (
        <div className='dashboard'>
            <h1>Dashboard</h1>
            <p>{fecha}</p>
            <div className='tarjetas-grid'>
            <TarjetaResumen titulo="Balance Total" valor={balance} color="principal"/>
            <TarjetaResumen titulo="ingresos" valor={totalIngresos} color="principal"/>
            <TarjetaResumen titulo="gastos" valor={totalGasto} color="principal"/>
            <TarjetaResumen titulo="metas" valor={0} color="principal"/>
            </div>
        </div>
    );
}

export default Inicio;