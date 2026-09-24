import { useMemo, useState } from 'react';
import { IdiomaContext, guardarIdioma, obtenerIdioma, valoresIdioma } from './idioma';

// Guarda el idioma elegido y vuelve a renderizar la app cuando cambia.
function IdiomaProvider({ children }) {
    const [idioma, setIdioma] = useState(obtenerIdioma);

    const valor = useMemo(
        () => valoresIdioma(idioma, (nuevo) => setIdioma(guardarIdioma(nuevo))),
        [idioma]
    );

    return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
}

export default IdiomaProvider;
