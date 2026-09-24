import { useState } from "react";
import { formatearFecha } from '../utils/fechas';
import './Aprendizaje.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioTarea from '../components/FormularioTarea/FormularioTarea';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { useIdioma } from '../i18n/idioma';

// Cada filtro y la categoría de la base de datos que muestra (null = todas)
const FILTROS = [
    { id: 'todas', categoria: null },
    { id: 'diarias', categoria: 'Actividad Diaria' },
    { id: 'tareas', categoria: 'Tarea' },
    { id: 'compromisos', categoria: 'Compromiso' },
];

function Aprendizaje({ tareas, setTareas, sesion }) {

    const [tareaEditar, setTareaEditar] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filtro, setFiltro] = useState('todas');
    const { mostrarTour, cerrarTour } = useTour('aprendizaje', sesion);
    const { t } = useIdioma();

    const pendientes = tareas.filter(tarea => !tarea.completada).length;
    const completadas = tareas.filter(tarea => tarea.completada).length;
    const total = tareas.length;
    const avance = total > 0 ? Math.round((completadas / total) * 100) : 0;

    const categoriaFiltro = FILTROS.find(f => f.id === filtro)?.categoria;
    const tareasFiltradas = tareas.filter(tarea => !categoriaFiltro || tarea.categoria === categoriaFiltro);

    function toggleCompletada(id) {
        setTareas(prev => prev.map(tarea => tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea));
    }

    function eliminarTarea(id) {
        supabase.from('tareas').delete().eq('id', id).then(() => { });
        setTareas(prev => prev.filter(tarea => tarea.id !== id));
    }

    function abrirNueva() {
        setTareaEditar(null);
        setModalVisible(true);
    }

    return (
        <div className="aprendizaje-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('tareas.tour1Titulo'), texto: t('tareas.tour1Texto') },
                { titulo: t('tareas.tour2Titulo'), texto: t('tareas.tour2Texto') }
            ]} />}
            <div className="aprendizaje-header">
                <div>
                    <p className="overline">{t('tareas.overline')}</p>
                    <h1>{t('tareas.titulo')}</h1>
                    <p>{t('tareas.subtitulo')}</p>
                </div>
                <button className="btn-pildora-acento" onClick={abrirNueva}>
                    <Icon name="plus" size={16} /> {t('tareas.nueva')}
                </button>
            </div>

            <div className="aprendizaje-resumen">
                <div className="resumen-caja">
                    <span className="resumen-caja-icono icono-pendiente"><Icon name="circle-dashed" size={20} /></span>
                    <div>
                        <p>{t('tareas.pendientes')}</p>
                        <h2>{pendientes}</h2>
                    </div>
                </div>
                <div className="resumen-caja">
                    <span className="resumen-caja-icono icono-completada"><Icon name="circle-check" size={20} /></span>
                    <div>
                        <p>{t('tareas.completadas')}</p>
                        <h2>{completadas}</h2>
                    </div>
                </div>
                <div className="resumen-caja resumen-caja-avance">
                    <span className="resumen-caja-icono icono-total"><Icon name="list-checks" size={20} /></span>
                    <div>
                        <p>{t('tareas.avance')}</p>
                        <h2>{avance}%</h2>
                    </div>
                    <div className="resumen-caja-barra"><span style={{ width: `${avance}%` }} /></div>
                </div>
            </div>

            <div className="aprendizaje-lista-card">
                <div className="filtros-tabs">
                    {FILTROS.map(op => (
                        <button
                            key={op.id}
                            className={filtro === op.id ? 'tab-activo' : ''}
                            onClick={() => setFiltro(op.id)}
                        >
                            {t(`tareas.filtros.${op.id}`)}
                        </button>
                    ))}
                </div>

                {tareasFiltradas.length === 0 ? (
                    <div className="tareas-vacio">
                        <div className="check-circulo"><Icon name="circle-check" size={26} /></div>
                        <p className="vacio-titulo">{t('tareas.vacioTitulo')}</p>
                        <p className="vacio-subtitulo">{t('tareas.vacioTexto')}</p>
                        <button className="btn-pildora-acento" onClick={abrirNueva}>
                            <Icon name="plus" size={16} /> {t('tareas.crear')}
                        </button>
                    </div>
                ) : (
                    <div className="tareas-lista">
                        {tareasFiltradas.map((tarea) => (
                            <div key={tarea.id} className={`tarea-item ${tarea.completada ? 'tarea-completada' : ''}`}>
                                <button
                                    className="check-tarea"
                                    onClick={() => toggleCompletada(tarea.id)}
                                    aria-label={tarea.completada ? t('tareas.marcarPendiente') : t('tareas.marcarCompletada')}
                                >
                                    {tarea.completada && <Icon name="check" size={14} />}
                                </button>
                                <div className="tarea-info">
                                    <p className="tarea-titulo">{tarea.titulo}</p>
                                    {tarea.descripcion && <p className="tarea-descripcion">{tarea.descripcion}</p>}
                                    <div className="tarea-meta">
                                        <span className="tarea-categoria">{t(`tareas.categorias.${tarea.categoria}`)}</span>
                                        <span className={`tarea-prioridad prioridad-${tarea.prioridad}`}>
                                            <Icon name="flag" size={12} /> {t(`tareas.prioridades.${tarea.prioridad}`)}
                                        </span>
                                        {tarea.fecha_limite && (
                                            <span className="tarea-fecha">
                                                <Icon name="calendar-days" size={12} />
                                                {formatearFecha(tarea.fecha_limite, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="tarea-acciones">
                                    <button className="btn-icono" title={t('comun.editar')} onClick={() => { setTareaEditar(tarea); setModalVisible(true); }}>
                                        <Icon name="pencil" size={15} />
                                    </button>
                                    <button className="btn-fila-eliminar" title={t('comun.eliminar')} onClick={() => eliminarTarea(tarea.id)}>
                                        <Icon name="trash-2" size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setTareaEditar(null); }}>
                <FormularioTarea
                    setTareas={setTareas}
                    onClose={() => { setModalVisible(false); setTareaEditar(null); }}
                    sesion={sesion}
                    tareaEditar={tareaEditar}
                />
            </Modal>
        </div>
    );
}

export default Aprendizaje;
