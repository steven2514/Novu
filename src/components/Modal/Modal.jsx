import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

// titulo: nombre del diálogo para lectores de pantalla (lo que se lee al abrirlo).
function Modal({ visible, onClose, titulo, children }) {

    // onClose suele ser una función nueva en cada render; guardarla en una ref
    // evita quitar y volver a poner el listener de Escape cada vez.
    const cerrarRef = useRef(onClose);
    useEffect(() => { cerrarRef.current = onClose; }, [onClose]);

    // Cierra con la tecla Escape
    useEffect(() => {
        if (!visible) return;
        function alPresionar(e) {
            if (e.key === 'Escape') cerrarRef.current?.();
        }
        document.addEventListener('keydown', alPresionar);
        return () => document.removeEventListener('keydown', alPresionar);
    }, [visible]);

    if (!visible) return null;

    // Se dibuja directo en <body>: así cubre toda la pantalla aunque la página
    // que lo abre esté dentro de un contenedor con container queries.
    // El fondo es sólo para cerrar con el mouse; con teclado se cierra con Escape
    // o con el botón de cerrar de cada formulario.
    return createPortal(
        <div
            className="modal-overlay"
            role="presentation"
            onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarRef.current?.(); }}
        >
            <div className="modal-contenido" role="dialog" aria-modal="true" aria-label={titulo}>
                {children}
            </div>
        </div>,
        document.body
    );
}

export default Modal;
