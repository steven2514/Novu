import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './paletas.css'
import './responsive.css'
import App from './App.jsx'
import { ToastProvider } from "./Context/ToastContext";
import { iniciarApariencia } from './utils/tema';
import IdiomaProvider from './i18n/IdiomaProvider';
import { obtenerIdioma } from './i18n/idioma';

// Aplica tema y color guardados antes del primer render para evitar parpadeos.
iniciarApariencia();
document.documentElement.lang = obtenerIdioma();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <IdiomaProvider>
            <ToastProvider>
                <App />
            </ToastProvider>
        </IdiomaProvider>
    </StrictMode>,
)