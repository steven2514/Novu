import { use, useState } from "react";
import { supabase } from '../supabase';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [modo, setModo] = useState('login');
    const [nombre, setNombre] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');

    function iniciarSesion() {
        setError('');
        supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
            if (error) setError(error.message);
        });
    }

    function registrar() {
        setError('');
        if (password !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        supabase.auth.signUp({ email, password }).then(({ error }) => {
            if (error) setError(error.message);
        });
    }

    return (
        <div className="login">
            <div className="tabs-login">
                <button
                    className={modo === 'login' ? 'tab-activo' : ''}
                    onClick={() => setModo('login')}>Iniciar Sesion</button>
                
                <button
                    className={modo === 'registro' ? 'tab-activo' : ''}
                onClick={()=> setModo('resgistro')}>Crear Cuenta</button>
            </div>

            <div className="iniciar-sesion">

                {modo === 'registro' && (
                    <>
                        <label>Nombre completo</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" />
                    </>
                )}
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />

                {modo === 'registro' && (
                    <>
                        <label>Confirmar Contraseña</label>
                        <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="confirmar contraseña" />
                    </>
                )}
                <label>Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="contraseña" />
                
                {error && <p className="login-error">{error}</p>}

                <button onClick={modo === 'login' ? iniciarSesion : registrar}>
                    {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
            </div>
        </div>
    )
}

export default Login;