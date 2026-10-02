import { useCallback, useEffect, useMemo, useState } from 'react';
import { PreferenciasContext } from './preferencias';
import { actualizarTasas, establecerMoneda, establecerSaldosOcultos, obtenerMoneda, obtenerTasas, saldosEstanOcultos } from '../utils/moneda';

// Moneda, tasas de cambio y "ocultar saldos": al cambiar cualquiera, los
// componentes que usan usePreferencias() (App, y con ella toda la app) se
// vuelven a dibujar y dinero() ya convierte y formatea con el valor nuevo.
function PreferenciasProvider({ children }) {
    const [moneda, setMoneda] = useState(obtenerMoneda);
    const [saldosOcultos, setSaldosOcultos] = useState(saldosEstanOcultos);
    const [tasas, setTasas] = useState(obtenerTasas);

    // Tasas del día (como mucho una consulta diaria)
    useEffect(() => {
        let vigente = true;
        actualizarTasas().then((cambiaron) => {
            if (vigente && cambiaron) setTasas(obtenerTasas());
        });
        return () => { vigente = false; };
    }, []);

    const cambiarMoneda = useCallback((codigo) => setMoneda(establecerMoneda(codigo)), []);
    const cambiarSaldosOcultos = useCallback((valor) => setSaldosOcultos(establecerSaldosOcultos(valor)), []);

    const valor = useMemo(
        () => ({ moneda, cambiarMoneda, tasas, saldosOcultos, cambiarSaldosOcultos }),
        [moneda, cambiarMoneda, tasas, saldosOcultos, cambiarSaldosOcultos]
    );

    return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export default PreferenciasProvider;
