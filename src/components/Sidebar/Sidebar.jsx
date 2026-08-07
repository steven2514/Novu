import { NavLink } from "react-router-dom";
import './Sidebar.css';
import { useState } from 'react';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function Sidebar({ onAgregar }) {

    const [abierto, setAbierto] = useState(false);

    async function cerrarSesion() {
        await supabase.auth.signOut();
    }

    return (
        <>
            <button className="btn-hamburguesa" onClick={() => setAbierto(!abierto)}><Icon name="menu" size={20} /></button>
            <div className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icono">
                        <Icon name="wallet" size={18} />
                    </div>
                    <div className="sidebar-logo-texto">
                        <h2>Novu</h2>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end onClick={() => setAbierto(false)}><Icon name="home" /> Inicio</NavLink>
                    <NavLink to="/transacciones" onClick={() => setAbierto(false)}><Icon name="arrow-left-right" /> Movimientos</NavLink>
                    <NavLink to="/Metas" onClick={() => setAbierto(false)}><Icon name="target" /> Metas</NavLink>
                    <NavLink to="/Suscripciones" onClick={() => setAbierto(false)}><Icon name="credit-card" /> Suscripciones</NavLink>
                    <NavLink to="/cuentas" onClick={() => setAbierto(false)}><Icon name="landmark" /> Cuentas</NavLink>
                    <NavLink to="/perfil" onClick={() => setAbierto(false)}><Icon name="settings" /> Ajustes</NavLink>
                </nav>

                <div className="sidebar-inferior">
                    <button className="sidebar-btn-agregar" onClick={() => { onAgregar && onAgregar(); setAbierto(false); }}>
                        + Agregar
                    </button>

                    <button className="sidebar-btn-salir" onClick={cerrarSesion}>
                        <Icon name="log-out" size={16} /> Cerrar sesión
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;