import { useEffect, useState } from "react";
import './FormularioTarea.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';
import { useIdioma } from '../../i18n/idioma';
import { aInputFecha } from '../../utils/fechas';

function FormularioTarea({ setTareas, onClose, sesion, tareaEditar }) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState('Tarea');
    const [prioridad, setPrioridad] = useState('media');
    const [fechaLimite, setFechaLimite] = useState('');
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();

    useEffect(() => {
        if (tareaEditar) {
            setTitulo(tareaEditar.titulo);
            setDescripcion(tareaEditar.descripcion || '');
            setCategoria(tareaEditar.categoria);
            setPrioridad(tareaEditar.prioridad);
            setFechaLimite(aInputFecha(tareaEditar.fecha_limite));
        }
    }, [tareaEditar]);

    async function guardar() {
        if (titulo.trim() === '') return;
        setGuardando(true);
        if (tareaEditar) {
            const { error } = await supabase.from('tareas').update({ titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite }).eq('id', tareaEditar.id);
            if (error) { mostrarToast(t('formularios.tareaNoActualizada'), 'error'); setGuardando(false); return; }
            setTareas(prev => prev.map(tarea => tarea.id === tareaEditar.id ? { ...tarea, titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite } : tarea));
            mostrarToast(t('formularios.tareaActualizada'), 'exito');
        } else {
            const nuevaTarea = { titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite, completada: false, user_id: sesion.user.id };
            const { data, error } = await supabase.from('tareas').insert([nuevaTarea]).select().single();
            if (error) { mostrarToast(t('formularios.tareaNoCreada'), 'error'); setGuardando(false); return; }
            setTareas(prev => [...prev, data]);
            mostrarToast(t('formularios.tareaCreada'), 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-tarea">
            <div className="formulario-tarea-header">
                <h2>{tareaEditar ? t('formularios.editarTarea') : t('formularios.nuevaTarea')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>
            <label>{t('formularios.tituloTarea')}</label>
            <input type="text" placeholder={t('formularios.ejTarea')} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <label>{t('formularios.descripcion')}</label>
            <textarea placeholder={t('formularios.detalles')} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <label>{t('comun.categoria')}</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="Actividad Diaria">{t('tareas.categorias.Actividad Diaria')}</option>
                <option value="Tarea">{t('tareas.categorias.Tarea')}</option>
                <option value="Compromiso">{t('tareas.categorias.Compromiso')}</option>
            </select>
            <label>{t('formularios.prioridad')}</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="alta">{t('tareas.prioridades.alta')}</option>
                <option value="media">{t('tareas.prioridades.media')}</option>
                <option value="baja">{t('tareas.prioridades.baja')}</option>
            </select>
            <label>{t('formularios.fechaLimiteOpcional')}</label>
            <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
            <button className="btn-crear-tarea" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : tareaEditar ? t('comun.guardarCambios') : t('formularios.crearTarea')}
            </button>
        </div>
    );
}

export default FormularioTarea;