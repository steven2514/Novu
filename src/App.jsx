import { BrowserRouter } from 'react-router-dom';
import { useState, Suspense } from 'react';
import { supabase } from './supabase';
import Loader from './components/Loader/Loader';
import Splash from './components/Splash/Splash';
import RutasPublicas from './rutas/RutasPublicas';
import PanelUsuario from './rutas/PanelUsuario';
import { useDatosUsuario } from './hooks/useDatosUsuario';
import { usePreferencias } from './Context/preferencias';

function App() {
    const datos = useDatosUsuario();
    const [mostrarSplash, setMostrarSplash] = useState(true);

    // Al cambiar la moneda u "ocultar saldos" App se vuelve a dibujar y con ella
    // todas las páginas, que formatean los montos con utils/moneda.js.
    usePreferencias();

    if (datos.cargando) {
        return <Loader />;
    }

    if (mostrarSplash) {
        return <Splash onTerminar={() => setMostrarSplash(false)} />;
    }

    function alIniciarSesion() {
        supabase.auth.getSession().then(({ data }) => datos.setSesion(data.session));
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<Loader />}>
                {datos.sesion
                    ? <PanelUsuario datos={datos} />
                    : <RutasPublicas onLoginSuccess={alIniciarSesion} />}
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
