import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inicio from './pages/Inicio';
import Sidebar from './components/Sidebar/Sidebar';
import Transacciones from './pages/Transacciones';
import Suscripciones from './pages/Suscripciones'
import Cuenta from './pages/Cuentas';
import Meta from './pages/Metas';
import Calendario from './pages/Calendario';
import Aprendizaje from './pages/Aprendizaje';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import Modal from './components/Modal/Modal';
import { useState, useEffect } from 'react';
import ModalAgregar from './components/ModalAgregar/ModalAgregar';
import { supabase } from './supabase';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Loader from './components/Loader/Loader';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Splash from './components/Splash/Splash';
import './flotante.css';
import NotFound from './pages/NotFound';


function App() {

    const [tareas, setTareas] = useState([]);
    const [transacciones, setTransacciones] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [cuentas, setCuentas] = useState([]);
    const [metas, setMetas] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mostrarSplash, setMostrarSplash] = useState(true);
    const [transaccionEditar, setTransaccionEditar] = useState(null);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('transacciones').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data) setTransacciones(data);
        });
    }, [sesion]);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('cuentas').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data) setCuentas(data);
        });
    }, [sesion]);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('metas').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data) setMetas(data);
        });
    }, [sesion]);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('suscripciones').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data) setSuscripciones(data);
        });
    }, [sesion]);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('tareas').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data) setTareas(data);
        });
    }, [sesion]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSesion(data.session);
            setCargando(false);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSesion(session);
        });
    }, []);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('perfiles').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (!data || data.length === 0) {
                supabase.from('perfiles').insert([{ user_id: sesion.user.id, tours_vistos: '' }]).then(() => { });
            }
        });
    }, [sesion]);

    useEffect(() => {
        const hex = localStorage.getItem('color-acento');
        if (!hex) return;
        const oscuro = localStorage.getItem('color-acento-oscuro') || '#B89A1E';
        const fin = localStorage.getItem('color-acento-fin') || '#A9C95A';

        document.documentElement.style.setProperty('--principal', hex);
        document.documentElement.style.setProperty('--principal-oscuro', oscuro);
        document.documentElement.style.setProperty('--principal-claro', hex + '22');
        document.documentElement.style.setProperty('--principal-muy-claro', hex + '11');
        document.documentElement.style.setProperty('--gradiente-balance', `linear-gradient(135deg, ${hex} 0%, ${fin} 100%)`);
        document.documentElement.style.setProperty('--acento', hex);
        document.documentElement.style.setProperty('--acento-oscuro', oscuro);
        document.documentElement.style.setProperty('--acento-texto', '#ffffff');
        document.documentElement.style.setProperty('--banner-inicio', hex);
        document.documentElement.style.setProperty('--banner-fin', fin);
    }, []);



    // Abre el modal de transacciones (gasto / ingreso / transferencia / aporte).
    // Se usa tanto para crear como para editar (pasando la transacción existente).
    function abrirModal(tipo, transaccion = null) {
        setModalTipo(tipo);
        setTransaccionEditar(transaccion);
        setModalVisible(true);
    }

    async function eliminar(id) {
        const transaccion = transacciones.find(t => t.id === id);
        await supabase.from('transacciones').delete().eq('id', id);
        setTransacciones(prev => prev.filter(t => t.id !== id));
        const cuentaActual = cuentas.find(c => c.nombre === transaccion.cuenta);
        if (cuentaActual) {
            const nuevoSaldo = transaccion.tipo === 'ingreso'
                ? Number(cuentaActual.saldo) - Number(transaccion.monto)
                : Number(cuentaActual.saldo) + Number(transaccion.monto);
            await supabase.from('cuentas').update({ saldo: nuevoSaldo }).eq('id', cuentaActual.id);
            setCuentas(prev => prev.map(c => c.id === cuentaActual.id ? { ...c, saldo: nuevoSaldo } : c));
        }
    }

    if (cargando) {
        return <Loader />;
    }

    if (mostrarSplash) {
        return <Splash onTerminar={cerrarSplash} />;
    }

    function cerrarSplash() {
        setMostrarSplash(false);
    }

    return (
        <BrowserRouter>
            {!sesion ? (
                <Routes>
                    <Route path='/' element={<Landing />} />
                    <Route path='/login' element={<Login onLoginSuccess={() => {
                        supabase.auth.getSession().then(({ data }) => {
                            setSesion(data.session);
                        });
                    }} />} />
                    <Route path='*' element={<Landing />} />
                </Routes>
            ) : (
                <div className='layout'>
                    <Sidebar onAgregar={() => abrirModal('gasto')} />
                    <div className='contenido'>
                        <Routes>

                            <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} sesion={sesion} />} />

                            <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} sesion={sesion} />} />

                            <Route path='/cuentas' element={<Cuenta cuentas={cuentas} setCuentas={setCuentas} sesion={sesion} abrirModalTransferencia={() => abrirModal('transferencia')} />} />

                            <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} sesion={sesion} />} />


                            <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas} sesion={sesion} />} />

                            <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas} sesion={sesion} />} />

                            <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} sesion={sesion} />} />

                            <Route path='/perfil' element={<Perfil sesion={sesion} setSesion={setSesion} />} />

                            <Route path='/admin' element={<Admin sesion={sesion} />} />

                            <Route path='/login' element={<Navigate to="/" replace />} />

                            <Route path='/terminos' element={<Terminos />} />
                            <Route path='/privacidad' element={<Privacidad />} />

                            <Route path='*' element={<NotFound />} />

                        </Routes>

                        {/* Modal único: Gasto / Ingreso / Transferencia / Aporte a meta (con pestañas) */}
                        <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}>
                            <ModalAgregar
                                setTransacciones={setTransacciones}
                                cuentas={cuentas}
                                setCuentas={setCuentas}
                                metas={metas}
                                setMetas={setMetas}
                                sesion={sesion}
                                onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}
                                transaccionEditar={transaccionEditar}
                                tipoInicial={modalTipo}
                            />
                        </Modal>

                        <div className="flotante-container">
                            <button className="flotante-btn" onClick={() => abrirModal('gasto')}>
                                +
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BrowserRouter>
    );
}

export default App;