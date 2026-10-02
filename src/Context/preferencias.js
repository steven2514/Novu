import { createContext, useContext } from 'react';

// { moneda, cambiarMoneda, saldosOcultos, cambiarSaldosOcultos }
export const PreferenciasContext = createContext(null);

export function usePreferencias() {
    return useContext(PreferenciasContext);
}
