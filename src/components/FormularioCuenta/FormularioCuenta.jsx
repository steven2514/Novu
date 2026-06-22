import { useState, useEffect } from "react";
import './FormularioCuenta.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../context/ToastContext';

function FormularioCuenta({ setCuenta, onClose, cuentaEditar }) {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('debito');
    const [saldo, setSaldo] = useState('');
    const [banco, setBanco] = useState('');
    const [color, setColor] = useState('#6C63FF');
    const { mostrarToast } = useToast();

    useEffect(() => {
        if (cuentaEditar) {
            setNombre(cuentaEditar.nombre);
            setTipo(cuentaEditar.tipo);
            setSaldo(cuentaEditar.saldo);
            setBanco(cuentaEditar.banco || '');
            setColor(cuentaEditar.color);
        }
    }, [cuentaEditar]);

    async function guardar() {
        const saldoFinal = saldo === '' ? 0 : Number(saldo);

        if (cuentaEditar) {
            const { error } = await supabase.from('cuentas').update({ nombre, tipo, saldo: saldoFinal, banco, color }).eq('id', cuentaEditar.id);
            if (error) {
                mostrarToast('No se pudo actualizar la cuenta', 'error');
                return;
            }
            setCuenta(prev => prev.map(c => c.id === cuentaEditar.id ? { ...c, nombre, tipo, saldo: saldoFinal, banco, color } : c));
            mostrarToast('Cuenta actualizada correctamente', 'exito');
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const nueva = { nombre, tipo, saldo: saldoFinal, banco, color, user_id: user.id };
            const { data, error } = await supabase.from('cuentas').insert([nueva]).select().single();
            if (error) {
                mostrarToast('No se pudo crear la cuenta, intenta de nuevo', 'error');
                return;
            }
            setCuenta(prev => [...prev, data]);
            mostrarToast('Cuenta creada correctamente', 'exito');
        }

        setNombre('');
        setTipo('');
        setSaldo('');
        setBanco('');
        setColor('');
        onClose();
    }

    return (
        <div className="formulario-cuenta">
            <div className="formulario-meta-header">
                <h2>{cuentaEditar ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cuenta Principal" />

            <label>Tipo de Cuenta</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="debito">Débito</option>
                <option value="efectivo">Efectivo</option>
                <option value="credito">Crédito</option>
            </select>

            <label>Saldo {cuentaEditar ? '' : 'Inicial'}</label>
            <input type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="0.00" />

            <label>Banco (opcional)</label>
            <input type="text" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Ej: Banco Nacional" />

            <label>Color</label>
            <div className="color-opciones">
                {['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4', '#00E676'].map((c) => (
                    <div
                        key={c}
                        className={`color-circulo ${color === c ? 'seleccionado' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>

            <button onClick={guardar}>{cuentaEditar ? 'Guardar Cambios' : 'Crear Cuenta'}</button>
        </div>
    );
}

export default FormularioCuenta;