import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgregarIngreso from './pages/AgregarIngreso';
import AgregarGasto from './pages/AgregarGasto';
import Sidebar from './components/Sidebar/Sidebar';
import Transacciones from './pages/Transacciones';
import Suscripciones from './pages/Suscripciones'
import Meta from './pages/Metas';
import Calendario from './pages/Calendario';
import Aprendizaje from './pages/Aprendizaje';
import { useState } from 'react';

function App() {

    const [transacciones, setTransacciones] = useState([]);

    return (
        <BrowserRouter>
            <div className='layout'>
                <Sidebar />
                <div className='contenido'>
                    <Routes>
                        <Route path='/' element={<Inicio
                        transacciones={transacciones} setTransacciones={setTransacciones} />} />
                        <Route path='/agregarGasto' element={<AgregarGasto setTransacciones={setTransacciones}/>} />
                        <Route path='/agregarIngreso' element={<AgregarIngreso setTransacciones={setTransacciones} />} />
                        <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones}/>} />
                        <Route path='/Suscripciones' element={<Suscripciones/> } />
                        <Route path='/Metas'  element={<Meta/>}/>
                        <Route path='/Calendario' element={<Calendario/> } />
                        <Route path='/Aprendizaje' element={<Aprendizaje/> } />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;