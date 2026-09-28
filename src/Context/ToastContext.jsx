import { useRef, useState } from 'react';
import Toast from '../components/Toast/Toast';
import { ToastContext } from './toast';

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const siguienteId = useRef(0);

    function mostrarToast(mensaje, tipo = 'exito') {
        // Cada aviso lleva su propio id y se usa como key: así un aviso nuevo
        // monta un Toast nuevo con su temporizador completo. Antes, si llegaba
        // un segundo aviso con el primero en pantalla, el temporizador del
        // primero lo cerraba antes de tiempo.
        siguienteId.current += 1;
        setToast({ id: siguienteId.current, mensaje, tipo });
    }

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}
            {toast && <Toast key={toast.id} mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
        </ToastContext.Provider>
    );
}
