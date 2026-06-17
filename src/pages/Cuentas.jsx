import { useState } from "react";
import Modal from '../components/Modal/Modal';
import './Cuentas.css';
import FormularioCuenta from "../components/FormularioCuenta/FormularioCuenta";

function Cuentas({cuentas=[], setCuentas}) {

    
    const [modalVisible, setModalVisible] = useState(false);
    const balanceTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    return (
        <div className="cuentas-page">
            <div className="cuentas-header">
                <div>
                    <h1>Gestor de Cuentas</h1>
                    <p>Controla los saldos de tus cuentas</p>
                </div>
                <button onClick={() => setModalVisible(true)}>+ Nueva Cuenta</button>
            </div>

            <div className="cuentas-balance">
                <p>Balance Total</p>
                <h2>${balanceTotal.toLocaleString('es-CO')}</h2>
            </div>

            <div className="cuentas-lista">
                {cuentas.length === 0 ? (
                    <div className="cuenta-vacio">
                        <p>No hay cuentas</p>
                        <p>Crea tu primera cuenta para comenzar</p>
                        <button onClick={() => setModalVisible(true)}>+ Crear cuenta</button>
                    </div>
                ) : (
                    cuentas.map((cuenta, index) => (
                        <div key={index} className="cuenta-tarjeta">
                            <div className="cuenta-tarjeta-header">
                                <div className="cuenta-icono" style={{ backgroundColor: cuenta.color + '22' }}>
                                    <span style={{ color: cuenta.color }}>$</span>
                                </div>
                                <button className="btn-eliminar-cuenta" onClick={() => setCuentas(prev => prev.filter((_, i) => i !== index))}>🗑️</button>
                            </div>
                            <p className="cuenta-nombre">{cuenta.nombre}</p>
                            <div className="cuenta-footer">
                                <p className="cuenta-saldo" style={{ color: cuenta.color }}>${Number(cuenta.saldo).toLocaleString('es-CO')}</p>
                                <span className="cuenta-tipo">{cuenta.tipo}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <FormularioCuenta setCuenta={setCuentas} onClose={() => setModalVisible(false)} />
            </Modal>
        </div>
    );
}

export default Cuentas;