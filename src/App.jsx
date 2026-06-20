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

    useEffect(() => {
        supabase.from('transacciones').select('*').then(({ data }) => {
            if (data) setTransacciones(data);
        });
    }, []);

    useEffect(() => {
        supabase.from('cuentas').select('*').then(({ data }) => {
            if (data) setCuentas(data);
        });
    }, []);

    useEffect(() => {
        supabase.from('metas').select('*').then(({ data }) => {
            if (data) setMetas(data);
        });
    }, []);

    useEffect(() => {
        supabase.from('suscripciones').select('*').then(({ data }) => {
            if (data) setSuscripciones(data);
        });
    }, []);

    useEffect(() => {
        supabase.from('tareas').select('*').then(({ data }) => {
            if (data) setTareas(data);
        });
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSesion(data.session);
            setCargando(false);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSesion(session);
        });
    }, []);

    function abrirModal(tipo) {
        setModalTipo(tipo);
        setModalVisible(true);
    }

    function eliminar(id) {
        supabase.from('transacciones').delete().eq('id', id).then(() => { });
        setTransacciones(prev => prev.filter(t => t.id !== id));
    }

    if (cargando) {
        return <Loader />;
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
                            <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} />} />

                            <Route path='/cuentas' element={<Cuenta cuentas={cuentas} setCuentas={setCuentas} />} />

                            <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} />} />

                            <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} />} />

                            <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas} />} />

                            <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas} />} />

                            <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} />} />
                        </Routes>
                        <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                            <Formulario setTransacciones={setTransacciones} tipo={modalTipo} onClose={() => setModalVisible(false)} cuentas={cuentas} setCuentas={setCuentas} />
                        </Modal>
                    </div>
                </div>
            )}
        </BrowserRouter>
    );
}

export default App;