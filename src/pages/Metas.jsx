import { useState } from "react";
import './Metas.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioMeta from '../components/FormularioMeta/FormularioMeta';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';

function Metas({ metas, setMetas, sesion }) {

    const { mostrarTour, cerrarTour } = useTour('metas', sesion);
    const [modalVisible, setModalVisible] = useState(false);
    const [metaEditar, setMetaEditar] = useState(null);

    const totalObjetivo = metas.reduce((acc, m) => acc + Number(m.monto_objetivo), 0);
    const totalAhorrado = metas.reduce((acc, m) => acc + Number(m.monto_actual), 0);
    const progresoGeneral = totalObjetivo > 0 ? (totalAhorrado / totalObjetivo) * 100 : 0;

    function abrirEdicion(meta) {
        setMetaEditar(meta);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setMetaEditar(null);
    }

    return (
        <div className="metas-page">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus metas de ahorro', texto: 'Crea objetivos como "Viaje" o "iPhone 16" y ahorra hacia ellos.' },
                { titulo: 'Transfiere dinero', texto: 'Usa la opción de Transferir en Cuentas para abonar a tus metas.' }
            ]} />}
            <div className="metas-header">
                <div>
                    <h1>Metas Inteligentes</h1>
                    <p>Alcanza tus objetivos de ahorro</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-exportar" onClick={() => exportarCSV(metas, 'metas')}>⬇ Exportar</button>
                    <button onClick={() => setModalVisible(true)}>+ Nueva Meta</button>
                </div>
            </div>

            {metas.length > 0 && (
                <div className="resumen-metas">
                    <div className="resumen-item">
                        <p>Total Objetivo</p>
                        <h2>${totalObjetivo.toLocaleString('es-CO')}</h2>
                    </div>
                    <div className="resumen-item">
                        <p>Total Ahorrado</p>
                        <h2 className="resumen-ahorrado">${totalAhorrado.toLocaleString('es-CO')}</h2>
                    </div>
                    <div className="resumen-item">
                        <p>Progreso General</p>
                        <h2 className="resumen-progreso">{progresoGeneral.toFixed(1)}%</h2>
                    </div>
                    <div className="resumen-barra-fondo">
                        <div className="resumen-barra-relleno" style={{ width: `${progresoGeneral}%` }}></div>
                    </div>
                </div>
            )}

            {metas.length === 0 ? (
                <div className="seccion-vacia">
                    <p>No hay metas configuradas</p>
                    <p>Crea tu primera meta de ahorro</p>
                    <button onClick={() => setModalVisible(true)}>+ Crear Meta</button>
                </div>
            ) : (
                <div className="metas-lista">
                    {metas.map((meta, index) => {
                        const porcentaje = Math.min((Number(meta.monto_actual) / Number(meta.monto_objetivo)) * 100, 100);
                        const faltante = Number(meta.monto_objetivo) - Number(meta.monto_actual);
                        return (
                            <div key={index} className="meta-tarjeta" style={{ borderColor: meta.color }}>
                                <div className="meta-tarjeta-top">
                                    <span className="meta-icono">{meta.icono}</span>
                                    <div className="meta-tarjeta-acciones">
                                        <button className="btn-editar-cuenta" onClick={() => abrirEdicion(meta)}><Icon name="pencil" size={16} /></button>
                                        <button className="btn-eliminar-cuenta" onClick={() => {
                                            supabase.from('metas').delete().eq('id', meta.id).then(() => { });
                                            setMetas(prev => prev.filter(m => m.id !== meta.id));
                                        }}>🗑️</button>
                                    </div>
                                </div>
                                <p className="meta-nombre">{meta.nombre_meta}</p>
                                <p className="meta-subtitulo">Meta de ahorro</p>

                                <div className="meta-progreso-header">
                                    <span>Progreso</span>
                                    <span className="meta-porcentaje" style={{ color: meta.color }}>{porcentaje.toFixed(1)}%</span>
                                </div>
                                <div className="meta-barra-fondo">
                                    <div className="meta-barra-relleno" style={{ width: `${porcentaje}%`, backgroundColor: meta.color }}></div>
                                </div>

                                <div className="meta-detalle-grid">
                                    <div className="meta-detalle-caja">
                                        <p className="meta-detalle-label">Ahorrado</p>
                                        <p className="meta-detalle-valor">${Number(meta.monto_actual).toLocaleString('es-CO')}</p>
                                    </div>
                                    <div className="meta-detalle-caja">
                                        <p className="meta-detalle-label">Objetivo</p>
                                        <p className="meta-detalle-valor">${Number(meta.monto_objetivo).toLocaleString('es-CO')}</p>
                                    </div>
                                </div>

                                {faltante > 0 && (
                                    <div className="meta-faltante">
                                        <span>📈</span>
                                        <div>
                                            <p className="meta-faltante-titulo">Faltan ${faltante.toLocaleString('es-CO')}</p>
                                            <p className="meta-faltante-subtitulo">para alcanzar tu meta</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal visible={modalVisible} onClose={cerrarModal}>
                <FormularioMeta setMetas={setMetas} onClose={cerrarModal} sesion={sesion} metaEditar={metaEditar} />
            </Modal>
        </div>
    );
}

export default Metas;