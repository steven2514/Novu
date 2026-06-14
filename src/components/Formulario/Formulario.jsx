import { useState } from "react"
import './Formulario.css';

function Formulario({setTransacciones, tipo}) {

    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');

    function agregar() {
        setTransacciones(prev => [...prev, { descripcion, monto, tipo }]);
        setDescripcion('');
        setMonto('');
    }


    return (
        <div className="formulario" >
            
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
            <input type="number" value={monto} onChange={(e)=> setMonto(e.target.value)} placeholder="Monto" />

            

            <button onClick={agregar}>Agregar</button>
        </div>
    );
}

export default Formulario;