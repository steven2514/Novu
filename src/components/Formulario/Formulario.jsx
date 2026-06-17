import { useState } from "react"
import './Formulario.css';

function Formulario({ setTransacciones, tipo, onClose }) {

    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [fecha, setFecha] = useState('');
    const [fuente, setFuente] = useState('');
    

    function agregar() {
        setTransacciones(prev => [...prev, { descripcion, monto, tipo, categoria, cuenta,fecha, fuente }]);
        setDescripcion('');
        setMonto('');
        setCategoria('');
        setCuenta('');
        setFecha('');
        setFuente('');
        onClose();
    }


    return (
        <div className="formulario" >

            <h2>{tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}</h2>
            <label htmlFor="">Descripcion</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
            <label htmlFor="">Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" />
            <label htmlFor="">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Seleccionar categoría</option>
                {tipo === 'ingreso' ? (
                    <>
                        <option value="salario">Salario</option>
                        <option value="freelance">Freelance</option>
                        <option value="ventas">Ventas</option>
                        <option value="inversiones">Inversiones</option>
                        <option value="otros ingresos">Otros ingresos</option>
                        
                    </>
                ) : (
                    <>
                        <option value="alimentacion">Alimentación</option>
                        <option value="transporte">Transporte</option>
                        <option value="vivienda">Vivienda</option>
                        <option value="servicios-publicos">Servicios Publicos</option>
                        <option value="telefonia-e-internet">Telefonia e internet</option>
                        <option value="entretenimiento">Entretenimiento</option>
                        <option value="compras">Compras</option>
                        <option value="salud">Salud</option>
                        <option value="educacion">Educacion</option>
                        <option value="mascotas">Mascotas</option>
                        <option value="otros">Otros</option>
                        
                    </>
                )}
            </select>
            <label htmlFor="">Cuenta</label>
            <select value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
            </select>
            <label htmlFor="">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            {tipo === 'ingreso' && (
                <input type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Fuente (opcional)" />
            )}
            <button onClick={agregar}>
                {tipo === 'ingreso' ? 'Agregar Ingreso' : 'Agregar Gasto'}
            </button>
        </div>
    );
}

export default Formulario;