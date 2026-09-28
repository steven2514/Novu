import { createContext, useContext } from 'react';

// Contexto y hook de los avisos. El proveedor (el componente) está en
// ToastContext.jsx; separarlos es lo que pide el Fast Refresh de Vite.
//
// Uso:  const { mostrarToast } = useToast();
//       mostrarToast('Guardado', 'exito');   // o 'error'
export const ToastContext = createContext({ mostrarToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}
