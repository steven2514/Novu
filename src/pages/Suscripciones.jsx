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
const PERIODO_CORTO = { diario: '/día', semanal: '/sem', mensual: '/mes' };
const DIAS_CICLO = { diario: 1, semanal: 7, mensual: 30 };

// Colores de acento para marcas conocidas. Si la suscripción no
// coincide con ninguna, se usa sus.color (definido al crearla) o
// el morado por defecto de la app.
const ACENTOS_MARCA = {
    netflix: '#e50914',
    spotify: '#1db954',
    'disney+': '#1f6feb',
    disney: '#1f6feb',
    'apple music': '#fa233b',
    'apple tv': '#a2a2a2',
    icloud: '#3693f3',
    youtube: '#ff0000',
    'youtube premium': '#ff0000',
    'hbo max': '#8b2cf5',
    'prime video': '#00a8e1',
    deezer: '#a238ff',
    tidal: '#000000',
    notion: '#ffffff',
    'google drive': '#34a853',
    'google play': '#00c853',
    dropbox: '#0061ff',
    twitch: '#9146ff',
    playstation: '#0070d1',
    steam: '#1b2838',
    'crunchyroll': '#f47521',
    paramount: '#0064ff',
};

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(`${fecha}T00:00:00`);
    return `${d.getDate()}-${MESES[d.getMonth()]}`;
}

function formatearFechaLarga(fecha) {
    if (!fecha) return '';
    return fecha; // ya viene como YYYY-MM-DD desde supabase
}

function sumarCiclo(fecha, frecuencia) {
    const d = new Date(`${fecha}T00:00:00`);
    if (frecuencia === 'diario') d.setDate(d.getDate() + 1);
    else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

function diasRestantes(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const objetivo = new Date(`${fecha}T00:00:00`);
    return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

function accentDeSuscripcion(sus) {
    const marca = buscarMarca(sus.nombre);
    const clave = (marca?.nombre || sus.nombre || '').toLowerCase().trim();
    return ACENTOS_MARCA[clave] || sus.color || '#6C63FF';
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

    function eliminarSuscripcion(sus) {
        supabase.from('suscripciones').delete().eq('id', sus.id).then(() => { });
        setSuscripciones(prev => prev.filter(s => s.id !== sus.id));
        mostrarToast('Suscripción eliminada', 'exito');
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
                        const accent = accentDeSuscripcion(sus);
                        const dias = diasRestantes(sus.fecha_renovacion);
                        const cicloDias = DIAS_CICLO[sus.frecuencia] || 30;
                        const progreso = Math.min(100, Math.max(0, ((cicloDias - dias) / cicloDias) * 100));
                        const vencida = dias < 0;
                        const etiquetaDias = vencida
                            ? `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
                            : dias === 0
                                ? 'Hoy'
                                : `${dias} día${dias === 1 ? '' : 's'}`;

                        return (
                            <div
                                key={sus.id ?? index}
                                className="sub-card"
                                style={{ '--accent': accent }}
                            >
                                <div className="sub-card-header">
                                    {marca ? (
                                        <div className="sub-card-icono">
                                            <IconoMarca nombre={sus.nombre} size={24} />
                                        </div>
                                    ) : (
                                        <div className="sub-card-icono">
                                            <Icon name={sus.icono} size={24} style={{ color: '#fff' }} />
                                        </div>
                                    )}

                                    <div className="sub-card-header-derecha">
                                        <span className="badge-estado" style={vencida ? { '--accent': '#ef4444' } : undefined}>
                                            <span className="punto"></span> {vencida ? 'Vencida' : 'Activa'}
                                        </span>
                                        <button
                                            className="sub-card-editar"
                                            title="Editar"
                                            onClick={() => { setSuscripcionEditar(sus); setModalVisible(true); }}
                                        >
                                            <Icon name="pencil" size={14} />
                                        </button>
                                        <button
                                            className="sub-card-cerrar"
                                            title="Eliminar"
                                            onClick={() => eliminarSuscripcion(sus)}
                                        >
                                            <Icon name="x" size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="sub-card-nombre">{sus.nombre}</h3>
                                    <span className="sub-card-categoria">{FRECUENCIAS[sus.frecuencia] || 'Mensual'}</span>
                                </div>

                                <div className="sub-card-precio">
                                    <span className="monto">${Number(sus.monto).toLocaleString('es-CO')}</span>
                                    <span className="periodo">{PERIODO_CORTO[sus.frecuencia] || '/mes'}</span>
                                </div>

                                <hr className="sub-card-divisor" />

                                <div className="sub-card-pago">
                                    <div className="pago-anillo" style={{ '--dias-progreso': progreso }}>
                                        <span>{vencida ? '!' : dias}</span>
                                    </div>
                                    <div className="pago-info">
                                        <span className="etiqueta">Próximo pago</span>
                                        <span className="dias">{etiquetaDias}</span>
                                        <span className="fecha">{formatearFechaLarga(sus.fecha_renovacion)}</span>
                                    </div>
                                </div>

                                <button className="sub-card-btn-pagar" onClick={() => pagarSuscripcion(sus)}>
                                    <Icon name="credit-card" size={16} />
                                    Pagar ${Number(sus.monto).toLocaleString('es-CO')}
                                </button>
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