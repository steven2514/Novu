import { useState } from "react";
import Modal from '../components/Modal/Modal';
import './Cuentas.css';
import { supabase } from '../supabase';
import FormularioCuenta from "../components/FormularioCuenta/FormularioCuenta";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import exportarCSV from '../utils/exportarCSV';

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
        <div className="cuentas-page">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus cuentas', texto: 'Aquí creas y administras tus cuentas: débito, crédito o efectivo.' },
                { titulo: 'Balance total', texto: 'Suma automática de los saldos de todas tus cuentas.' }
            ]} />}
            <div className="cuentas-header">
                <div>
                    <h1>Gestor de Cuentas</h1>
                    <p>Controla los saldos de tus cuentas</p>
                </div>
                <div className="cuentas-header-botones">
                    <button onClick={abrirModalTransferencia}>↔ Transferir</button>
                    <button className="btn-exportar" onClick={() => exportarCSV(cuentas, 'cuentas')}>⬇ Exportar</button>
                    <button onClick={() => setModalVisible(true)}>+ Nueva Cuenta</button>
                </div>
            </div>

            <div className="cuentas-balance">
                <p>Balance Total</p>
                <h2>${balanceTotal.toLocaleString('es-CO')}</h2>
            </div>

            <div className="cuentas-grupos">
                {cuentas.length === 0 ? (
                    <div className="cuenta-vacio">
                        <p>No hay cuentas</p>
                        <p>Crea tu primera cuenta para comenzar</p>
                        <button onClick={() => setModalVisible(true)}>+ Crear cuenta</button>
                    </div>
                ) : (
                    ['debito', 'credito', 'efectivo'].map(tipo => {
                        const cuentasFiltradas = cuentas.filter(c => c.tipo === tipo);
                        if (cuentasFiltradas.length === 0) return null;
                        const tipoTitulo = tipo === 'credito' ? 'Cuentas de Crédito' : tipo === 'debito' ? 'Cuentas de Débito' : 'Efectivo';
                        return (
                            <div key={tipo}>
                                <h3 className="cuentas-grupo-titulo">{tipoTitulo}</h3>
                                <div className="cuentas-lista">
                                    {cuentasFiltradas.map((cuenta, index) => {
                                        const tipoLabel = tipo === 'credito' ? 'Crédito' : tipo === 'debito' ? 'Débito' : 'Efectivo';
                                        return (
                                            <div key={index} className="cuenta-tarjeta">
                                                <div className="cuenta-tarjeta-header">
                                                    <div className="cuenta-icono" style={{ backgroundColor: cuenta.color + '22' }}>
                                                        <span style={{ color: cuenta.color }}>$</span>
                                                    </div>
                                                    <div className="cuenta-tarjeta-acciones">
                                                        <button className="btn-editar-cuenta" onClick={() => abrirEdicion(cuenta)}><Icon name="pencil" size={16} /></button>
                                                        <button className="btn-eliminar-cuenta" onClick={() => {
                                                            supabase.from('cuentas').delete().eq('id', cuenta.id).then(() => { });
                                                            setCuentas(prev => prev.filter(c => c.id !== cuenta.id));
                                                        }}>🗑️</button>
                                                    </div>
                                                </div>
                                                <p className="cuenta-nombre">{cuenta.nombre}</p>
                                                {cuenta.banco && <p className="cuenta-banco">{cuenta.banco}</p>}
                                                <div className="cuenta-tarjeta-footer">
                                                    <p className="cuenta-saldo" style={{ color: cuenta.color }}>${Number(cuenta.saldo).toLocaleString('es-CO')}</p>
                                                    <span className="cuenta-tipo-badge">{tipoLabel}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal visible={modalVisible} onClose={cerrarModal}>
                <FormularioCuenta setCuenta={setCuentas} onClose={cerrarModal} cuentaEditar={cuentaEditar} />
            </Modal>
        </div>
    );
}

export default Cuentas;