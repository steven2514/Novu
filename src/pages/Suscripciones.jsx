import { useState } from "react";
import './Suscripciones.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioSuscripcion from "../components/FormularioSuscripcion/FormularioSuscripcion";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';

function Suscripciones({ cuentas, suscripciones, setSuscripciones, setCuentas, sesion }) {

    const [modalVisible, setModalVisible] = useState(false);
    const gastoMensual = suscripciones.reduce((acc, c) => acc + Number(c.monto), 0);
    const { mostrarTour, cerrarTour } = useTour('suscripciones', sesion);

    return (
        <div className="suscripciones-page">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: 'Tus suscripciones', texto: 'Registra pagos recurrentes como Netflix o Spotify.' },
                { titulo: 'Cuenta regresiva', texto: 'Mira cuántos días faltan para que se renueve cada suscripción.' }
            ]} />}

            <div className="suscripciones-header">
                <div>
                    <h1>Suscripciones</h1>
                    <p>Control de pagos recurrentes</p>
                </div>
                <button onClick={() => setModalVisible(true)}>+ Nueva Suscripción</button>
            </div>

            <div className="tarjeta-gasto">
                <p>Gasto Mensual en Suscripciones</p>
                <h2>${gastoMensual.toLocaleString('es-CO')}</h2>
            </div>

            {suscripciones.length === 0 ? (
                <div className="seccion-vacia">
                    <p>No hay suscripciones</p>
                    <p>Agrega tus servicios recurrentes</p>
                    <button onClick={() => setModalVisible(true)}>+ Agregar Suscripción</button>
                </div>
            ) : (
                <div className="suscripciones-lista">
                    {suscripciones.map((sus, index) => {

                        const hoy = new Date();
                        const fechaRenovacion = new Date(sus.fecha_renovacion);
                        const diferencia = fechaRenovacion - hoy;
                        const dias = diferencia / (1000 * 60 * 60 * 24);

                        return (
                            <div key={index} className="suscripcion-tarjeta" style={{ borderColor: sus.color }}>
                                <span className="suscripcion-icono">{sus.icono}</span>
                                <p className="suscripcion-nombre">{sus.nombre}</p>
                                <p className="suscripcion-monto">${Number(sus.monto).toLocaleString('es-CO')}</p>
                                <p className="suscripcion-dias">Faltan {Math.round(dias)} días</p>
                                <button className="btn-eliminar-cuenta" onClick={() => {
                                    supabase.from('suscripciones').delete().eq('id', sus.id).then(() => { });
                                    setSuscripciones(prev => prev.filter(s => s.id !== sus.id));
                                }}>🗑️</button>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <FormularioSuscripcion setSuscripciones={setSuscripciones} onClose={() => setModalVisible(false)} cuentas={cuentas} setCuentas={setCuentas} />
            </Modal>
        </div>
    );
}

export default Suscripciones;