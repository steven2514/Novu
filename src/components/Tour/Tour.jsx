import { useState } from 'react';
import './Tour.css';

function Tour({ onCerrar, pasos }) {
    const [pasoActual, setPasoActual] = useState(0);

    function siguiente() {
        if (pasoActual === pasos.length - 1) {
            onCerrar();
        } else {
            setPasoActual(prev => prev + 1);
        }
    }

    return (
        <div className="tour-overlay">
            <div className="tour-tarjeta">
                <h3>{pasos[pasoActual].titulo}</h3>
                <p>{pasos[pasoActual].texto}</p>
                <div className="tour-acciones">
                    <span>{pasoActual + 1} / {pasos.length}</span>
                    <button className="tour-btn-saltar" onClick={onCerrar}>Saltar</button>
                    <button className="tour-btn-siguiente" onClick={siguiente}>
                        {pasoActual === pasos.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Tour;