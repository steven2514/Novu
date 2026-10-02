import { useCallback, useMemo, useState } from 'react';
import { PreferenciasContext } from './preferencias';
import { establecerMoneda, establecerSaldosOcultos, obtenerMoneda, saldosEstanOcultos } from '../utils/moneda';

// Moneda y "ocultar saldos": al cambiar cualquiera de las dos, los componentes
// que usan usePreferencias() (App, y con ella toda la app) se vuelven a dibujar
// y dinero() ya formatea con el valor nuevo.
function PreferenciasProvider({ children }) {
    const [moneda, setMoneda] = useState(obtenerMoneda);
    const [saldosOcultos, setSaldosOcultos] = useState(saldosEstanOcultos);

    const cambiarMoneda = useCallback((codigo) => setMoneda(establecerMoneda(codigo)), []);
    const cambiarSaldosOcultos = useCallback((valor) => setSaldosOcultos(establecerSaldosOcultos(valor)), []);

    const valor = useMemo(
        () => ({ moneda, cambiarMoneda, saldosOcultos, cambiarSaldosOcultos }),
        [moneda, cambiarMoneda, saldosOcultos, cambiarSaldosOcultos]
    );

    return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export default PreferenciasProvider;
