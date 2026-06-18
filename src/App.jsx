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
import { useState } from 'react';
import Formulario from './components/Formulario/Formulario';

function App() {

    const [tareas, setTareas] = useState([]);
    const [transacciones, setTransacciones] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [cuentas, setCuentas] = useState([]);
    const [metas, setMetas] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);

    function abrirModal(tipo) {
        setModalTipo(tipo);
        setModalVisible(true);
    }

    function eliminar(index) {
        setTransacciones(prev => prev.filter((_, i) => i !== index));
    }

    return (
        <BrowserRouter>
            <div className='layout'>
                <Sidebar />
                <div className='contenido'>
                    <Routes>
                        <Route path='/' element={<Inicio transacciones={transacciones} setTransacciones={setTransacciones} metas={metas} />} />
                        <Route path='/cuentas' element={<Cuenta  cuentas={cuentas} setCuentas={setCuentas}/>} />
                        <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar}/>} />
                        <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} />} />
                        <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas } />} />
                        <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas}/>} />
                        <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} />} />
                    </Routes>
                    <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                        <Formulario setTransacciones={setTransacciones} tipo={modalTipo} onClose={() => setModalVisible(false)} cuentas={cuentas } />
                    </Modal>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;