import { useState, useMemo } from "react";
import Modal from '../components/Modal/Modal';
import './Cuentas.css';
import { supabase } from '../supabase';
import FormularioCuenta from "../components/FormularioCuenta/FormularioCuenta";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';

const TIPO_LABEL = { debito: 'Corriente', ahorros: 'Ahorros', credito: 'Crédito', efectivo: 'Efectivo' };
const TIPO_ICONO = { debito: 'landmark', ahorros: 'piggy-bank', credito: 'credit-card', efectivo: 'wallet' };

// Color de respaldo por tipo, usado cuando la cuenta no tiene un
// color propio asignado (tanto en la barra de patrimonio como en
// el degradado de la tarjeta).
const TIPO_COLOR = { debito: '#4f7cff', ahorros: '#22c55e', credito: '#ef4462', efectivo: '#f2b84b' };

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
                color: c.color || TIPO_COLOR[c.tipo] || '#8b8fa3',
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

    function eliminarCuenta(cuenta) {
        supabase.from('cuentas').delete().eq('id', cuenta.id).then(() => { });
        setCuentas(prev => prev.filter(c => c.id !== cuenta.id));
    }

    return (
        <div className="cuentas-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus cuentas', texto: 'Aquí creas y administras tus cuentas: corriente, ahorros, crédito o efectivo.' },
                { titulo: 'Patrimonio neto', texto: 'Tus activos menos tu deuda, calculado en automático con cada cuenta.' }
            ]} />}

            <div className="cuentas-header">
                <div>
                    <h1>Cuentas</h1>
                    <p>Controla los saldos de tus cuentas</p>
                </div>
                <div className="cuentas-header-botones">
                    <button className="btn-pildora-secundario" onClick={abrirModalTransferencia}>↔ Transferir</button>
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(cuentas, 'cuentas')}>⬇ Exportar</button>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Nueva cuenta</button>
                </div>
            </div>

            <div className="resumen-patrimonio">
                <div className="resumen-metricas">
                    <div className="resumen-metrica">
                        <span className="resumen-label">Patrimonio neto</span>
                        <span className="resumen-valor">${formatoMoneda(patrimonioNeto)}</span>
                    </div>
                    <div className="resumen-metrica">
                        <span className="resumen-label">Total activos</span>
                        <span className="resumen-valor resumen-valor-activos">${formatoMoneda(totalActivos)}</span>
                        <span className="resumen-conteo">{cuentasActivos.length} cuentas</span>
                    </div>
                    <div className="resumen-metrica">
                        <span className="resumen-label">Total deuda</span>
                        <span className="resumen-valor resumen-valor-deuda">${formatoMoneda(totalDeuda)}</span>
                        <span className="resumen-conteo">{cuentasDeuda.length} cuentas</span>
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
                <div className="cuenta-vacio">
                    <p>No hay cuentas</p>
                    <p>Crea tu primera cuenta para comenzar</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Crear cuenta</button>
                </div>
            ) : (
                <div className="cuentas-lista">
                    {cuentas.map((cuenta) => {
                        // El color de la tarjeta sale del color elegido al crear la
                        // cuenta; si no tiene uno propio, se usa el color del tipo.
                        const color = cuenta.color || TIPO_COLOR[cuenta.tipo] || '#6C63FF';

                        return (
                            <div
                                key={cuenta.id}
                                className="cuenta-tarjeta"
                                style={{ '--color': color }}
                            >
                                <div className="cuenta-tarjeta-brillo" aria-hidden="true" />

                                <div className="cuenta-tarjeta-top">
                                    <span className="cuenta-etiqueta">{TIPO_LABEL[cuenta.tipo] || 'Cuenta'}</span>
                                    <div className="cuenta-tarjeta-acciones">
                                        <button className="cuenta-icono-accion" title="Editar" onClick={() => abrirEdicion(cuenta)}>
                                            <Icon name="pencil" size={14} />
                                        </button>
                                        <button className="cuenta-icono-accion" title="Eliminar" onClick={() => eliminarCuenta(cuenta)}>
                                            <Icon name="trash-2" size={14} />
                                        </button>
                                    </div>
                                    <div className="cuenta-icono-tipo">
                                        <Icon name={TIPO_ICONO[cuenta.tipo] || 'wallet'} size={18} />
                                    </div>
                                </div>

                                <div className="cuenta-tarjeta-info">
                                    <p className="cuenta-nombre">{cuenta.nombre}</p>
                                    <p className="cuenta-banco">{cuenta.banco || TIPO_LABEL[cuenta.tipo] || 'Cuenta'}</p>
                                </div>

                                <div className="cuenta-tarjeta-medio">
                                    <div className="cuenta-chip">
                                        <Icon name="wifi" size={14} />
                                    </div>
                                    <span className="cuenta-numero">•••• •••• •••• {ultimosDigitos(cuenta)}</span>
                                </div>

                                <div className="cuenta-tarjeta-bottom">
                                    <div className="cuenta-saldo-bloque">
                                        <span className="cuenta-saldo-label">Saldo</span>
                                        <span className="cuenta-saldo">${formatoMoneda(cuenta.saldo)}</span>
                                    </div>
                                    <button
                                        className="cuenta-btn-transferir"
                                        onClick={() => abrirModalTransferencia(cuenta)}
                                    >
                                        ↔ Transferir
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