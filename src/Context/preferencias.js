import { createContext, useContext } from 'react';

// { moneda, cambiarMoneda, tasas, saldosOcultos, cambiarSaldosOcultos }
export const PreferenciasContext = createContext(null);

export function usePreferencias() {
    return useContext(PreferenciasContext);
}
