import { useState, useEffect } from "react";
import './FormularioSuscripcion.css'
import { Icon, ICONOS_SUSCRIPCION } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';

function FormularioSuscripcion({ setSuscripciones, onClose, cuentas, setCuentas, sesion, suscripcionEditar }) {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState();
    const [cuenta, setCuenta] = useState('');
    const [fechaRenovacion, setFechaRenovacion] = useState('');
    const [frecuencia, setFrecuencia] = useState('mensual');
    const [icono, setIcono] = useState('credit-card');
    const [color, setColor] = useState('#6C63FF');
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const ICONOS = ICONOS_SUSCRIPCION;
    const COLORES = ['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4'];

    useEffect(() => {
        if (suscripcionEditar) {
            setNombre(suscripcionEditar.nombre);
            setMonto(suscripcionEditar.monto);
            setCuenta(suscripcionEditar.cuenta);
            setFechaRenovacion(suscripcionEditar.fecha_renovacion);
            setFrecuencia(suscripcionEditar.frecuencia);
            setIcono(suscripcionEditar.icono);
            setColor(suscripcionEditar.color);
        }
    }, [suscripcionEditar]);

    async function guardar() {
        setGuardando(true);
        if (suscripcionEditar) {
            const { error } = await supabase.from('suscripciones').update({ nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color }).eq('id', suscripcionEditar.id);
            if (error) { mostrarToast('No se pudo actualizar la suscripción', 'error'); setGuardando(false); return; }
            setSuscripciones(prev => prev.map(s => s.id === suscripcionEditar.id ? { ...s, nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color } : s));
            mostrarToast('Suscripción actualizada correctamente', 'exito');
        } else {
            const nueva = { nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color, user_id: sesion.user.id };
            const { error } = await supabase.from('suscripciones').insert([nueva]);
            if (error) { mostrarToast('No se pudo crear la suscripción', 'error'); setGuardando(false); return; }
            setSuscripciones(prev => [...prev, nueva]);
            setCuentas(prev => prev.map(c => {
                if (c.nombre !== cuenta) return c;
                return { ...c, saldo: Number(c.saldo) - Number(monto) };
            }));
            mostrarToast('Suscripción creada correctamente', 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-suscripcion">
            <div className="modal-kaipo-header">
                <h2>{suscripcionEditar ? 'Editar Suscripción' : 'Nueva suscripción'}</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>

            <div className="modal-kaipo-body">
                <div className="icono-selector-grid">
                    {ICONOS.map((ic) => (
                        <div key={ic} className={`icono-selector-opcion ${icono === ic ? 'seleccionado' : ''}`} onClick={() => setIcono(ic)}>
                            <Icon name={ic} />
                        </div>
                    ))}
                </div>

                <label>Nombre</label>
                <input className="campo-pildora" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Netflix" />

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label>Monto</label>
                        <input className="campo-pildora" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <label>Ciclo</label>
                        <select className="campo-pildora" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                            <option value="diario">Diario</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensual">Mensual</option>
                        </select>
                    </div>
                </div>

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label>Próximo cobro</label>
                        <input className="campo-pildora" type="date" value={fechaRenovacion} onChange={(e) => setFechaRenovacion(e.target.value)} />
                    </div>
                    <div>
                        <label>Cuenta</label>
                        <select className="campo-pildora" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                            <option value="">Seleccionar cuenta</option>
                            {cuentas.map((c, i) => (<option key={i} value={c.nombre}>{c.nombre}</option>))}
                        </select>
                    </div>
                </div>

                <label>Color</label>
                <div className="color-selector-grid">
                    {COLORES.map((c) => (
                        <div key={c} className={`color-selector-opcion ${color === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                    ))}
                </div>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : suscripcionEditar ? 'Guardar Cambios' : 'Guardar'}
            </button>
        </div>
    );
}

export default FormularioSuscripcion;