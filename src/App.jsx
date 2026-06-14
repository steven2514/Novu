import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgregarIngreso from './pages/AgregarIngreso';
import AgregarGasto from './pages/AgregarGasto';
import { useState } from 'react';

function App() {

    const [transacciones, setTransacciones] = useState([]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Inicio transacciones={transacciones} setTransacciones={setTransacciones}/>} />
                <Route path='/agregarIngreso' element={<AgregarIngreso setTransacciones={setTransacciones } />}></Route>
                <Route path='/agregarGasto' element={<AgregarGasto setTransacciones={setTransacciones}/>}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;