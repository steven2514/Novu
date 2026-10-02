import { Component } from 'react';
import { traducir } from '../i18n/idioma';
import { reportarError } from '../utils/monitoreo';

// Si una pantalla falla al dibujarse, en vez de quedar en blanco se muestra
// un aviso con un botón para recargar, y el error se reporta a Sentry.
class LimiteErrores extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        reportarError(error, { componentStack: info.componentStack });
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="limite-errores" role="alert">
                <h1>{traducir('errores.inesperado')}</h1>
                <p>{traducir('errores.inesperadoTexto')}</p>
                <button className="btn-pildora-acento" onClick={() => window.location.reload()}>
                    {traducir('errores.recargar')}
                </button>
            </div>
        );
    }
}

export default LimiteErrores;
