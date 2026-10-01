import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

function Modal({ visible, onClose, children }) {

    // Cierra con la tecla Escape
    useEffect(() => {
        if (!visible) return;
        function alPresionar(e) {
            if (e.key === 'Escape') onClose && onClose();
        }
        document.addEventListener('keydown', alPresionar);
        return () => document.removeEventListener('keydown', alPresionar);
    }, [visible, onClose]);

    if (!visible) return null;

    // Se dibuja directo en <body>: así cubre toda la pantalla aunque la página
    // que lo abre esté dentro de un contenedor con container queries.
    return createPortal(
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
            <div className="modal-contenido" role="dialog" aria-modal="true">
                {children}
            </div>
        </div>,
        document.body
    );
}

export default Modal;
