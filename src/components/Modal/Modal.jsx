import './Modal.css';

function Modal({ visible, onClose, children }) {
    if (!visible) return null;

    

    return (
        <div className="modal-overlay">
            <div className="modal-contenido">
                
                {children}
            </div>
        </div>
    );
}

export default Modal;