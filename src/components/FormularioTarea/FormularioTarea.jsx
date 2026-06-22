import { useEffect, useState } from "react";
import './FormularioTarea.css';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';

function FormularioTarea({ setTareas, onClose, sesion, tareaEditar }) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState('Tarea');
    const [prioridad, setPrioridad] = useState('media');
    const [fechaLimite, setFechaLimite] = useState('');
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();

    useEffect(() => {
        if (tareaEditar) {
            setTitulo(tareaEditar.titulo);
            setDescripcion(tareaEditar.descripcion || '');
            setCategoria(tareaEditar.categoria);
            setPrioridad(tareaEditar.prioridad);
            setFechaLimite(tareaEditar.fecha_limite || '');
        }
    }, [tareaEditar]);

    async function guardar() {
        if (titulo.trim() === '') return;
        setGuardando(true);
        if (tareaEditar) {
            const { error } = await supabase.from('tareas').update({ titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite }).eq('id', tareaEditar.id);
            if (error) { mostrarToast('No se pudo actualizar la tarea', 'error'); setGuardando(false); return; }
            setTareas(prev => prev.map(t => t.id === tareaEditar.id ? { ...t, titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite } : t));
            mostrarToast('Tarea actualizada correctamente', 'exito');
        } else {
            const nuevaTarea = { titulo, descripcion, categoria, prioridad, fecha_limite: fechaLimite, completada: false, user_id: sesion.user.id };
            const { error } = await supabase.from('tareas').insert([nuevaTarea]);
            if (error) { mostrarToast('No se pudo crear la tarea', 'error'); setGuardando(false); return; }
            setTareas(prev => [...prev, nuevaTarea]);
            mostrarToast('Tarea creada correctamente', 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-tarea">
            <div className="formulario-tarea-header">
                <h2>{tareaEditar ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                <button className="btn-cerrar-modal" onClick={onClose}>X</button>
            </div>
            <label>Título</label>
            <input type="text" placeholder="Ej: Estudiar matemáticas" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <label>Descripción (opcional)</label>
            <textarea placeholder="Detalles adicionales..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <label>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="Actividad Diaria">Actividad Diaria</option>
                <option value="Tarea">Tarea</option>
                <option value="Compromiso">Compromiso</option>
            </select>
            <label>Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
            </select>
            <label>Fecha límite (opcional)</label>
            <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
            <button className="btn-crear-tarea" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : tareaEditar ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
        </div>
    );
}

export default FormularioTarea;