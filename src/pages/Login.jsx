import { useState } from "react";
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';
import { Icon } from '../components/Icon';
import SelectorIdioma from '../components/SelectorIdioma/SelectorIdioma';
import { useIdioma } from '../i18n/idioma';
import { PanelMarca, BotonGoogle, CampoPassword } from '../components/Login/PartesLogin';

// Textos que cambian entre "Iniciar sesión" y "Crear cuenta"
const TEXTOS = {
    login: { titulo: 'login.bienvenido', bajada: 'login.bajadaLogin', boton: 'login.iniciarSesion', pregunta: 'login.noCuenta', enlace: 'login.registrate', otroModo: 'registro' },
    registro: { titulo: 'login.crearTitulo', bajada: 'login.bajadaRegistro', boton: 'login.crearCuenta', pregunta: 'login.yaCuenta', enlace: 'login.iniciaSesion', otroModo: 'login' },
};

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [modo, setModo] = useState('login');
    const [cargando, setCargando] = useState(false);
    const [cargandoGoogle, setCargandoGoogle] = useState(false);
    const { t } = useIdioma();
    const textos = TEXTOS[modo];

    function limpiarMensajes() {
        setError('');
        setAviso('');
    }

    async function iniciarSesion() {
        setCargando(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setCargando(false);
        if (error) setError(error.message);
        else onLoginSuccess?.();
    }

    async function registrar() {
        if (password !== confirmarPassword) {
            setError(t('login.passNoCoinciden'));
            return;
        }
        setCargando(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setCargando(false);
        if (error) {
            setError(error.message);
            return;
        }
        setEmail('');
        setPassword('');
        setConfirmarPassword('');
        setModo('login');
        setAviso(t('login.avisoRegistro'));
    }

    async function continuarConGoogle() {
        setError('');
        setCargandoGoogle(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            setError(error.message);
            setCargandoGoogle(false);
        }
    }

    async function recuperarPassword() {
        limpiarMensajes();
        if (!email) {
            setError(t('login.escribeCorreo'));
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) setError(error.message);
        else setAviso(t('login.avisoRecuperar'));
    }

    function cambiarModo(nuevoModo) {
        limpiarMensajes();
        setModo(nuevoModo);
    }

    function enviar(e) {
        e.preventDefault();
        limpiarMensajes();
        if (modo === 'login') iniciarSesion();
        else registrar();
    }

    return (
        <div className="login-page">
            <PanelMarca />

            <main className="login-contenido">
                <div className="login-barra">
                    <Link to="/" className="login-volver">
                        <Icon name="chevron-left" size={16} /> {t('login.volver')}
                    </Link>
                    <SelectorIdioma />
                </div>

                <form className="login-card" onSubmit={enviar}>
                    <div className="login-heading">
                        <h1>{t(textos.titulo)}</h1>
                        <p className="login-bajada">{t(textos.bajada)}</p>
                    </div>

                    <div className="tabs-login">
                        <button type="button" className={modo === 'login' ? 'tab-activo' : ''} onClick={() => cambiarModo('login')}>
                            {t('login.iniciarSesion')}
                        </button>
                        <button type="button" className={modo === 'registro' ? 'tab-activo' : ''} onClick={() => cambiarModo('registro')}>
                            {t('login.crearCuenta')}
                        </button>
                    </div>

                    <BotonGoogle onClick={continuarConGoogle} cargando={cargandoGoogle} />

                    <div className="login-divisor">
                        <span></span>
                        <b>{t('login.oCorreo')}</b>
                        <span></span>
                    </div>

                    <label htmlFor="login-email">{t('login.correo')}</label>
                    <div className="login-input-wrap">
                        <Icon name="mail" size={17} />
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.ejCorreo')}
                        />
                    </div>

                    <CampoPassword
                        id="login-password"
                        etiqueta={t('login.contrasena')}
                        value={password}
                        onChange={setPassword}
                        autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                    />

                    {modo === 'registro' && (
                        <CampoPassword id="login-confirmar" etiqueta={t('login.confirmar')} value={confirmarPassword} onChange={setConfirmarPassword} autoComplete="new-password" />
                    )}

                    {modo === 'login' && (
                        <button type="button" className="login-olvide" onClick={recuperarPassword}>
                            {t('login.olvide')}
                        </button>
                    )}

                    {error && <p className="login-error">{error}</p>}
                    {aviso && <p className="login-aviso">{aviso}</p>}

                    <button type="submit" className="login-btn-principal" disabled={cargando}>
                        {cargando
                            ? <div className="loader-spinner spinner-pequeño"></div>
                            : <>{t(textos.boton)} <Icon name="arrow-right" size={17} /></>}
                    </button>

                    <p className="login-cambiar-modo">
                        {t(textos.pregunta)} <button type="button" onClick={() => cambiarModo(textos.otroModo)}>{t(textos.enlace)}</button>
                    </p>
                </form>

                <p className="login-footer">{t('login.pie')}</p>
            </main>
        </div>
    );
}

export default Login;
