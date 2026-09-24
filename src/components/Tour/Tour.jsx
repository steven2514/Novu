import { useState } from 'react';
import './Tour.css';
import { useIdioma } from '../../i18n/idioma';

function Tour({ onCerrar, pasos }) {
    const [pasoActual, setPasoActual] = useState(0);
    const { t } = useIdioma();

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
                    <button className="tour-btn-saltar" onClick={onCerrar}>{t('tour.saltar')}</button>
                    <button className="tour-btn-siguiente" onClick={siguiente}>
                        {pasoActual === pasos.length - 1 ? t('tour.finalizar') : t('tour.siguiente')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Tour;
