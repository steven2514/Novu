import { useState } from "react";
import Modal from '../components/Modal/Modal';
import './Cuentas.css';
import { supabase } from '../supabase';
import FormularioCuenta from "../components/FormularioCuenta/FormularioCuenta";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';

const TIPO_LABEL = { debito: 'Débito', credito: 'Crédito', efectivo: 'Efectivo' };
const TIPO_ICONO = { debito: 'landmark', credito: 'credit-card', efectivo: 'wallet' };

function Cuentas({ cuentas = [], setCuentas, sesion, abrirModalTransferencia }) {

    const { mostrarTour, cerrarTour } = useTour('cuentas', sesion);

    const [modalVisible, setModalVisible] = useState(false);
    const [cuentaEditar, setCuentaEditar] = useState(null);
    const balanceTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    function abrirEdicion(cuenta) {
        setCuentaEditar(cuenta);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setCuentaEditar(null);
    }

    return (
        <div className="cuentas-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus cuentas', texto: 'Aquí creas y administras tus cuentas: débito, crédito o efectivo.' },
                { titulo: 'Balance total', texto: 'Suma automática de los saldos de todas tus cuentas.' }
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

            <div className="banner-suma">
                <p>Suma de tus cuentas</p>
                <h2>${balanceTotal.toLocaleString('es-CO')}</h2>
            </div>

            {cuentas.length === 0 ? (
                <div className="cuenta-vacio">
                    <p>No hay cuentas</p>
                    <p>Crea tu primera cuenta para comenzar</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Crear cuenta</button>
                </div>
            ) : (
                <div className="cuentas-lista">
                    {cuentas.map((cuenta, index) => (
                        <div key={index} className="cuenta-tarjeta">
                            <div className="cuenta-tarjeta-izq">
                                <div className="icono-circulo" style={{ backgroundColor: (cuenta.color || '#6C63FF') + '22' }}>
                                    <Icon name={TIPO_ICONO[cuenta.tipo] || 'wallet'} size={20} style={{ color: cuenta.color || '#6C63FF' }} />
                                </div>
                                <div>
                                    <p className="cuenta-nombre">{cuenta.nombre}</p>
                                    <p className="cuenta-tipo-texto">{cuenta.banco || TIPO_LABEL[cuenta.tipo] || 'Cuenta'}</p>
                                </div>
                            </div>
                            <div className="cuenta-tarjeta-der">
                                <span className="cuenta-saldo">${Number(cuenta.saldo).toLocaleString('es-CO')}</span>
                                <button className="btn-fila-eliminar" title="Editar" onClick={() => abrirEdicion(cuenta)}>
                                    <Icon name="pencil" size={16} />
                                </button>
                                <button className="btn-fila-eliminar" title="Eliminar" onClick={() => {
                                    supabase.from('cuentas').delete().eq('id', cuenta.id).then(() => { });
                                    setCuentas(prev => prev.filter(c => c.id !== cuenta.id));
                                }}>
                                    <Icon name="trash-2" size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal visible={modalVisible} onClose={cerrarModal}>
                <FormularioCuenta setCuenta={setCuentas} onClose={cerrarModal} cuentaEditar={cuentaEditar} />
            </Modal>
        </div>
    );
}

export default Cuentas;