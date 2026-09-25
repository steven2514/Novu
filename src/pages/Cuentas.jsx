import { useState, useMemo } from "react";
import Modal from '../components/Modal/Modal';
import './Cuentas.css';
import { supabase } from '../supabase';
import FormularioCuenta from "../components/FormularioCuenta/FormularioCuenta";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';
import { useIdioma } from '../i18n/idioma';
import { useToast } from '../Context/ToastContext';
import { useConfirmar } from '../Context/confirmar';

const TIPO_ICONO = { debito: 'landmark', ahorros: 'piggy-bank', credito: 'credit-card', efectivo: 'wallet' };

// Color de respaldo por tipo, usado cuando la cuenta no tiene un
// color propio asignado (tanto en la barra de patrimonio como en
// el degradado de la tarjeta).
const TIPO_COLOR = { debito: '#0B5E66', ahorros: '#1F7A4D', credito: '#FF6B4A', efectivo: '#E39A2D' };

function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ultimosDigitos(cuenta) {
    const fuente = cuenta.numero || cuenta.id || '0000';
    const soloDigitos = String(fuente).replace(/\D/g, '') || '0000';
    return soloDigitos.slice(-4).padStart(4, '0');
}

function Cuentas({ cuentas = [], setCuentas, sesion, abrirModalTransferencia }) {

    const { mostrarTour, cerrarTour } = useTour('cuentas', sesion);
    const { t } = useIdioma();
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();
    const tipoCuenta = (tipo) => (tipo ? t(`cuentas.tipos.${tipo}`) : t('comun.cuenta'));

    const [modalVisible, setModalVisible] = useState(false);
    const [cuentaEditar, setCuentaEditar] = useState(null);

    // Las cuentas de crédito representan deuda; el resto son activos.
    const cuentasActivos = useMemo(() => cuentas.filter(c => c.tipo !== 'credito'), [cuentas]);
    const cuentasDeuda = useMemo(() => cuentas.filter(c => c.tipo === 'credito'), [cuentas]);

    const totalActivos = useMemo(() => cuentasActivos.reduce((acc, c) => acc + Number(c.saldo || 0), 0), [cuentasActivos]);
    const totalDeuda = useMemo(() => cuentasDeuda.reduce((acc, c) => acc + Math.abs(Number(c.saldo || 0)), 0), [cuentasDeuda]);
    const patrimonioNeto = totalActivos - totalDeuda;

    const segmentos = useMemo(() => {
        if (totalActivos <= 0) return [];
        return cuentasActivos
            .filter(c => Number(c.saldo) > 0)
            .map(c => ({
                id: c.id,
                nombre: c.nombre,
                color: c.color || TIPO_COLOR[c.tipo] || '#94A3B8',
                porcentaje: (Number(c.saldo) / totalActivos) * 100
            }));
    }, [cuentasActivos, totalActivos]);

    function abrirEdicion(cuenta) {
        setCuentaEditar(cuenta);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setCuentaEditar(null);
    }

    async function eliminarCuenta(cuenta) {
        const aceptado = await confirmar({
            titulo: t('confirmar.eliminarCuenta', { nombre: cuenta.nombre }),
            mensaje: t('confirmar.eliminarCuentaTexto'),
        });
        if (!aceptado) return;
        const { error } = await supabase.from('cuentas').delete().eq('id', cuenta.id);
        if (error) { mostrarToast(t('confirmar.noSePudoEliminar'), 'error'); return; }
        setCuentas(prev => prev.filter(c => c.id !== cuenta.id));
        mostrarToast(t('confirmar.eliminado'), 'exito');
    }

    return (
        <div className="cuentas-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('cuentas.tour1Titulo'), texto: t('cuentas.tour1Texto') },
                { titulo: t('cuentas.tour2Titulo'), texto: t('cuentas.tour2Texto') }
            ]} />}

            <div className="cuentas-header">
                <div>
                    <p className="overline">{t('cuentas.overline')}</p>
                    <h1>{t('cuentas.titulo')}</h1>
                    <p>{t('cuentas.subtitulo')}</p>
                </div>
                <div className="header-acciones">
                    <button className="btn-pildora-secundario" onClick={() => abrirModalTransferencia()}><Icon name="arrow-left-right" size={16} /> {t('comun.transferir')}</button>
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(cuentas, 'cuentas')}><Icon name="download" size={16} /> {t('comun.exportar')}</button>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}><Icon name="plus" size={16} /> {t('cuentas.nuevaCuenta')}</button>
                </div>
            </div>

            <div className="resumen-patrimonio">
                <div className="resumen-metricas">
                    <div className="resumen-metrica">
                        <span className="resumen-label">{t('cuentas.patrimonio')}</span>
                        <span className="resumen-valor">${formatoMoneda(patrimonioNeto)}</span>
                    </div>
                    <div className="resumen-metrica">
                        <span className="resumen-label">{t('cuentas.totalActivos')}</span>
                        <span className="resumen-valor resumen-valor-activos">${formatoMoneda(totalActivos)}</span>
                        <span className="resumen-conteo">{t('comun.cuentas', { n: cuentasActivos.length })}</span>
                    </div>
                    <div className="resumen-metrica">
                        <span className="resumen-label">{t('cuentas.totalDeuda')}</span>
                        <span className="resumen-valor resumen-valor-deuda">${formatoMoneda(totalDeuda)}</span>
                        <span className="resumen-conteo">{t('comun.cuentas', { n: cuentasDeuda.length })}</span>
                    </div>
                </div>

                {segmentos.length > 0 && (
                    <>
                        <div className="resumen-barra">
                            {segmentos.map(seg => (
                                <div
                                    key={seg.id}
                                    className="resumen-segmento"
                                    style={{ width: `${seg.porcentaje}%`, background: seg.color }}
                                    title={`${seg.nombre} · ${seg.porcentaje.toFixed(0)}%`}
                                />
                            ))}
                        </div>
                        <div className="resumen-leyenda">
                            {segmentos.map(seg => (
                                <span key={seg.id} className="resumen-leyenda-item">
                                    <i style={{ background: seg.color }} />
                                    {seg.nombre} <b>{seg.porcentaje.toFixed(0)}%</b>
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {cuentas.length === 0 ? (
                <div className="seccion-vacia">
                    <p>{t('cuentas.vacioTitulo')}</p>
                    <p>{t('cuentas.vacioTexto')}</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}><Icon name="plus" size={16} /> {t('cuentas.crearCuenta')}</button>
                </div>
            ) : (
                <div className="cuentas-lista">
                    {cuentas.map((cuenta) => {
                        // El color de la tarjeta sale del color elegido al crear la
                        // cuenta; si no tiene uno propio, se usa el color del tipo.
                        const color = cuenta.color || TIPO_COLOR[cuenta.tipo] || '#0B5E66';

                        return (
                            <div
                                key={cuenta.id}
                                className="cuenta-tarjeta"
                                style={{ '--color': color }}
                            >
                                <div className="cuenta-tarjeta-brillo" aria-hidden="true" />

                                <div className="cuenta-tarjeta-top">
                                    <span className="cuenta-etiqueta">{tipoCuenta(cuenta.tipo)}</span>
                                    <div className="cuenta-tarjeta-acciones">
                                        <button className="cuenta-icono-accion" title={t('comun.editar')} onClick={() => abrirEdicion(cuenta)}>
                                            <Icon name="pencil" size={14} />
                                        </button>
                                        <button className="cuenta-icono-accion" title={t('comun.eliminar')} onClick={() => eliminarCuenta(cuenta)}>
                                            <Icon name="trash-2" size={14} />
                                        </button>
                                    </div>
                                    <div className="cuenta-icono-tipo">
                                        <Icon name={TIPO_ICONO[cuenta.tipo] || 'wallet'} size={18} />
                                    </div>
                                </div>

                                <div className="cuenta-tarjeta-info">
                                    <p className="cuenta-nombre">{cuenta.nombre}</p>
                                    <p className="cuenta-banco">{cuenta.banco || tipoCuenta(cuenta.tipo)}</p>
                                </div>

                                <div className="cuenta-tarjeta-medio">
                                    <div className="cuenta-chip">
                                        <Icon name="wifi" size={14} />
                                    </div>
                                    <span className="cuenta-numero">•••• •••• •••• {ultimosDigitos(cuenta)}</span>
                                </div>

                                <div className="cuenta-tarjeta-bottom">
                                    <div className="cuenta-saldo-bloque">
                                        <span className="cuenta-saldo-label">{t('cuentas.saldo')}</span>
                                        <span className="cuenta-saldo">${formatoMoneda(cuenta.saldo)}</span>
                                    </div>
                                    <button
                                        className="cuenta-btn-transferir"
                                        onClick={() => abrirModalTransferencia(cuenta)}
                                    >
                                        <Icon name="arrow-left-right" size={14} /> {t('comun.transferir')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal visible={modalVisible} onClose={cerrarModal}>
                <FormularioCuenta setCuenta={setCuentas} onClose={cerrarModal} cuentaEditar={cuentaEditar} />
            </Modal>
        </div>
    );
}

export default Cuentas;