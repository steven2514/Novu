import { useCallback, useRef, useState } from 'react';
import { ConfirmarContext } from './confirmar';
import Modal from '../components/Modal/Modal';
import { Icon } from '../components/Icon';
import { useIdioma } from '../i18n/idioma';
import './Confirmar.css';

// Diálogo de confirmación para acciones que no se pueden deshacer (eliminar).
// confirmar() devuelve una promesa que se resuelve en true (aceptar) o false.
function ConfirmarProvider({ children }) {
    const { t } = useIdioma();
    const [pregunta, setPregunta] = useState(null);
    const resolver = useRef(null);

    const confirmar = useCallback((opciones) => new Promise((resolve) => {
        resolver.current = resolve;
        setPregunta(opciones);
    }), []);

    function responder(valor) {
        resolver.current?.(valor);
        resolver.current = null;
        setPregunta(null);
    }

    return (
        <ConfirmarContext.Provider value={confirmar}>
            {children}
            <Modal visible={!!pregunta} onClose={() => responder(false)}>
                {pregunta && (
                    <div className="confirmar">
                        <span className="confirmar-icono"><Icon name="trash-2" size={22} /></span>
                        <h2>{pregunta.titulo}</h2>
                        {pregunta.mensaje && <p>{pregunta.mensaje}</p>}
                        <div className="confirmar-acciones">
                            <button className="btn-pildora-secundario" onClick={() => responder(false)}>
                                {t('confirmar.cancelar')}
                            </button>
                            <button className="confirmar-btn-peligro" onClick={() => responder(true)} autoFocus>
                                {pregunta.textoConfirmar || t('confirmar.eliminar')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </ConfirmarContext.Provider>
    );
}

export default ConfirmarProvider;
