import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast/Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);

    function mostrarToast(mensaje, tipo = 'exito') {
        setToast({ mensaje, tipo });
    }

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}