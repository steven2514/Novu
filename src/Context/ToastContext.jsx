import { useCallback, useMemo, useRef, useState } from 'react';
import Toast from '../components/Toast/Toast';
import { ToastContext } from './toast';

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const siguienteId = useRef(0);

    // Estable entre renders: los componentes pueden usar mostrarToast como
    // dependencia de un efecto sin que éste se repita en cada render.
    const mostrarToast = useCallback((mensaje, tipo = 'exito') => {
        // Cada aviso lleva su propio id y se usa como key: así un aviso nuevo
        // monta un Toast nuevo con su temporizador completo. Antes, si llegaba
        // un segundo aviso con el primero en pantalla, el temporizador del
        // primero lo cerraba antes de tiempo.
        siguienteId.current += 1;
        setToast({ id: siguienteId.current, mensaje, tipo });
    }, []);

    const cerrar = useCallback(() => setToast(null), []);
    const valor = useMemo(() => ({ mostrarToast }), [mostrarToast]);

    return (
        <ToastContext.Provider value={valor}>
            {children}
            {toast && <Toast key={toast.id} mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
        </ToastContext.Provider>
    );
}
