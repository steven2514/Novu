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
    const [cargando, setCargando] = useState(false);
    const [cargandoGoogle, setCargandoGoogle] = useState(false);

    async function iniciarSesion() {
        setError('');
        setCargando(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setCargando(false);
        if (error) setError(error.message);
        else if (onLoginSuccess) onLoginSuccess();
    }

    async function registrar() {
        setError('');
        if (password !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setCargando(true);
        const { error } = await supabase.auth.signUp({ email, password });
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
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) {
            setError(error.message);
            setCargandoGoogle(false);
        }
        // Si no hay error, Supabase redirige a Google y esta pantalla se desmonta.
    }

    return (
        <div className="login-page">
            <div className="login-marca">
                <div className="login-marca-icono">
                    <Icon name="wallet2" size={20} />
                </div>
                <span>Novu</span>
            </div>

            <div className="login-card">
                <div className="tabs-login">
                    <button
                        className={modo === 'login' ? 'tab-activo' : ''}
                        onClick={() => setModo('login')}>Iniciar sesión</button>
                    <button
                        className={modo === 'registro' ? 'tab-activo' : ''}
                        onClick={() => setModo('registro')}>Crear cuenta</button>
                </div>

                <h1>{modo === 'login' ? 'Iniciar sesión' : 'Crea tu cuenta'}</h1>
                <p className="login-bajada">Tu dinero, claro y en calma</p>

                <button className="btn-google" onClick={continuarConGoogle} disabled={cargandoGoogle}>
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
                            Continuar con Google
                        </>
                    )}
                </button>

                <div className="login-divisor"><span>o</span></div>

                <label>Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />

                <label>Contraseña</label>
                <div className="login-input-password">
                    <input type={verPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    <span onClick={() => setVerPassword(!verPassword)}><Icon name={verPassword ? 'eye-off' : 'eye'} size={18} /></span>
                </div>

                {modo === 'registro' && (
                    <>
                        <label>Confirmar contraseña</label>
                        <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="••••••••" />
                    </>
                )}

                {error && <p className="login-error">{error}</p>}

                <button className="login-btn-principal" onClick={modo === 'login' ? iniciarSesion : registrar} disabled={cargando}>
                    {cargando ? (
                        <div className="loader-spinner spinner-pequeño"></div>
                    ) : (
                        modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
                    )}
                </button>

                <p className="login-cambiar-modo">
                    {modo === 'login' ? (
                        <>¿No tienes cuenta? <span onClick={() => setModo('registro')}>Regístrate</span></>
                    ) : (
                        <>¿Ya tienes cuenta? <span onClick={() => setModo('login')}>Inicia sesión</span></>
                    )}
                </p>
                {modo === 'login' && <p className="login-olvide">Olvidé mi contraseña</p>}
            </div>
        </div>
    );
}

export default Login;