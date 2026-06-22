import { useState } from "react";
import './Aprendizaje.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioTarea from '../components/FormularioTarea/FormularioTarea';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';

function Aprendizaje({ tareas, setTareas, sesion }) {

    const [modalVisible, setModalVisible] = useState(false);
    const [filtro, setFiltro] = useState('Todas');
    const { mostrarTour, cerrarTour } = useTour('aprendizaje', sesion);

    const pendientes = tareas.filter(t => !t.completada).length;
    const completadas = tareas.filter(t => t.completada).length;
    const total = tareas.length;

    const tareasFiltradas = tareas.filter(t => {
        if (filtro === 'Todas') return true;
        if (filtro === 'Diarias') return t.categoria === 'Actividad Diaria';
        if (filtro === 'Tareas') return t.categoria === 'Tarea';
        if (filtro === 'Compromisos') return t.categoria === 'Compromiso';
        return true;
    });

    function toggleCompletada(id) {
        setTareas(prev => prev.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
    }

    function eliminarTarea(id) {
        supabase.from('tareas').delete().eq('id', id).then(() => { });
        setTareas(prev => prev.filter(t => t.id !== id));
    }

    return (
        <div className="aprendizaje-page">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Aprendizaje y Tareas', texto: 'Organiza tus tareas, actividades diarias y compromisos.' },
                { titulo: 'Filtros y prioridad', texto: 'Marca tareas como completadas y filtra por categoría.' }
            ]} />}
            <div className="aprendizaje-header">
                <div>
                    <h1>Aprendizaje y Tareas</h1>
                    <p>Organiza tu día y compromisos</p>
                </div>
                <button onClick={() => setModalVisible(true)}>+ Nueva Tarea</button>
            </div>

            <div className="aprendizaje-resumen">
                <div className="resumen-caja">
                    <span className="icono-circulo morado">○</span>
                    <div>
                        <p>Pendientes</p>
                        <h2>{pendientes}</h2>
                    </div>
                </div>
                <div className="resumen-caja">
                    <span className="icono-circulo verde">✓</span>
                    <div>
                        <p>Completadas</p>
                        <h2 className="texto-verde">{completadas}</h2>
                    </div>
                </div>
                <div className="resumen-caja">
                    <span className="icono-circulo naranja">🔔</span>
                    <div>
                        <p>Total</p>
                        <h2>{total}</h2>
                    </div>
                </div>
            </div>

            <div className="aprendizaje-lista-card">
                <div className="filtros-tabs">
                    {['Todas', 'Diarias', 'Tareas', 'Compromisos'].map(op => (
                        <button
                            key={op}
                            className={filtro === op ? 'tab-activo' : ''}
                            onClick={() => setFiltro(op)}
                        >
                            {op}
                        </button>
                    ))}
                </div>

                {tareasFiltradas.length === 0 ? (
                    <div className="tareas-vacio">
                        <div className="check-circulo">✓</div>
                        <p className="vacio-titulo">No hay tareas registradas</p>
                        <p className="vacio-subtitulo">Comienza a organizar tu día y compromisos</p>
                        <button onClick={() => setModalVisible(true)}>+ Crear Tarea</button>
                    </div>
                ) : (
                    <div className="tareas-lista">
                        {tareasFiltradas.map((tarea) => (
                            <div key={tarea.id} className={`tarea-item ${tarea.completada ? 'tarea-completada' : ''}`}>
                                <button className="check-tarea" onClick={() => toggleCompletada(tarea.id)}>
                                    {tarea.completada ? '✓' : ''}
                                </button>
                                <div className="tarea-info">
                                    <p className="tarea-titulo">{tarea.titulo}</p>
                                    {tarea.descripcion && <p className="tarea-descripcion">{tarea.descripcion}</p>}
                                    <div className="tarea-meta">
                                        <span className="tarea-categoria">{tarea.categoria}</span>
                                        <span className={`tarea-prioridad prioridad-${tarea.prioridad}`}>{tarea.prioridad}</span>
                                        {tarea.fecha_limite && <span className="tarea-fecha">📅 {tarea.fecha_limite}</span>}
                                    </div>
                                </div>
                                <button className="btn-eliminar-tarea" onClick={() => eliminarTarea(tarea.id)}>🗑️</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <FormularioTarea setTareas={setTareas} onClose={() => setModalVisible(false)} />
            </Modal>
        </div>
    );
}

export default Aprendizaje;