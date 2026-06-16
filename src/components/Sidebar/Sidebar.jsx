import { Link } from "react-router-dom";
import './Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <h1>Novu</h1>
            <Link to="/">Dashboard</Link>
            <Link to="/transacciones">Transacciones</Link>
            <Link to="/suscripciones">Suscripciones</Link>
            <Link to="/metas">Metas</Link>
            <Link to="/calendario">Calendario</Link>
            <Link to="/aprendizaje">Aprendizaje</Link>
        </div>
    );
}

export default Sidebar;