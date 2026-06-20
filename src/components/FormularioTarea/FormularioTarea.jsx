import { useState } from "react";
import './FormularioTarea.css';
import { supabase } from '../../supabase';

function FormularioTarea({ setTareas, onClose }) {

    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState('Tarea');
    const [prioridad, setPrioridad] = useState('media');
    const [fechaLimite, setFechaLimite] = useState('');

    async function guardar() {
        const { data: { user } } = await supabase.auth.getUser();
        if (titulo.trim() === '') return;

        const nuevaTarea = {
            titulo,
            descripcion,
            categoria,
            prioridad,
            fecha_limite: fechaLimite,
            completada: false,
            user_id: user.id
        };

        supabase.from('tareas').insert([nuevaTarea]).then(() => { });
        setTareas(prev => [...prev, nuevaTarea]);
        onClose();
    }

    return (
        <div className="formulario-tarea">
            <div className="formulario-tarea-header">
                <h2>Nueva Tarea</h2>
                <button className="btn-cerrar-modal" onClick={onClose}>X</button>
            </div>

            <label>Título</label>
            <input
                type="text"
                placeholder="Ej: Estudiar matemáticas"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
            />

            <label>Descripción (opcional)</label>
            <textarea
                placeholder="Detalles adicionales..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
            />

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
            <input
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
            />

            <button className="btn-crear-tarea" onClick={guardar}>Crear Tarea</button>
        </div>
    );
}

export default FormularioTarea;