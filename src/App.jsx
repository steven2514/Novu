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
    const [modalTransferenciaVisible, setModalTransferenciaVisible] = useState(false);

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

    

    function abrirModal(tipo) {
        setModalTipo(tipo);
        setModalVisible(true);
    }

    function eliminar(id) {
        const transaccion = transacciones.find(t => t.id === id);
        supabase.from('transacciones').delete().eq('id', id).then(() => { });
        setTransacciones(prev => prev.filter(t => t.id !== id));
        setCuentas(prev => prev.map(c => {
            if (c.nombre !== transaccion.cuenta) return c;
            const nuevoSaldo = transaccion.tipo === 'ingreso'
                ? Number(c.saldo) - Number(transaccion.monto)
                : Number(c.saldo) + Number(transaccion.monto);
            return { ...c, saldo: nuevoSaldo };
        }));
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
                            <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} sesion={sesion } />} />

                            <Route path='/cuentas' element={<Cuenta cuentas={cuentas} setCuentas={setCuentas} sesion={sesion} abrirModalTransferencia={() => setModalTransferenciaVisible(true)} />} />

                            <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} />} />

                            <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} />} />

                            <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas} />} />

                            <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas} />} />

                            <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} />} />

                            <Route path='/terminos' element={<Terminos />} />
                            <Route path='/privacidad' element={<Privacidad />} />

                        </Routes>
                        <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                            <Formulario setTransacciones={setTransacciones} tipo={modalTipo} onClose={() => setModalVisible(false)} cuentas={cuentas} setCuentas={setCuentas} />
                            </Modal>

                            <Modal visible={modalTransferenciaVisible} onClose={() => setModalTransferenciaVisible(false)}>
                                <FormularioTransferencia cuentas={cuentas} metas={metas} setCuentas={setCuentas} setMetas={setMetas} onClose={() => setModalTransferenciaVisible(false)} sesion={sesion} />
                            </Modal>
                        
                    </div>
                </div>
            )}
        </BrowserRouter>
    );
}

export default App;