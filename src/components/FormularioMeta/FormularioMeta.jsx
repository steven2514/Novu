import { useState, useId } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import { aInputFecha } from '../../utils/fechas';
import './FormularioMeta.css';
import { Icon } from '../Icon';
import { SelectorColor, SelectorIcono } from '../Selectores';
import { ICONOS_META } from '../../utils/iconos';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/toast';
import { useIdioma } from '../../i18n/idioma';

function FormularioMeta({ setMetas, onClose, sesion, metaEditar }) {
    // Ids para conectar cada etiqueta con su campo (accesibilidad)
    const idForm = useId();
    // Al editar, los campos arrancan con los datos de la meta. El formulario
    // vive dentro de un Modal que se desmonta al cerrarse: cada apertura lo
    // inicializa de nuevo, sin necesidad de un useEffect.
    const [nombreMeta, setNombreMeta] = useState(metaEditar?.nombre_meta ?? '');
    const [montoObjetivo, setMontoObjetivo] = useState(metaEditar?.monto_objetivo ?? '');
    const [montoActual, setMontoActual] = useState(metaEditar?.monto_actual);
    const [fechaObjetivo, setFechaObjetivo] = useState(() => aInputFecha(metaEditar?.fecha_objetivo));
    const [icono, setIcono] = useState(metaEditar?.icono ?? '');
    const [color, setColor] = useState(metaEditar?.color ?? '');
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const ICONOS = ICONOS_META;
    const COLORES = PALETA_ELEMENTOS;

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
                <SelectorIcono iconos={ICONOS} valor={icono} onChange={setIcono} />

                <label htmlFor={`${idForm}-1`}>{t('comun.nombre')}</label>
                <input id={`${idForm}-1`} className="campo-pildora" type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder={t('agregar.ejMeta')} />

                <div className="formulario-meta-fila-doble">
                    <div>
                        <label htmlFor={`${idForm}-2`}>{t('agregar.objetivo')}</label>
                        <input id={`${idForm}-2`} className="campo-pildora" type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label htmlFor={`${idForm}-3`}>{t('agregar.fechaLimite')}</label>
                        <input id={`${idForm}-3`} className="campo-pildora" type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />
                    </div>
                </div>

                <label htmlFor={`${idForm}-4`}>{t('formularios.montoActual')}</label>
                <input id={`${idForm}-4`} className="campo-pildora" type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0" />

                <p className="etiqueta-campo">{t('comun.color')}</p>
                <SelectorColor colores={COLORES} valor={color} onChange={setColor} />
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : metaEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default FormularioMeta;