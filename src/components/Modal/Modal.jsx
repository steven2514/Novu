import { useEffect } from 'react';
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

    return (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
            <div className="modal-contenido" role="dialog" aria-modal="true">
                {children}
            </div>
        </div>
    );
}

export default Modal;
