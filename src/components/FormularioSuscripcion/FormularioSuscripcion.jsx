import { useState } from "react";
import './FormularioSuscripcion.css'
import { Icon, ICONOS_SUSCRIPCION } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../context/ToastContext';

function FormularioSuscripcion({ setSuscripciones, onClose, cuentas, setCuentas, sesion }) {

    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState();
    const [cuenta, setCuenta] = useState('');
    const [fechaRenovacion, setFechaRenovacion] = useState('');
    const [frecuencia, setFrecuencia] = useState('mensual');
    const [icono, setIcono] = useState('credit-card');
    const [color, setColor] = useState('#6C63FF');
    const { mostrarToast } = useToast();

    const ICONOS = ICONOS_SUSCRIPCION;
    const COLORES = ['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4'];

    function guardar() {
        const nueva = { nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color, user_id: sesion.user.id };
        supabase.from('suscripciones').insert([nueva]).then(({ error }) => {
            if (error) {
                mostrarToast('No se pudo crear la suscripción', 'error');
                return;
            }
            mostrarToast('Suscripción creada correctamente', 'exito');
        });
        setSuscripciones(prev => [...prev, nueva]);
        setCuentas(prev => prev.map(c => {
            if (c.nombre !== cuenta) return c;
            return { ...c, saldo: Number(c.saldo) - Number(monto) };
        }));
        onClose();
    }

    return (
        <div className="formulario-suscripcion">
            <div className="formulario-meta-header">
                <h2>Nueva Suscripcion</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>

            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Netflix" />

            <label>Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />

            <label>Cuenta</label>
            <select value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
                {cuentas.map((c, i) => (
                    <option key={i} value={c.nombre}>{c.nombre}</option>
                ))}
            </select>

            <label>Fecha de Renovación</label>
            <input type="date" value={fechaRenovacion} onChange={(e) => setFechaRenovacion(e.target.value)} />

            <label>Frecuencia</label>
            <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
            </select>

            <label>Icono</label>
            <div className="iconos-opciones">
                {ICONOS.map((ic) => (
                    <div
                        key={ic}
                        className={`icono-opcion ${icono === ic ? 'seleccionado' : ''}`}
                        onClick={() => setIcono(ic)}
                    ><Icon name={ic} /></div>
                ))}
            </div>

            <label>Color</label>
            <div className="color-opciones">
                {COLORES.map((c) => (
                    <div
                        key={c}
                        className={`color-circulo ${color === c ? 'seleccionado' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>

            <button onClick={guardar}>Crear Suscripción</button>
        </div>
    );
}

export default FormularioSuscripcion;