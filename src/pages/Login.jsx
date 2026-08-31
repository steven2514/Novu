import { useState } from "react";
import { supabase } from '../supabase';
import './Login.css';
import { Icon } from '../components/Icon';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [modo, setModo] = useState('login');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [cargandoGoogle, setCargandoGoogle] = useState(false);

    async function iniciarSesion() {
        setError('');
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

        if (password !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
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

    const cambiarModo = (nuevoModo) => {
        setError('');
        setModo(nuevoModo);
    };

    return (
        <div className="login-page">

            {/* FONDOS */}
            <div className="login-ambient login-ambient-1"></div>
            <div className="login-ambient login-ambient-2"></div>
            <div className="login-ambient login-ambient-3"></div>

            {/* MARCA */}
            <div className="login-marca">
                <div className="login-marca-icono">
                    <span>N</span>
                </div>

                <span>Novu</span>
            </div>

            {/* CARD */}
            <div className="login-card glass-panel">

                <div className="login-reflection"></div>

                {/* TABS */}
                <div className="tabs-login">

                    <button
                        type="button"
                        className={modo === 'login' ? 'tab-activo' : ''}
                        onClick={() => cambiarModo('login')}
                    >
                        Iniciar sesión
                    </button>

                    <button
                        type="button"
                        className={modo === 'registro' ? 'tab-activo' : ''}
                        onClick={() => cambiarModo('registro')}
                    >
                        Crear cuenta
                    </button>

                </div>

                {/* TITULO */}
                <div className="login-heading">
                    <h1>
                        {modo === 'login'
                            ? 'Iniciar sesión'
                            : 'Crea tu cuenta'}
                    </h1>

                    <p className="login-bajada">
                        Tu dinero, claro y en calma
                    </p>
                </div>

                {/* GOOGLE */}
                <button
                    type="button"
                    className="btn-google"
                    onClick={continuarConGoogle}
                    disabled={cargandoGoogle}
                >
                    {cargandoGoogle ? (
                        <div className="loader-spinner spinner-pequeño"></div>
                    ) : (
                        <>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"
                                />

                                <path
                                    fill="#34A853"
                                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
                                />

                                <path
                                    fill="#FBBC05"
                                    d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"
                                />

                                <path
                                    fill="#EA4335"
                                    d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
                                />
                            </svg>

                            Continuar con Google
                        </>
                    )}
                </button>

                {/* DIVISOR */}
                <div className="login-divisor">
                    <span></span>
                    <b>o</b>
                    <span></span>
                </div>

                {/* CORREO */}
                <label>Correo</label>

                <div className="login-input-wrap">
                    <Icon name="mail" size={17} />

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                    />
                </div>

                {/* PASSWORD */}
                <label>Contraseña</label>

                <div className="login-input-wrap">

                    <Icon name="lock" size={17} />

                    <input
                        type={verPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() =>
                            setVerPassword(!verPassword)
                        }
                    >
                        <Icon
                            name={
                                verPassword
                                    ? 'eye-off'
                                    : 'eye'
                            }
                            size={17}
                        />
                    </button>

                </div>

                {/* CONFIRMAR PASSWORD */}
                {modo === 'registro' && (
                    <>
                        <label>Confirmar contraseña</label>

                        <div className="login-input-wrap">

                            <Icon name="lock" size={17} />

                            <input
                                type={
                                    verConfirmarPassword
                                        ? 'text'
                                        : 'password'
                                }
                                value={confirmarPassword}
                                onChange={(e) =>
                                    setConfirmarPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="••••••••"
                            />

                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() =>
                                    setVerConfirmarPassword(
                                        !verConfirmarPassword
                                    )
                                }
                            >
                                <Icon
                                    name={
                                        verConfirmarPassword
                                            ? 'eye-off'
                                            : 'eye'
                                    }
                                    size={17}
                                />
                            </button>

                        </div>
                    </>
                )}

                {/* ERROR */}
                {error && (
                    <p className="login-error">
                        {error}
                    </p>
                )}

                {/* BOTON */}
                <button
                    type="button"
                    className="login-btn-principal"
                    onClick={
                        modo === 'login'
                            ? iniciarSesion
                            : registrar
                    }
                    disabled={cargando}
                >
                    {cargando ? (
                        <div className="loader-spinner spinner-pequeño"></div>
                    ) : (
                        <>
                            {modo === 'login'
                                ? 'Iniciar sesión'
                                : 'Crear cuenta'}

                            <Icon
                                name="arrow-right"
                                size={17}
                            />
                        </>
                    )}
                </button>

                {/* CAMBIAR MODO */}
                <p className="login-cambiar-modo">

                    {modo === 'login' ? (
                        <>
                            ¿No tienes cuenta?{' '}

                            <button
                                type="button"
                                onClick={() =>
                                    cambiarModo('registro')
                                }
                            >
                                Regístrate
                            </button>
                        </>
                    ) : (
                        <>
                            ¿Ya tienes cuenta?{' '}

                            <button
                                type="button"
                                onClick={() =>
                                    cambiarModo('login')
                                }
                            >
                                Inicia sesión
                            </button>
                        </>
                    )}

                </p>

                {modo === 'login' && (
                    <button
                        type="button"
                        className="login-olvide"
                    >
                        Olvidé mi contraseña
                    </button>
                )}

            </div>

            <p className="login-footer">
                © 2026 NovuApp — Todos los derechos reservados
            </p>

        </div>
    );
}

export default Login;