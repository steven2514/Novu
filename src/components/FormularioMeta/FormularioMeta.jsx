import { useState, useEffect } from "react";
import './FormularioMeta.css';
import { Icon, ICONOS_META } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../context/ToastContext';

function FormularioMeta({ setMetas, onClose, sesion, metaEditar }) {

    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState();
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [icono, setIcono] = useState('');
    const [color, setColor] = useState('');
    const { mostrarToast } = useToast();
    const ICONOS = ICONOS_META;
    const COLORES = ['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4'];

    useEffect(() => {
        if (metaEditar) {
            setNombreMeta(metaEditar.nombre_meta);
            setMontoObjetivo(metaEditar.monto_objetivo);
            setMontoActual(metaEditar.monto_actual);
            setFechaObjetivo(metaEditar.fecha_objetivo);
            setIcono(metaEditar.icono);
            setColor(metaEditar.color);
        }
    }, [metaEditar]);

    function guardar() {
        if (metaEditar) {
            supabase.from('metas').update({ nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color }).eq('id', metaEditar.id).then(({ error }) => {
                if (error) {
                    mostrarToast('No se pudo actualizar la meta', 'error');
                    return;
                }
                mostrarToast('Meta actualizada correctamente', 'exito');
            });
            setMetas(prev => prev.map(m => m.id === metaEditar.id ? { ...m, nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color } : m));
        } else {
            const nueva = { nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual || 0, fecha_objetivo: fechaObjetivo, icono, color, user_id: sesion.user.id };
            supabase.from('metas').insert([nueva]).then(({ error }) => {
                if (error) {
                    mostrarToast('No se pudo crear la meta', 'error');
                    return;
                }
                mostrarToast('Meta creada correctamente', 'exito');
            });
            setMetas(prev => [...prev, nueva]);
        }
        onClose();
    }

    return (
        <div className="formulario-meta">
            <div className="formulario-meta-header">
                <h2>{metaEditar ? 'Editar Meta' : 'Nueva Meta'}</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>

            <label>Nombre de la Meta</label>
            <input type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder="EJ: Iphone 16" />

            <label>Monto objetivo</label>
            <input type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0" />

            <label>Monto Actual</label>
            <input type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0" />

            <label>Fecha Objetivo</label>
            <input type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />

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
            <button onClick={guardar}>{metaEditar ? 'Guardar Cambios' : 'Crear Meta'}</button>
        </div>
    );
}

export default FormularioMeta;