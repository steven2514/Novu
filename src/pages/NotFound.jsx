import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="notfound-page">
            <div className="notfound-contenido">
                <h1 className="notfound-numero">404</h1>
                <h2 className="notfound-titulo">Página no encontrada</h2>
                <p className="notfound-subtitulo">La ruta que buscas no existe o fue movida.</p>
                <button onClick={() => navigate('/')}>Volver al Dashboard</button>
            </div>
        </div>
    );
}

export default NotFound;