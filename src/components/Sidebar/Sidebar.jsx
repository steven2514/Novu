import { NavLink } from "react-router-dom";
import './Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icono">N</div>
                <div className="sidebar-logo-texto">
                    <h2>Novu</h2>
                    <p>Control Total</p>
                </div>
            </div>

            <NavLink to="/">🧩 Dashboard</NavLink>
            <NavLink to="/cuentas">🏦 Cuentas</NavLink>
            <NavLink to="/transacciones">🔄 Transacciones</NavLink>
            <NavLink to="/suscripciones">📅 Suscripciones</NavLink>
            <NavLink to="/metas">🎯 Metas</NavLink>
            <NavLink to="/calendario">📆 Calendario</NavLink>
            <NavLink to="/aprendizaje">📚 Aprendizaje</NavLink>

            <div className="sidebar-footer">
                <p>Versión Local</p>
                <span>Tus datos se guardan localmente en tu navegador</span>
            </div>
        </div>
    );
}

export default Sidebar;