import { useNavigate} from 'react-router-dom';
import Formulario from '../components/Formulario/Formulario';
import './AgregarGasto.css'


function AgregarGasto({ setTransacciones }) {
    
    const navigate = useNavigate();
    return (
        <div className='bloqueGasto'>
            <h1>Agregar Gasto</h1>
            <Formulario setTransacciones={setTransacciones} tipo="gasto" />
            
            <button className='gastos' onClick={() => navigate('/')}>Regresar</button>
           
        </div>
    );
}

export default AgregarGasto;