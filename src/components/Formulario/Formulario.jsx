import { useEffect, useState } from "react"
import './Formulario.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';

function Formulario({ setTransacciones, tipo, onClose, cuentas, setCuentas, sesion, transaccionEditar }) {

    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [fuente, setFuente] = useState('');
    const [fecha] = useState(new Date())
    const { mostrarToast } = useToast();
    const [guardando, setGuardando] = useState(false);

    async function guardar() {
        setGuardando(true);
        if (transaccionEditar) {
            const { error } = await supabase.from('transacciones').update({ descripcion, monto, categoria, cuenta, fuente }).eq('id', transaccionEditar.id);
            if (error) { mostrarToast('No se pudo actualizar', 'error'); setGuardando(false); return; }
            mostrarToast('Transacción actualizada', 'exito');
            setTransacciones(prev => prev.map(t => t.id === transaccionEditar.id ? { ...t, descripcion, monto, categoria, cuenta, fuente } : t));
        } else {
            const nueva = { descripcion, monto, tipo, categoria, cuenta, fecha, fuente, user_id: sesion.user.id };
            const { error } = await supabase.from('transacciones').insert([nueva]);
            if (error) { mostrarToast('No se pudo guardar la transacción', 'error'); setGuardando(false); return; }
            mostrarToast(tipo === 'ingreso' ? 'Ingreso agregado' : 'Gasto agregado', 'exito');
            setTransacciones(prev => [...prev, nueva]);
            const cuentaObj = cuentas.find(c => c.nombre === cuenta);
            if (cuentaObj) {
                const nuevoSaldo = tipo === 'ingreso' ? Number(cuentaObj.saldo) + Number(monto) : Number(cuentaObj.saldo) - Number(monto);
                await supabase.from('cuentas').update({ saldo: nuevoSaldo }).eq('id', cuentaObj.id);
                setCuentas(prev => prev.map(c => c.id === cuentaObj.id ? { ...c, saldo: nuevoSaldo } : c));
            }
        }
        setGuardando(false);
        onClose();
    }

    useEffect(() => {
    if (transaccionEditar) {
        setDescripcion(transaccionEditar.descripcion);
        setMonto(transaccionEditar.monto);
        setCategoria(transaccionEditar.categoria);
        setCuenta(transaccionEditar.cuenta);
        setFuente(transaccionEditar.fuente || '');
    }
}, [transaccionEditar]);

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
            <button onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : transaccionEditar ? 'Guardar Cambios' : tipo === 'ingreso' ? 'Agregar Ingreso' : 'Agregar Gasto'}
            </button>
        </div>
    );
}

export default Formulario;