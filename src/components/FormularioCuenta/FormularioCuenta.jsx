import { useState } from "react";
import './FormularioCuenta.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';

function FormularioCuenta({setCuenta, onClose}) {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('debito');
    const [saldo, setSaldo] = useState('');
    const [banco, setBanco] = useState('');
    const [color, setColor] = useState('#6C63FF');
    

    async function guardar() {
        const { data: { user } } = await supabase.auth.getUser();
        const nueva = { nombre, tipo, saldo: saldo === '' ? 0 : Number(saldo), banco, color, user_id: user.id };
        const { data, error } = await supabase.from('cuentas').insert([nueva]).select().single();
        if (error) {
            console.log('Error al crear cuenta:', error);
            return;
        }
        setCuenta(prev => [...prev, data]);
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
                <h2>Nueva Cuenta</h2>
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

            <label>Saldo Inicial</label>
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

            <button onClick={guardar}>Crear Cuenta</button>
        </div>
    );
}

export default FormularioCuenta;