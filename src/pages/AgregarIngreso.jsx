import { useNavigate } from 'react-router-dom';
import Formulario from '../components/Formulario/Formulario';
import './AgregarIngreso.css';

function AgregarIngreso({ setTransacciones }) {
    const navigate = useNavigate();

    return (
        <div className='bloqueIngreso'>
            <h1>Agregar Ingreso</h1>
            <Formulario setTransacciones={setTransacciones} tipo="ingreso" />
            <button className='ingresos' onClick={() => navigate('/')}>Regresar</button>
        </div>
    );
}

export default AgregarIngreso;