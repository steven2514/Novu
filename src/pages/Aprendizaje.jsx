import { useState } from "react";
import { formatearFecha } from '../utils/fechas';
import { VISTAS, enVista, estaAtrasada, pausarCronometro, tareaSiguiente, guardarConRespaldo } from '../utils/tareas';
import './Aprendizaje.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioTarea from '../components/FormularioTarea/FormularioTarea';
import TareaTiempo from '../components/TareaTiempo/TareaTiempo';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { useIdioma } from '../i18n/idioma';
import { useToast } from '../Context/toast';
import { useConfirmar } from '../Context/confirmar';

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
    const [vista, setVista] = useState('todas');
    const { mostrarTour, cerrarTour } = useTour('aprendizaje', sesion);
    const { t } = useIdioma();
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();

    const pendientes = tareas.filter(tarea => !tarea.completada).length;
    const completadas = tareas.filter(tarea => tarea.completada).length;
    const total = tareas.length;
    const avance = total > 0 ? Math.round((completadas / total) * 100) : 0;

    const categoriaFiltro = FILTROS.find(f => f.id === filtro)?.categoria;
    const deLaCategoria = tareas.filter(tarea => !categoriaFiltro || tarea.categoria === categoriaFiltro);
    const tareasFiltradas = deLaCategoria.filter(tarea => enVista(tarea, vista));
    // Número junto a cada vista: lo que falta por hacer en ella
    const pendientesPorVista = Object.fromEntries(VISTAS.map(v => [
        v, deLaCategoria.filter(tarea => !tarea.completada && enVista(tarea, v)).length,
    ]));

    // Cambia una tarea en pantalla y en Supabase. Si falla, vuelve como estaba.
    async function actualizar(tarea, cambios) {
        const anterior = Object.fromEntries(Object.keys(cambios).map(clave => [clave, tarea[clave]]));
        const aplicar = (valores) => setTareas(prev => prev.map(item => item.id === tarea.id ? { ...item, ...valores } : item));
        aplicar(cambios);
        const { error } = await guardarConRespaldo(cambios, (datos) => supabase.from('tareas').update(datos).eq('id', tarea.id));
        if (error) {
            aplicar(anterior);
            mostrarToast(error.code === 'sin-migracion' ? t('tareas.faltaMigracion') : t('errores.tareaEstado'), 'error');
            return false;
        }
        return true;
    }

    async function toggleCompletada(tarea) {
        const completada = !tarea.completada;
        const ahora = new Date();
        const cambios = completada
            // Al terminarla se guarda la hora y se detiene el cronómetro si corría
            ? { completada, completada_en: ahora.toISOString(), ...(tarea.cronometro_desde ? pausarCronometro(tarea, ahora) : {}) }
            : { completada, completada_en: null };
        const ok = await actualizar(tarea, cambios);
        if (ok && completada) await crearSiguiente(tarea, ahora);
    }

    // Una tarea que se repite deja lista la próxima al terminarla
    async function crearSiguiente(tarea, ahora) {
        const siguiente = tareaSiguiente(tarea, ahora);
        if (!siguiente) return;
        // Si ya existe (la marcaste, desmarcaste y volviste a marcar), no se duplica
        const yaExiste = tareas.some(item => item.id !== tarea.id && !item.completada
            && item.titulo === siguiente.titulo && item.repetir === siguiente.repetir
            && String(item.fecha_limite || '').slice(0, 10) === siguiente.fecha_limite);
        if (yaExiste) return;
        const nueva = { ...siguiente, creada_en: ahora.toISOString(), user_id: tarea.user_id ?? sesion.user.id };
        const { data, error } = await guardarConRespaldo(nueva, (datos) => supabase.from('tareas').insert([datos]).select().single());
        if (error) { mostrarToast(t('formularios.tareaNoCreada'), 'error'); return; }
        setTareas(prev => [...prev, data]);
        mostrarToast(t('tareas.siguienteCreada', { fecha: formatearFecha(siguiente.fecha_limite, { day: 'numeric', month: 'long' }) }), 'exito');
    }

    // Empieza o pausa el cronómetro. Solo corre uno a la vez: empezar uno
    // pausa el que estuviera corriendo.
    async function alternarCronometro(tarea) {
        const ahora = new Date();
        if (tarea.cronometro_desde) {
            await actualizar(tarea, pausarCronometro(tarea, ahora));
            return;
        }
        const corriendo = tareas.filter(item => item.id !== tarea.id && item.cronometro_desde && !item.completada);
        await Promise.all(corriendo.map(otra => actualizar(otra, pausarCronometro(otra, ahora))));
        await actualizar(tarea, { cronometro_desde: ahora.toISOString() });
    }

    async function eliminarTarea(tarea) {
        const aceptado = await confirmar({
            titulo: t('confirmar.eliminarTarea'),
            mensaje: t('confirmar.eliminarTareaTexto', { nombre: tarea.titulo }),
        });
        if (!aceptado) return;
        const { error } = await supabase.from('tareas').delete().eq('id', tarea.id);
        if (error) { mostrarToast(t('confirmar.noSePudoEliminar'), 'error'); return; }
        setTareas(prev => prev.filter(item => item.id !== tarea.id));
        mostrarToast(t('confirmar.eliminado'), 'exito');
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
                {/* Cuándo: todas, hoy, esta semana, atrasadas */}
                <div className="filtros-tabs filtros-vistas">
                    {VISTAS.map(v => (
                        <button
                            key={v}
                            className={`${vista === v ? 'tab-activo' : ''} ${v === 'atrasadas' && pendientesPorVista.atrasadas > 0 ? 'tab-alerta' : ''}`}
                            onClick={() => setVista(v)}
                            aria-pressed={vista === v}
                        >
                            {t(`tareas.vistas.${v}`)}
                            {v !== 'todas' && pendientesPorVista[v] > 0 && <span className="tab-contador">{pendientesPorVista[v]}</span>}
                        </button>
                    ))}
                </div>
                {/* Qué: categoría */}
                <div className="filtros-tabs filtros-categorias">
                    {FILTROS.map(op => (
                        <button
                            key={op.id}
                            className={filtro === op.id ? 'tab-activo' : ''}
                            onClick={() => setFiltro(op.id)}
                            aria-pressed={filtro === op.id}
                        >
                            {t(`tareas.filtros.${op.id}`)}
                        </button>
                    ))}
                </div>

                {tareasFiltradas.length === 0 ? (
                    <div className="tareas-vacio">
                        <div className="check-circulo"><Icon name="circle-check" size={26} /></div>
                        <p className="vacio-titulo">{vista === 'todas' ? t('tareas.vacioTitulo') : t('tareas.vistaVacia')}</p>
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
                                    onClick={() => toggleCompletada(tarea)}
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
                                        {tarea.repetir && tarea.repetir !== 'nunca' && (
                                            <span className="tarea-repetir">
                                                <Icon name="repeat" size={12} /> {t(`tareas.repetir.${tarea.repetir}`)}
                                            </span>
                                        )}
                                        {tarea.fecha_limite && (
                                            <span className={`tarea-fecha ${estaAtrasada(tarea) ? 'tarea-fecha-atrasada' : ''}`}>
                                                <Icon name="calendar-days" size={12} />
                                                {formatearFecha(tarea.fecha_limite, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                        <TareaTiempo tarea={tarea} onCronometro={alternarCronometro} />
                                    </div>
                                </div>
                                <div className="tarea-acciones">
                                    <button className="btn-icono" title={t('comun.editar')} onClick={() => { setTareaEditar(tarea); setModalVisible(true); }}>
                                        <Icon name="pencil" size={15} />
                                    </button>
                                    <button className="btn-fila-eliminar" title={t('comun.eliminar')} onClick={() => eliminarTarea(tarea)}>
                                        <Icon name="trash-2" size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal visible={modalVisible} titulo={tareaEditar ? t('formularios.editarTarea') : t('formularios.nuevaTarea')} onClose={() => { setModalVisible(false); setTareaEditar(null); }}>
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
