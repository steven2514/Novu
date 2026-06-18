import { NavLink } from "react-router-dom";
import './Sidebar.css';
import { useState } from 'react';

function Sidebar() {

    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <button className="btn-hamburguesa" onClick={() => setAbierto(!abierto)}>☰</button>
            <div className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icono">N</div>
                    <div className="sidebar-logo-texto">
                        <h2>NovuApp</h2>
                        <p>Control Total</p>
                    </div>
                </div>

                <NavLink to="/" onClick={() => setAbierto(false)}>🧩 Dashboard</NavLink>
                <NavLink to="/cuentas" onClick={() => setAbierto(false)}>🏦 Cuentas</NavLink>
                <NavLink to="/transacciones" onClick={() => setAbierto(false)}>🔄 Transacciones</NavLink>
                <NavLink to="/suscripciones" onClick={() => setAbierto(false)}>📅 Suscripciones</NavLink>
                <NavLink to="/metas" onClick={() => setAbierto(false)}>🎯 Metas</NavLink>
                <NavLink to="/calendario" onClick={() => setAbierto(false)}>📆 Calendario</NavLink>
                <NavLink to="/aprendizaje" onClick={() => setAbierto(false)}>📚 Aprendizaje</NavLink>

                <div className="sidebar-footer">
                    <p>Autor</p>
                    <span>Steven David Alvarez Morante</span>
                </div>
            </div>
        </>
    );
}

export default Sidebar;