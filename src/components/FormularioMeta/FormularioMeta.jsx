import { useState, useEffect } from "react";
import './FormularioMeta.css';
import { Icon, ICONOS_META } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';

function FormularioMeta({ setMetas, onClose, sesion, metaEditar }) {
    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState();
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [icono, setIcono] = useState('');
    const [color, setColor] = useState('');
    const [guardando, setGuardando] = useState(false);
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

    async function guardar() {
        setGuardando(true);
        if (metaEditar) {
            const { error } = await supabase.from('metas').update({ nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color }).eq('id', metaEditar.id);
            if (error) { mostrarToast('No se pudo actualizar la meta', 'error'); setGuardando(false); return; }
            setMetas(prev => prev.map(m => m.id === metaEditar.id ? { ...m, nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color } : m));
            mostrarToast('Meta actualizada correctamente', 'exito');
        } else {
            const nueva = { nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual || 0, fecha_objetivo: fechaObjetivo, icono, color, user_id: sesion.user.id };
            const { error } = await supabase.from('metas').insert([nueva]);
            if (error) { mostrarToast('No se pudo crear la meta', 'error'); setGuardando(false); return; }
            setMetas(prev => [...prev, nueva]);
            mostrarToast('Meta creada correctamente', 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-meta">
            <div className="modal-kaipo-header">
                <h2>{metaEditar ? 'Editar Meta' : 'Nueva meta'}</h2>
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
                <input className="campo-pildora" type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder="Ej: Iphone 16" />

                <div className="formulario-meta-fila-doble">
                    <div>
                        <label>Objetivo</label>
                        <input className="campo-pildora" type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label>Fecha límite</label>
                        <input className="campo-pildora" type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />
                    </div>
                </div>

                <label>Monto actual</label>
                <input className="campo-pildora" type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0" />

                <label>Color</label>
                <div className="color-selector-grid">
                    {COLORES.map((c) => (
                        <div key={c} className={`color-selector-opcion ${color === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                    ))}
                </div>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : metaEditar ? 'Guardar Cambios' : 'Guardar'}
            </button>
        </div>
    );
}

export default FormularioMeta;