import { NavLink } from "react-router-dom";
import './Sidebar.css';
import { useState } from 'react';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function Sidebar() {

    const [abierto, setAbierto] = useState(false);

    function cerrarSesion() {
        supabase.auth.signOut();
    }

    return (
        <>
            <button className="btn-hamburguesa" onClick={() => setAbierto(!abierto)}><Icon name="menu" size={20} /></button>
            <div className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icono">N</div>
                    <div className="sidebar-logo-texto">
                        <h2>NovuApp</h2>
                        <p>Control Total</p>
                    </div>
                </div>

                <NavLink to="/" onClick={() => setAbierto(false)}><Icon name="layout-dashboard" /> Dashboard</NavLink>
                <NavLink to="/cuentas" onClick={() => setAbierto(false)}><Icon name="landmark" /> Cuentas</NavLink>
                <NavLink to="/transacciones" onClick={() => setAbierto(false)}><Icon name="arrow-left-right" /> Transacciones</NavLink>
                <NavLink to="/suscripciones" onClick={() => setAbierto(false)}><Icon name="calendar" /> Suscripciones</NavLink>
                <NavLink to="/metas" onClick={() => setAbierto(false)}><Icon name="target" /> Metas</NavLink>
                <NavLink to="/calendario" onClick={() => setAbierto(false)}><Icon name="calendar-days" /> Calendario</NavLink>
                <NavLink to="/aprendizaje" onClick={() => setAbierto(false)}><Icon name="book-open" /> Aprendizaje</NavLink>

                <div className="sidebar-footer">
                    <p>Autor</p>
                    <span>Steven David Alvarez Morante</span>
                    <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
                        <Icon name="log-out" /> Cerrar sesión
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;