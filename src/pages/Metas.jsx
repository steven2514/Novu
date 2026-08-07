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

    function abrirEdicion(meta) {
        setMetaEditar(meta);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setMetaEditar(null);
    }

    return (
        <div className="metas-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus metas de ahorro', texto: 'Crea objetivos como "Viaje" o "iPhone 16" y ahorra hacia ellos.' },
                { titulo: 'Transfiere dinero', texto: 'Usa la opción de Transferir en Cuentas para abonar a tus metas.' }
            ]} />}
            <div className="metas-header">
                <div>
                    <h1>Metas de ahorro</h1>
                    <p>Alcanza tus objetivos de ahorro</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(metas, 'metas')}>⬇ Exportar</button>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Nueva meta</button>
                </div>
            </div>

            {metas.length === 0 ? (
                <div className="seccion-vacia">
                    <p>No hay metas configuradas</p>
                    <p>Crea tu primera meta de ahorro</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Crear meta</button>
                </div>
            ) : (
                <div className="metas-lista">
                    {metas.map((meta, index) => {
                        const porcentaje = Math.min((Number(meta.monto_actual) / Number(meta.monto_objetivo)) * 100, 100);
                        return (
                            <div key={index} className="meta-tarjeta">
                                <div className="meta-tarjeta-top">
                                    <div className="icono-circulo" style={{ backgroundColor: (meta.color || '#6C63FF') + '22' }}>
                                        <Icon name={meta.icono} size={20} style={{ color: meta.color || '#6C63FF' }} />
                                    </div>
                                    <div className="meta-titulo-bloque">
                                        <p className="meta-nombre">{meta.nombre_meta}</p>
                                        <p className="meta-fecha">Fecha límite: {meta.fecha_objetivo}</p>
                                    </div>
                                    <button className="btn-fila-eliminar" title="Eliminar" onClick={() => {
                                        supabase.from('metas').delete().eq('id', meta.id).then(() => { });
                                        setMetas(prev => prev.filter(m => m.id !== meta.id));
                                    }}>
                                        <Icon name="trash-2" size={16} />
                                    </button>
                                </div>

                                <div className="meta-barra-fondo">
                                    <div className="meta-barra-relleno" style={{ width: `${porcentaje}%`, backgroundColor: meta.color || '#6C63FF' }}></div>
                                </div>

                                <p className="meta-monto-texto">
                                    <strong>${Number(meta.monto_actual).toLocaleString('es-CO')}</strong> de ${Number(meta.monto_objetivo).toLocaleString('es-CO')}
                                </p>

                                <button className="btn-agregar-dinero" onClick={() => abrirEdicion(meta)}>Agregar dinero</button>
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