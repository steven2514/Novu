import { NavLink, Link } from "react-router-dom";
import './Sidebar.css';
import { useState } from 'react';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useIdioma } from '../../i18n/idioma';

// Los textos son claves de traducción dentro de "sidebar.*"
const SECCIONES = [
    {
        titulo: 'general',
        enlaces: [
            { to: '/', icono: 'layout-dashboard', texto: 'inicio', end: true },
            { to: '/transacciones', icono: 'arrow-left-right', texto: 'movimientos' },
            { to: '/cuentas', icono: 'landmark', texto: 'cuentas' },
        ],
    },
    {
        titulo: 'planificacion',
        enlaces: [
            { to: '/Metas', icono: 'target', texto: 'metas' },
            { to: '/Suscripciones', icono: 'credit-card', texto: 'suscripciones' },
            { to: '/Calendario', icono: 'calendar-days', texto: 'calendario' },
            { to: '/Aprendizaje', icono: 'book-open', texto: 'tareas' },
        ],
    },
];

function Sidebar({ onAgregar, onTransferir, sesion }) {

    const [abierto, setAbierto] = useState(false);
    const { t } = useIdioma();
    const cerrar = () => setAbierto(false);

    async function cerrarSesion() {
        await supabase.auth.signOut();
    }

    const nombreUsuario = sesion?.user?.user_metadata?.nombre
        || sesion?.user?.user_metadata?.full_name
        || sesion?.user?.email?.split('@')[0]
        || t('comun.usuario');

    const correoUsuario = sesion?.user?.email || '';

    return (
        <>
            <header className="topbar-movil">
                <button className="btn-hamburguesa" onClick={() => setAbierto(true)} aria-label={t('sidebar.abrirMenu')}>
                    <Icon name="menu" size={20} />
                </button>
                <span className="sidebar-marca">
                    <span className="sidebar-marca-icono">N</span>
                    Novu<span className="sidebar-marca-app">App</span>
                </span>
                <button className="topbar-movil-agregar" onClick={onAgregar} aria-label={t('sidebar.nuevoMovimiento')}>
                    <Icon name="plus" size={20} />
                </button>
            </header>

            {abierto && <div className="sidebar-velo" onClick={cerrar} />}

            <aside className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
                <div className="sidebar-cabecera">
                    <Link to="/" className="sidebar-marca" onClick={cerrar}>
                        <span className="sidebar-marca-icono">N</span>
                        Novu<span className="sidebar-marca-app">App</span>
                    </Link>
                    <button className="sidebar-cerrar" onClick={cerrar} aria-label={t('sidebar.cerrarMenu')}>
                        <Icon name="x" size={18} />
                    </button>
                </div>

                <button className="sidebar-btn-agregar" onClick={() => { onAgregar && onAgregar(); cerrar(); }}>
                    <Icon name="plus" size={18} /> {t('sidebar.nuevoMovimiento')}
                </button>

                <nav className="sidebar-nav">
                    {SECCIONES.map((seccion) => (
                        <div key={seccion.titulo} className="sidebar-seccion">
                            <span className="sidebar-seccion-titulo">{t(`sidebar.${seccion.titulo}`)}</span>
                            {seccion.enlaces.map((enlace) => (
                                <NavLink key={enlace.to} to={enlace.to} end={enlace.end} onClick={cerrar}>
                                    <Icon name={enlace.icono} size={18} /> {t(`sidebar.${enlace.texto}`)}
                                </NavLink>
                            ))}
                            {seccion.titulo === 'general' && (
                                <button className="sidebar-nav-btn" onClick={() => { onTransferir && onTransferir(); cerrar(); }}>
                                    <Icon name="send" size={18} /> {t('sidebar.transferir')}
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="sidebar-seccion">
                        <span className="sidebar-seccion-titulo">{t('sidebar.cuenta')}</span>
                        <NavLink to="/perfil" onClick={cerrar}>
                            <Icon name="settings" size={18} /> {t('sidebar.ajustes')}
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-inferior">
                    <NavLink to="/perfil" className="sidebar-perfil-chip" onClick={cerrar}>
                        <span className="sidebar-perfil-avatar">{nombreUsuario.charAt(0).toUpperCase()}</span>
                        <div className="sidebar-perfil-info">
                            <b>{nombreUsuario}</b>
                            <small>{correoUsuario}</small>
                        </div>
                    </NavLink>

                    <button className="sidebar-btn-salir" onClick={cerrarSesion}>
                        <Icon name="log-out" size={16} /> {t('sidebar.cerrarSesion')}
                    </button>

                    <div className="sidebar-legal-links">
                        <Link to="/terminos" onClick={cerrar}>{t('sidebar.terminos')}</Link>
                        <span>·</span>
                        <Link to="/privacidad" onClick={cerrar}>{t('sidebar.privacidad')}</Link>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
