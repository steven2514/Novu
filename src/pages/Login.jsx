import { useState } from "react";
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';
import { Icon } from '../components/Icon';
import SelectorIdioma from '../components/SelectorIdioma/SelectorIdioma';
import { useIdioma } from '../i18n/idioma';

const BENEFICIOS = [
    { icono: 'arrow-left-right', texto: 'login.beneficio1' },
    { icono: 'target', texto: 'login.beneficio2' },
    { icono: 'credit-card', texto: 'login.beneficio3' },
];

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [modo, setModo] = useState('login');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [cargandoGoogle, setCargandoGoogle] = useState(false);
    const { t } = useIdioma();

    async function iniciarSesion() {
        setError('');
        setAviso('');
        setCargando(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setCargando(false);

        if (error) {
            setError(error.message);
        } else if (onLoginSuccess) {
            onLoginSuccess();
        }
    }

    async function registrar() {
        setError('');
        setAviso('');

        if (password !== confirmarPassword) {
            setError(t('login.passNoCoinciden'));
            return;
        }

        setCargando(true);

        const { error } = await supabase.auth.signUp({
            email,
            password
        });

        setCargando(false);

        if (error) {
            setError(error.message);
        } else {
            setEmail('');
            setPassword('');
            setConfirmarPassword('');
            setModo('login');
            setAviso(t('login.avisoRegistro'));
        }
    }

    async function continuarConGoogle() {
        setError('');
        setCargandoGoogle(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (error) {
            setError(error.message);
            setCargandoGoogle(false);
        }
    }

    async function recuperarPassword() {
        setError('');
        setAviso('');
        if (!email) {
            setError(t('login.escribeCorreo'));
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) {
            setError(error.message);
        } else {
            setAviso(t('login.avisoRecuperar'));
        }
    }

    const cambiarModo = (nuevoModo) => {
        setError('');
        setAviso('');
        setModo(nuevoModo);
    };

    function enviar(e) {
        e.preventDefault();
        if (modo === 'login') iniciarSesion();
        else registrar();
    }

    return (
        <div className="login-page">

            {/* PANEL DE MARCA */}
            <aside className="login-panel">
                <Link to="/" className="login-marca">
                    <span className="login-marca-icono">N</span>
                    Novu<span className="login-marca-app">App</span>
                </Link>

                <div className="login-panel-texto">
                    <span className="login-overline">{t('marca.lema')}</span>
                    <h2>{t('login.panelTitulo')}</h2>
                    <ul>
                        {BENEFICIOS.map((b) => (
                            <li key={b.texto}>
                                <span><Icon name={b.icono} size={16} /></span>
                                {t(b.texto)}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="login-panel-tarjeta" aria-hidden="true">
                    <small>{t('login.balanceTotal')}</small>
                    <strong>$4.825.000</strong>
                    <div className="login-panel-barras">
                        {[35, 50, 42, 68, 58, 82, 94].map((alto, i) => <span key={i} style={{ height: `${alto}%` }} />)}
                    </div>
                </div>
            </aside>

            {/* FORMULARIO */}
            <main className="login-contenido">
                <div className="login-barra">
                    <Link to="/" className="login-volver">
                        <Icon name="chevron-left" size={16} /> {t('login.volver')}
                    </Link>
                    <SelectorIdioma />
                </div>

                <form className="login-card" onSubmit={enviar}>

                    <div className="login-heading">
                        <h1>{modo === 'login' ? t('login.bienvenido') : t('login.crearTitulo')}</h1>
                        <p className="login-bajada">
                            {modo === 'login' ? t('login.bajadaLogin') : t('login.bajadaRegistro')}
                        </p>
                    </div>

                    {/* TABS */}
                    <div className="tabs-login">
                        <button type="button" className={modo === 'login' ? 'tab-activo' : ''} onClick={() => cambiarModo('login')}>
                            {t('login.iniciarSesion')}
                        </button>
                        <button type="button" className={modo === 'registro' ? 'tab-activo' : ''} onClick={() => cambiarModo('registro')}>
                            {t('login.crearCuenta')}
                        </button>
                    </div>

                    {/* GOOGLE */}
                    <button type="button" className="btn-google" onClick={continuarConGoogle} disabled={cargandoGoogle}>
                        {cargandoGoogle ? (
                            <div className="loader-spinner spinner-pequeño"></div>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 18 18">
                                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
                                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
                                    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
                                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
                                </svg>
                                {t('login.google')}
                            </>
                        )}
                    </button>

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

                    <label htmlFor="login-password">{t('login.contrasena')}</label>
                    <div className="login-input-wrap">
                        <Icon name="lock" size={17} />
                        <input
                            id="login-password"
                            type={verPassword ? 'text' : 'password'}
                            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <button type="button" className="login-password-toggle" onClick={() => setVerPassword(!verPassword)} aria-label={verPassword ? t('login.ocultarContrasena') : t('login.mostrarContrasena')}>
                            <Icon name={verPassword ? 'eye-off' : 'eye'} size={17} />
                        </button>
                    </div>

                    {modo === 'registro' && (
                        <>
                            <label htmlFor="login-confirmar">{t('login.confirmar')}</label>
                            <div className="login-input-wrap">
                                <Icon name="lock" size={17} />
                                <input
                                    id="login-confirmar"
                                    type={verConfirmarPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={confirmarPassword}
                                    onChange={(e) => setConfirmarPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" className="login-password-toggle" onClick={() => setVerConfirmarPassword(!verConfirmarPassword)} aria-label={verConfirmarPassword ? t('login.ocultarContrasena') : t('login.mostrarContrasena')}>
                                    <Icon name={verConfirmarPassword ? 'eye-off' : 'eye'} size={17} />
                                </button>
                            </div>
                        </>
                    )}

                    {modo === 'login' && (
                        <button type="button" className="login-olvide" onClick={recuperarPassword}>
                            {t('login.olvide')}
                        </button>
                    )}

                    {error && <p className="login-error">{error}</p>}
                    {aviso && <p className="login-aviso">{aviso}</p>}

                    <button type="submit" className="login-btn-principal" disabled={cargando}>
                        {cargando ? (
                            <div className="loader-spinner spinner-pequeño"></div>
                        ) : (
                            <>
                                {modo === 'login' ? t('login.iniciarSesion') : t('login.crearCuenta')}
                                <Icon name="arrow-right" size={17} />
                            </>
                        )}
                    </button>

                    <p className="login-cambiar-modo">
                        {modo === 'login' ? (
                            <>{t('login.noCuenta')} <button type="button" onClick={() => cambiarModo('registro')}>{t('login.registrate')}</button></>
                        ) : (
                            <>{t('login.yaCuenta')} <button type="button" onClick={() => cambiarModo('login')}>{t('login.iniciaSesion')}</button></>
                        )}
                    </p>
                </form>

                <p className="login-footer">
                    {t('login.pie')}
                </p>
            </main>
        </div>
    );
}

export default Login;
