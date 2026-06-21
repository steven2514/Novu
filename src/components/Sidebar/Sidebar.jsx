import { NavLink } from "react-router-dom";
import './Sidebar.css';
import { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function Sidebar() {

    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [temaOscuro, setTemaOscuro] = useState(() => {
        return localStorage.getItem('tema') === 'oscuro';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', temaOscuro ? 'dark' : 'light');
        localStorage.setItem('tema', temaOscuro ? 'oscuro' : 'claro');
    }, [temaOscuro]);

    async function cerrarSesion() {
        setCargando(true);
        await supabase.auth.signOut();
        setCargando(false);
    }

    return (
        <>
            <button className="btn-hamburguesa" onClick={() => setAbierto(!abierto)}><Icon name="menu" size={20} /></button>
            <div className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
                <div className="sidebar-logo">
                    <svg width="40" height="40" viewBox="0 0 140 140" className="sidebar-logo-svg">
                        <defs>
                            <linearGradient id="sidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8B7FFF" />
                                <stop offset="100%" stopColor="#4338CA" />
                            </linearGradient>
                        </defs>
                        <rect width="140" height="140" rx="28" fill="url(#sidebarGrad)" />
                        <rect x="35" y="80" width="14" height="30" rx="6" fill="white" />
                        <rect x="58" y="65" width="14" height="45" rx="6" fill="white" />
                        <rect x="81" y="45" width="14" height="65" rx="6" fill="white" />
                        <circle cx="88" cy="35" r="5" fill="white" />
                    </svg>
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
                    <div className="sidebar-legal-links">
                        <NavLink to="/terminos" onClick={() => setAbierto(false)}>Términos</NavLink>
                        <NavLink to="/privacidad" onClick={() => setAbierto(false)}>Privacidad</NavLink>
                    </div>
                    <button className="btn-tema" onClick={() => setTemaOscuro(!temaOscuro)}>
                        <span className="btn-tema-label">
                            <span className="btn-tema-icono">
                                <Icon name={temaOscuro ? 'sun' : 'moon'} size={14} />
                            </span>
                            {temaOscuro ? 'Modo Claro' : 'Modo Oscuro'}
                        </span>
                        <span>{temaOscuro ? '☀️' : '🌙'}</span>
                    </button>
                    <button className="btn-cerrar-sesion" onClick={cerrarSesion} disabled={cargando}>
                        {cargando ? <div className="loader-spinner spinner-pequeño"></div> : <><Icon name="log-out" /> Cerrar sesión</>}
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;