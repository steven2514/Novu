import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';

// Landing no es lazy: es lo primero que ve un visitante.
const Login = lazy(() => import('../pages/Login'));
const Terminos = lazy(() => import('../pages/Terminos'));
const Privacidad = lazy(() => import('../pages/Privacidad'));

// Rutas para quien no ha iniciado sesión.
function RutasPublicas({ onLoginSuccess }) {
    return (
        <Routes>
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login onLoginSuccess={onLoginSuccess} />} />
            {/* Los términos y la privacidad se leen ANTES de registrarse */}
            <Route path='/terminos' element={<Terminos />} />
            <Route path='/privacidad' element={<Privacidad />} />
            <Route path='*' element={<Landing />} />
        </Routes>
    );
}

export default RutasPublicas;
