import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TarjetaResumen from '../components/TarjetaResumen/TarjetaResumen';

import './Inicio.css';

function Inicio({ transacciones, setTransacciones }) {

    

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
                <TarjetaResumen titulo="BALANCE TOTAL" valor={balance} color="principal" subtitulo="0 cuentas activas" />
                <TarjetaResumen titulo="INGRESOS" valor={totalIngresos} color="positivo" subtitulo="Este mes" />
                <TarjetaResumen titulo="GASTOS" valor={totalGasto} color="negativo" subtitulo="Este mes" />
                <TarjetaResumen titulo="METAS" valor={0} color="texto" subtitulo="En progreso" />
            </div>
        </div>
    );
}

export default Inicio;