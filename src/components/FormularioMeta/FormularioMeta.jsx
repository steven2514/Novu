import { useState, useEffect } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import { aInputFecha } from '../../utils/fechas';
import './FormularioMeta.css';
import { Icon, ICONOS_META } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';
import { useIdioma } from '../../i18n/idioma';

function FormularioMeta({ setMetas, onClose, sesion, metaEditar }) {
    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState();
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [icono, setIcono] = useState('');
    const [color, setColor] = useState('');
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const ICONOS = ICONOS_META;
    const COLORES = PALETA_ELEMENTOS;

    useEffect(() => {
        if (metaEditar) {
            setNombreMeta(metaEditar.nombre_meta);
            setMontoObjetivo(metaEditar.monto_objetivo);
            setMontoActual(metaEditar.monto_actual);
            setFechaObjetivo(aInputFecha(metaEditar.fecha_objetivo));
            setIcono(metaEditar.icono);
            setColor(metaEditar.color);
        }
    }, [metaEditar]);

    async function guardar() {
        setGuardando(true);
        if (metaEditar) {
            const { error } = await supabase.from('metas').update({ nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color }).eq('id', metaEditar.id);
            if (error) { mostrarToast(t('formularios.metaNoActualizada'), 'error'); setGuardando(false); return; }
            setMetas(prev => prev.map(m => m.id === metaEditar.id ? { ...m, nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual, fecha_objetivo: fechaObjetivo, icono, color } : m));
            mostrarToast(t('formularios.metaActualizada'), 'exito');
        } else {
            const nueva = { nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual || 0, fecha_objetivo: fechaObjetivo, icono, color, user_id: sesion.user.id };
            // .select().single() devuelve la fila creada con su id: sin él, editar,
            // borrar o aportar a la meta antes de recargar no hacía nada.
            const { data, error } = await supabase.from('metas').insert([nueva]).select().single();
            if (error) { mostrarToast(t('formularios.metaNoCreada'), 'error'); setGuardando(false); return; }
            setMetas(prev => [...prev, data]);
            mostrarToast(t('formularios.metaCreada'), 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-meta">
            <div className="modal-kaipo-header">
                <h2>{metaEditar ? t('formularios.editarMeta') : t('formularios.nuevaMeta')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            <div className="modal-kaipo-body">
                <div className="icono-selector-grid">
                    {ICONOS.map((ic) => (
                        <div key={ic} className={`icono-selector-opcion ${icono === ic ? 'seleccionado' : ''}`} onClick={() => setIcono(ic)}>
                            <Icon name={ic} />
                        </div>
                    ))}
                </div>

                <label>{t('comun.nombre')}</label>
                <input className="campo-pildora" type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder={t('agregar.ejMeta')} />

                <div className="formulario-meta-fila-doble">
                    <div>
                        <label>{t('agregar.objetivo')}</label>
                        <input className="campo-pildora" type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label>{t('agregar.fechaLimite')}</label>
                        <input className="campo-pildora" type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />
                    </div>
                </div>

                <label>{t('formularios.montoActual')}</label>
                <input className="campo-pildora" type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0" />

                <label>{t('comun.color')}</label>
                <div className="color-selector-grid">
                    {COLORES.map((c) => (
                        <div key={c} className={`color-selector-opcion ${color === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                    ))}
                </div>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : metaEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default FormularioMeta;