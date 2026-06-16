import Header from '../components/Header/Header';
import Balance from '../components/Balance/Balance';
import Transacciones from '../components/Transacciones/Transacciones';
import Navbar from '../components/Navbar/Navbar';

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

    function eliminar(index) {
        setTransacciones(transacciones.filter((_, i) => i !== index));
    }


    return (
        <div>
            <Header />
            <Balance balance={balance} totalIngresos={totalIngresos} totalGastos={totalGasto} setMostrarFormulario={setMostrarFormulario} />
            <Transacciones transacciones={transacciones} eliminar={eliminar}></Transacciones>

        </div>
    );
}

export default Inicio;