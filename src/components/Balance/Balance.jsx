import './Balance.css';
import { useNavigate } from 'react-router-dom';

function Balance({ balance, totalIngresos, totalGastos, setMostrarFormulario }) {
    const navigate = useNavigate();

    return (
        <div className='tarjetas'>
            <div className='tarjeta1'>
                <h1>Balance Total</h1>
                <h2>Cop</h2>
                <h1>{balance}</h1>
            </div>

            <div className='tarjeta2'>
                <h4>Ingresos: {totalIngresos}</h4>
                <h4>Gastos: {totalGastos}</h4>
            </div>

            <div className='acciones'>
                <button onClick={() => navigate('/agregargasto')}>+ Gasto</button>
                <button onClick={() => navigate('/agregaringreso')}>↓ Ingreso</button>
            </div>
        </div>
    );
}

export default Balance;