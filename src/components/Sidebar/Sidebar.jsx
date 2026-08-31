import { NavLink } from "react-router-dom";
import './Sidebar.css';
import { useState } from 'react';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function Sidebar({ onAgregar, onTransferir, sesion }) {

    const [abierto, setAbierto] = useState(false);

    async function cerrarSesion() {
        await supabase.auth.signOut();
    }

    function proximamente(feature) {
        alert(`${feature}: próximamente 🚧`);
        setAbierto(false);
    }

    const nombreUsuario = sesion?.user?.user_metadata?.nombre
        || sesion?.user?.user_metadata?.full_name
        || sesion?.user?.email?.split('@')[0]
        || 'Usuario';

    const correoUsuario = sesion?.user?.email || '';

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
                    <NavLink to="/" end onClick={() => setAbierto(false)}><Icon name="layout-dashboard" /> Inicio</NavLink>
                    <NavLink to="/transacciones" onClick={() => setAbierto(false)}><Icon name="arrow-left-right" /> Movimientos</NavLink>
                    <button className="sidebar-nav-btn" onClick={() => { onTransferir && onTransferir(); setAbierto(false); }}>
                        <Icon name="send" /> Transferencias
                    </button>
                    <NavLink to="/Metas" onClick={() => setAbierto(false)}><Icon name="target" /> Metas</NavLink>
                    <NavLink to="/Suscripciones" onClick={() => setAbierto(false)}><Icon name="credit-card" /> Suscripciones</NavLink>
                    <NavLink to="/cuentas" onClick={() => setAbierto(false)}><Icon name="landmark" /> Cuentas</NavLink>

                    <div className="sidebar-separador" />

                    <button className="sidebar-nav-btn sidebar-nav-btn-proximamente" onClick={() => proximamente('Reportes')}>
                        <Icon name="chart-no-axes-column-increasing" /> Reportes
                    </button>
                    <button className="sidebar-nav-btn sidebar-nav-btn-proximamente" onClick={() => proximamente('Presupuestos')}>
                        <Icon name="calculator" /> Presupuestos
                    </button>

                    <NavLink to="/perfil" onClick={() => setAbierto(false)}><Icon name="settings" /> Ajustes</NavLink>
                </nav>

                <div className="sidebar-inferior">
                    <NavLink to="/perfil" className="sidebar-perfil-chip" onClick={() => setAbierto(false)}>
                        <span className="sidebar-perfil-avatar">{nombreUsuario.charAt(0).toUpperCase()}</span>
                        <div className="sidebar-perfil-info">
                            <b>{nombreUsuario}</b>
                            <small>{correoUsuario}</small>
                        </div>
                    </NavLink>

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