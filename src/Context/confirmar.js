import { createContext, useContext } from 'react';

// Uso:  const confirmar = useConfirmar();
//       if (!(await confirmar({ titulo, mensaje }))) return;
export const ConfirmarContext = createContext(async () => true);

export function useConfirmar() {
    return useContext(ConfirmarContext);
}
