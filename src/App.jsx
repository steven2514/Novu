import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import Sidebar from './components/Sidebar/Sidebar';
import Transacciones from './pages/Transacciones';
import Suscripciones from './pages/Suscripciones'
import Cuenta from './pages/Cuentas';
import Meta from './pages/Metas';
import Calendario from './pages/Calendario';
import Aprendizaje from './pages/Aprendizaje';
import Modal from './components/Modal/Modal';
import { useState, useEffect } from 'react';
import Formulario from './components/Formulario/Formulario';
import { supabase } from './supabase';
import Login from './pages/Login';
import Loader from './components/Loader/Loader';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Splash from './components/Splash/Splash';
import FormularioTransferencia from './components/FormularioTransferencia/FormularioTransferencia';
import './flotante.css';
import FormularioCuenta from './components/FormularioCuenta/FormularioCuenta';
import FormularioMeta from './components/FormularioMeta/FormularioMeta';
import NotFound from './pages/NotFound';


function App() {

    const [modalCuentaVisible, setModalCuentaVisible] = useState(false);
    const [modalMetaVisible, setModalMetaVisible] = useState(false);
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
    const [modalTransferenciaVisible, setModalTransferenciaVisible] = useState(false);
    const [transaccionEditar, setTransaccionEditar] = useState(null);
    const [menuFlotanteVisible, setMenuFlotanteVisible] = useState(false);

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
                    <Route path='*' element={<Login />} />
                </Routes>
            ) : (
                <div className='layout'>
                    <Sidebar />
                    <div className='contenido'>
                        <Routes>

                            <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} sesion={sesion} />} /> 
                                
                            <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} sesion={sesion} />} />

                            <Route path='/cuentas' element={<Cuenta cuentas={cuentas} setCuentas={setCuentas} sesion={sesion} abrirModalTransferencia={() => setModalTransferenciaVisible(true)} />} />

                            <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} sesion={sesion} />} />


                            <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas} sesion={sesion} />} />

                            <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas} sesion={sesion} />} />

                            <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} sesion={sesion} />} />

                            <Route path='/terminos' element={<Terminos />} />
                                <Route path='/privacidad' element={<Privacidad />} />
                                
                            <Route path='*' element={<NotFound />} />

                        </Routes>
                            <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}>
                                <Formulario
                                    setTransacciones={setTransacciones}
                                    tipo={modalTipo}
                                    onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}
                                    cuentas={cuentas}
                                    setCuentas={setCuentas}
                                    sesion={sesion}
                                    transaccionEditar={transaccionEditar}
                                />
                            </Modal>

                        <Modal visible={modalTransferenciaVisible} onClose={() => setModalTransferenciaVisible(false)}>
                            <FormularioTransferencia cuentas={cuentas} metas={metas} setCuentas={setCuentas} setMetas={setMetas} onClose={() => setModalTransferenciaVisible(false)} sesion={sesion} />
                            </Modal>
                            <Modal visible={modalCuentaVisible} onClose={() => setModalCuentaVisible(false)}>
                                <FormularioCuenta setCuenta={setCuentas} onClose={() => setModalCuentaVisible(false)} />
                            </Modal>

                            <Modal visible={modalMetaVisible} onClose={() => setModalMetaVisible(false)}>
                                <FormularioMeta setMetas={setMetas} onClose={() => setModalMetaVisible(false)} sesion={sesion} />
                            </Modal>

                            
                            <div className="flotante-container">
                                {menuFlotanteVisible && (
                                    <div className="flotante-menu">
                                        <button onClick={() => { abrirModal('ingreso'); setMenuFlotanteVisible(false); }}>
                                            <span className="flotante-icono verde">↙</span> Ingreso
                                        </button>
                                        <button onClick={() => { abrirModal('gasto'); setMenuFlotanteVisible(false); }}>
                                            <span className="flotante-icono rojo">↗</span> Gasto
                                        </button>
                                        <button onClick={() => { setModalCuentaVisible(true); setMenuFlotanteVisible(false); }}>
                                            <span className="flotante-icono morado">💳</span> Cuenta
                                        </button>
                                        <button onClick={() => { setModalMetaVisible(true); setMenuFlotanteVisible(false); }}>
                                            <span className="flotante-icono azul">🎯</span> Meta
                                        </button>
                                        <button onClick={() => { setModalTransferenciaVisible(true); setMenuFlotanteVisible(false); }}>
                                            <span className="flotante-icono naranja">⇄</span> Transferir
                                        </button>
                                    </div>
                                )}
                                <button className="flotante-btn" onClick={() => setMenuFlotanteVisible(prev => !prev)}>
                                    {menuFlotanteVisible ? '✕' : '+'}
                                </button>
                                
                            </div>
                    </div>
                </div>
            )}
        </BrowserRouter>
    );
}

export default App;