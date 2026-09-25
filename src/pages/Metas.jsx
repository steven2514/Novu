import { useState } from "react";
import './Metas.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioMeta from '../components/FormularioMeta/FormularioMeta';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';
import { parseFecha } from '../utils/fechas';
import { useIdioma, traducir, localeActual } from '../i18n/idioma';
import { useToast } from '../Context/ToastContext';
import { useConfirmar } from '../Context/confirmar';

const COLOR_POR_DEFECTO = '#0B5E66';
// "Dic 2026" / "Dec 2026" según el idioma activo
function mesYAnio(fecha) {
    const d = parseFecha(fecha);
    if (!d) return traducir('comun.sinFecha');
    const mes = d.toLocaleDateString(localeActual(), { month: 'short' }).replace('.', '');
    return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${d.getFullYear()}`;
}

function formatoPesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function diasHasta(fecha) {
    const objetivo = parseFecha(fecha);
    if (!objetivo) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

function textoPlazo(dias) {
    if (dias === null) return traducir('metas.sinFechaLimite');
    if (dias < 0) return traducir('metas.vencido');
    if (dias === 0) return traducir('metas.venceHoy');
    if (dias < 60) return traducir('metas.faltanDias', { n: dias });
    return traducir('metas.faltanMeses', { n: Math.round(dias / 30) });
}

function Metas({ metas, setMetas, sesion }) {

    const { mostrarTour, cerrarTour } = useTour('metas', sesion);
    const { t } = useIdioma();
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();
    const [modalVisible, setModalVisible] = useState(false);
    const [metaEditar, setMetaEditar] = useState(null);

    const totalAhorrado = metas.reduce((acc, m) => acc + Number(m.monto_actual || 0), 0);
    const totalObjetivo = metas.reduce((acc, m) => acc + Number(m.monto_objetivo || 0), 0);
    const progresoGeneral = totalObjetivo > 0 ? Math.min((totalAhorrado / totalObjetivo) * 100, 100) : 0;
    const metasCumplidas = metas.filter(m => Number(m.monto_actual) >= Number(m.monto_objetivo) && Number(m.monto_objetivo) > 0).length;

    function abrirEdicion(meta) {
        setMetaEditar(meta);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setMetaEditar(null);
    }

    async function eliminarMeta(meta) {
        const aceptado = await confirmar({
            titulo: t('confirmar.eliminarMeta', { nombre: meta.nombre_meta }),
            mensaje: t('confirmar.eliminarMetaTexto'),
        });
        if (!aceptado) return;
        const { error } = await supabase.from('metas').delete().eq('id', meta.id);
        if (error) { mostrarToast(t('confirmar.noSePudoEliminar'), 'error'); return; }
        setMetas(prev => prev.filter(m => m.id !== meta.id));
        mostrarToast(t('confirmar.eliminado'), 'exito');
    }

    return (
        <div className="metas-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('metas.tour1Titulo'), texto: t('metas.tour1Texto') },
                { titulo: t('metas.tour2Titulo'), texto: t('metas.tour2Texto') }
            ]} />}

            <div className="metas-header">
                <div>
                    <p className="overline">{t('metas.overline')}</p>
                    <h1>{t('metas.titulo')}</h1>
                    <p>{t('metas.subtitulo')}</p>
                </div>
                <div className="header-acciones">
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(metas, 'metas')}>
                        <Icon name="download" size={16} /> {t('comun.exportar')}
                    </button>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>
                        <Icon name="plus" size={16} /> {t('metas.nuevaMeta')}
                    </button>
                </div>
            </div>

            {metas.length > 0 && (
                <div className="metas-resumen">
                    <div className="metas-resumen-principal">
                        <span className="metas-resumen-label">{t('metas.progresoGeneral')}</span>
                        <div className="metas-resumen-fila">
                            <strong>{Math.round(progresoGeneral)}%</strong>
                            <span>{t('metas.deTotal', { actual: formatoPesos(totalAhorrado), objetivo: formatoPesos(totalObjetivo) })}</span>
                        </div>
                        <div className="metas-resumen-barra"><span style={{ width: `${progresoGeneral}%` }} /></div>
                    </div>
                    <div className="metas-resumen-dato">
                        <span className="metas-resumen-label">{t('metas.activas')}</span>
                        <strong>{metas.length - metasCumplidas}</strong>
                    </div>
                    <div className="metas-resumen-dato">
                        <span className="metas-resumen-label">{t('metas.cumplidas')}</span>
                        <strong>{metasCumplidas}</strong>
                    </div>
                    <div className="metas-resumen-dato">
                        <span className="metas-resumen-label">{t('metas.porAhorrar')}</span>
                        <strong>{formatoPesos(Math.max(totalObjetivo - totalAhorrado, 0))}</strong>
                    </div>
                </div>
            )}

            {metas.length === 0 ? (
                <div className="seccion-vacia">
                    <p>{t('metas.vacioTitulo')}</p>
                    <p>{t('metas.vacioTexto')}</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>
                        <Icon name="plus" size={16} /> {t('metas.crearMeta')}
                    </button>
                </div>
            ) : (
                <div className="metas-lista">
                    {metas.map((meta, index) => {
                        const objetivo = Number(meta.monto_objetivo) || 0;
                        const actual = Number(meta.monto_actual) || 0;
                        const porcentaje = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0;
                        const cumplida = objetivo > 0 && actual >= objetivo;
                        const color = meta.color || COLOR_POR_DEFECTO;
                        const dias = diasHasta(meta.fecha_objetivo);

                        return (
                            <article key={meta.id ?? index} className="meta-tarjeta" style={{ '--color': color }}>
                                <div className="meta-portada">
                                    <span className="meta-chip">
                                        <Icon name="calendar-days" size={13} />
                                        {mesYAnio(meta.fecha_objetivo)}
                                    </span>
                                    <div className="meta-portada-acciones">
                                        <button title={t('comun.editar')} onClick={() => abrirEdicion(meta)}>
                                            <Icon name="pencil" size={14} />
                                        </button>
                                        <button title={t('comun.eliminar')} onClick={() => eliminarMeta(meta)}>
                                            <Icon name="trash-2" size={14} />
                                        </button>
                                    </div>
                                    <span className="meta-portada-icono">
                                        <Icon name={cumplida ? 'trophy' : meta.icono} size={30} />
                                    </span>
                                </div>

                                <div className="meta-cuerpo">
                                    <div className="meta-fila">
                                        <span className={`meta-estado ${cumplida ? 'meta-estado-cumplida' : ''}`}>
                                            {cumplida ? t('metas.cumplida') : textoPlazo(dias)}
                                        </span>
                                        <span className="meta-porcentaje">{Math.round(porcentaje)}%</span>
                                    </div>

                                    <h3 className="meta-nombre">{meta.nombre_meta}</h3>

                                    <div className="meta-barra-fondo">
                                        <div className="meta-barra-relleno" style={{ width: `${porcentaje}%` }}></div>
                                    </div>

                                    <div className="meta-pie">
                                        <div>
                                            <small>{t('metas.ahorrado')}</small>
                                            <p><strong>{formatoPesos(actual)}</strong> / {formatoPesos(objetivo)}</p>
                                        </div>
                                        <button className="btn-agregar-dinero" onClick={() => abrirEdicion(meta)}>
                                            <Icon name="plus" size={15} /> {t('metas.abonar')}
                                        </button>
                                    </div>
                                </div>
                            </article>
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
