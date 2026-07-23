import { useState } from "react";
import { supabase } from '../supabase';
import './Login.css';
import { Icon } from '../components/Icon';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [modo, setModo] = useState('login');
    const [nombre, setNombre] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [cargando, setCargando] = useState(false);

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
            setNombre('');
            setEmail('');
            setPassword('');
            setConfirmarPassword('');
            setModo('login');
        }
    }
    

    return (
        <div className="login-page">
            <div className="login-panel-izq">

                <div className="login-circulo-1"></div>
                <div className="login-circulo-2"></div>
                <div className="login-anillo"></div>
                <div className="login-logo">
                    <div className="login-logo-icono">N</div>
                    <div>
                        <h2>NovuApp</h2>
                        <p>Control Total</p>
                    </div>
                </div>

                <h1>Toma el control<br />de tus finanzas</h1>
                <p className="login-subtitulo">Registra, organiza y analiza tus ingresos y gastos desde un solo lugar.</p>

                <div className="login-beneficio">
                    <span className="login-beneficio-icono"><Icon name="trending-up" /></span>
                    <div>
                        <p className="login-beneficio-titulo">Seguimiento de gastos</p>
                        <p className="login-beneficio-subtitulo">Visualiza tus finanzas con gráficas en tiempo real</p>
                    </div>
                </div>
                <div className="login-beneficio">
                    <span className="login-beneficio-icono"><Icon name="target" /></span>
                    <div>
                        <p className="login-beneficio-titulo">Metas de ahorro</p>
                        <p className="login-beneficio-subtitulo">Define objetivos y monitorea tu progreso</p>
                    </div>
                </div>
                <div className="login-beneficio">
                    <span className="login-beneficio-icono"><Icon name="book-open" /></span>
                    <div>
                        <p className="login-beneficio-titulo">Panel de aprendizaje</p>
                        <p className="login-beneficio-subtitulo">Registra tareas y compromisos diarios</p>
                    </div>
                </div>
                <div className="login-beneficio">
                    <span className="login-beneficio-icono"><Icon name="shield" /></span>
                    <div>
                        <p className="login-beneficio-titulo">Datos seguros</p>
                        <p className="login-beneficio-subtitulo">Tu información guardada en la nube</p>
                    </div>
                </div>

                <div className="login-footer-fila">
                    <span>© 2026 NovuApp — Todos los derechos reservados</span>
                    <div className="login-puntos">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>

            <div className="login-panel-der">
                <div className="login">
                    <div className="tabs-login">
                        <button
                            className={modo === 'login' ? 'tab-activo' : ''}
                            onClick={() => setModo('login')}>Iniciar sesión</button>

                        <button
                            className={modo === 'registro' ? 'tab-activo' : ''}
                            onClick={() => setModo('registro')}>Crear cuenta</button>
                    </div>

                    <div className="iniciar-sesion">
                        <h2>{modo === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
                        <p className="login-bajada">{modo === 'login' ? 'Ingresa tus datos para continuar' : 'Empieza a controlar tus finanzas hoy'}</p>

                        {modo === 'registro' && (
                            <>
                                <label>Nombre completo</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="nombre" />
                            </>
                        )}

                        <label>Correo electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />

                        <label>Contraseña</label>
                        <div className="login-input-password">
                            <input type={verPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                            <span onClick={() => setVerPassword(!verPassword)}><Icon name={verPassword ? 'eye-off' : 'eye'} size={18} /></span>
                        </div>

                        {modo === 'registro' && (
                            <>
                                <label>Confirmar Contraseña</label>
                                <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="••••••••" />
                            </>
                        )}

                        {error && <p className="login-error">{error}</p>}

                        <button className="login-btn-principal" onClick={modo === 'login' ? iniciarSesion : registrar} disabled={cargando}>
                            {cargando ? (
                                <div className="loader-spinner spinner-pequeño"></div>
                            ) : (
                                <>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} <Icon name="arrow-right" size={18} /></>
                            )}
                        </button>

                        <p className="login-cambiar-modo">
                            {modo === 'login' ? (
                                <>¿No tienes cuenta? <span onClick={() => setModo('registro')}>Regístrate gratis</span></>
                            ) : (
                                <>¿Ya tienes cuenta? <span onClick={() => setModo('login')}>Inicia sesión</span></>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;