import { useState } from "react"
import './Formulario.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function Formulario({ setTransacciones, tipo, onClose, cuentas, setCuentas }) {

    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [fuente, setFuente] = useState('');
    const [fecha] = useState(new Date())

    function agregar() {
        const nueva = { descripcion, monto, tipo, categoria, cuenta, fecha, fuente };
        supabase.from('transacciones').insert([nueva]).then(() => {});
        setTransacciones(prev => [...prev, nueva]);
        setCuentas(prev => prev.map(c => {
            if (c.nombre !== cuenta) return c;
            const nuevoSaldo = tipo == 'ingreso' ? Number(c.saldo) + Number(monto)
                : Number(c.saldo) - Number(monto);
            return { ...c, saldo: nuevoSaldo }
        }));
        setDescripcion('');
        setMonto('');
        setCategoria('');
        setCuenta('');
        setFuente('');
        onClose();
    }

    return (
        <div className="formulario">
            <div className="formulario-header">
                <h2>{tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>
            <label>Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
            <label>Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" />
            <label>Categoría</label>
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
                        <option value="servicios-publicos">Servicios Públicos</option>
                        <option value="telefonia-e-internet">Telefonía e internet</option>
                        <option value="entretenimiento">Entretenimiento</option>
                        <option value="compras">Compras</option>
                        <option value="salud">Salud</option>
                        <option value="educacion">Educación</option>
                        <option value="mascotas">Mascotas</option>
                        <option value="otros">Otros</option>
                    </>
                )}
            </select>
            <label>Cuenta</label>
            <select value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
                {cuentas.map((c, index) => (
                    <option key={index} value={c.nombre}>{c.nombre}</option>
                ))}
            </select>
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