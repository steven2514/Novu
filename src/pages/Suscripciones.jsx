import { useState } from "react";
import './Suscripciones.css';
import Modal from '../components/Modal/Modal';
import { supabase } from '../supabase';
import FormularioSuscripcion from "../components/FormularioSuscripcion/FormularioSuscripcion";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { IconoMarca, buscarMarca } from '../components/IconoMarca';
import exportarCSV from '../utils/exportarCSV';
import { useToast } from '../Context/ToastContext';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const FRECUENCIAS = { diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual' };

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(`${fecha}T00:00:00`);
    return `${d.getDate()}-${MESES[d.getMonth()]}`;
}

function sumarCiclo(fecha, frecuencia) {
    const d = new Date(`${fecha}T00:00:00`);
    if (frecuencia === 'diario') d.setDate(d.getDate() + 1);
    else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

function Suscripciones({ cuentas, suscripciones, setSuscripciones, setCuentas, setTransacciones, sesion }) {

    const [suscripcionEditar, setSuscripcionEditar] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const gastoMensual = suscripciones.reduce((acc, c) => acc + Number(c.monto), 0);
    const { mostrarTour, cerrarTour } = useTour('suscripciones', sesion);
    const { mostrarToast } = useToast();

    async function pagarSuscripcion(sus) {
        const nuevaFecha = sumarCiclo(sus.fecha_renovacion, sus.frecuencia);

        const { error: errorFecha } = await supabase
            .from('suscripciones')
            .update({ fecha_renovacion: nuevaFecha })
            .eq('id', sus.id);
        if (errorFecha) { mostrarToast('No se pudo actualizar la suscripción', 'error'); return; }

        const { data: nuevaTransaccion, error: errorTransaccion } = await supabase
            .from('transacciones')
            .insert({
                descripcion: sus.nombre,
                monto: sus.monto,
                tipo: 'gasto',
                categoria: 'suscripciones',
                cuenta: sus.cuenta,
                fecha: new Date().toISOString().slice(0, 10),
                user_id: sesion.user.id,
            })
            .select()
            .single();
        if (errorTransaccion) { mostrarToast('No se pudo registrar el pago', 'error'); return; }

        const cuenta = cuentas.find(c => c.nombre === sus.cuenta);
        if (cuenta) {
            const nuevoSaldo = Number(cuenta.saldo) - Number(sus.monto);
            const { error: errorSaldo } = await supabase
                .from('cuentas')
                .update({ saldo: nuevoSaldo })
                .eq('id', cuenta.id);
            if (errorSaldo) { mostrarToast('No se pudo actualizar el saldo', 'error'); return; }
            setCuentas(prev => prev.map(c => c.id === cuenta.id ? { ...c, saldo: nuevoSaldo } : c));
        }

        setSuscripciones(prev => prev.map(s => s.id === sus.id ? { ...s, fecha_renovacion: nuevaFecha } : s));
        setTransacciones(prev => [nuevaTransaccion, ...prev]);
        mostrarToast('Suscripción pagada correctamente', 'exito');
    }

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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(suscripciones, 'suscripciones')}>⬇ Exportar</button>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Nueva suscripción</button>
                </div>
            </div>

            <div className="tarjeta-total">
                <p>Total mensual</p>
                <h2>${gastoMensual.toLocaleString('es-CO')}</h2>
            </div>

            {suscripciones.length === 0 ? (
                <div className="seccion-vacia">
                    <p>No hay suscripciones</p>
                    <p>Agrega tus servicios recurrentes</p>
                    <button className="btn-pildora-acento" onClick={() => setModalVisible(true)}>+ Agregar suscripción</button>
                </div>
            ) : (
                <div className="suscripciones-lista">
                    {suscripciones.map((sus, index) => {
                        const marca = buscarMarca(sus.nombre);
                        return (
                            <div key={index} className="fila-item">
                                {marca ? (
                                    <IconoMarca nombre={sus.nombre} size={20} />
                                ) : (
                                    <div className="icono-circulo" style={{ backgroundColor: (sus.color || '#6C63FF') + '22' }}>
                                        <Icon name={sus.icono} size={20} style={{ color: sus.color || '#6C63FF' }} />
                                    </div>
                                )}
                                <div className="suscripcion-info">
                                    <p className="suscripcion-nombre">{sus.nombre}</p>
                                    <p className="suscripcion-detalle">{FRECUENCIAS[sus.frecuencia] || 'Mensual'} · Próximo cobro: {formatearFecha(sus.fecha_renovacion)}</p>
                                </div>
                                <div className="fila-derecha">
                                    <span className="suscripcion-monto">${Number(sus.monto).toLocaleString('es-CO')}</span>
                                    <button className="btn-pildora-acento btn-pagar" onClick={() => pagarSuscripcion(sus)}>Pagar</button>
                                    <button className="btn-fila-eliminar" title="Editar" onClick={() => { setSuscripcionEditar(sus); setModalVisible(true); }}>
                                        <Icon name="pencil" size={16} />
                                    </button>
                                    <button className="btn-fila-eliminar" title="Eliminar" onClick={() => {
                                        supabase.from('suscripciones').delete().eq('id', sus.id).then(() => { });
                                        setSuscripciones(prev => prev.filter(s => s.id !== sus.id));
                                        mostrarToast('Suscripción eliminada', 'exito');
                                    }}>
                                        <Icon name="trash-2" size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setSuscripcionEditar(null); }}>
                <FormularioSuscripcion
                    setSuscripciones={setSuscripciones}
                    onClose={() => { setModalVisible(false); setSuscripcionEditar(null); }}
                    cuentas={cuentas}
                    setCuentas={setCuentas}
                    sesion={sesion}
                    suscripcionEditar={suscripcionEditar}
                />
            </Modal>
        </div>
    );
}

export default Suscripciones;