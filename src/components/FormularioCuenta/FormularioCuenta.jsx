import { useState } from "react";
import './FormularioCuenta.css';
import { Icon } from '../Icon';

function FormularioCuenta({setCuenta, onClose}) {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('debito');
    const [saldo, setSaldo] = useState('');
    const [banco, setBanco] = useState('');
    const [color, setColor] = useState('#6C63FF');

    function guardar() {
        setCuenta(prev => [...prev, { nombre, tipo, saldo, banco, color }]);
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