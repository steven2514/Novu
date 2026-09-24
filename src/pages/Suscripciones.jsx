import { useState } from "react";
import './Suscripciones.css';
import { supabase } from '../supabase';
import FormularioSuscripcion from "../components/FormularioSuscripcion/FormularioSuscripcion";
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { IconoMarca, buscarMarca } from '../components/IconoMarca';
import exportarCSV from '../utils/exportarCSV';
import { useToast } from '../Context/ToastContext';
import { parseFecha, aISO, hoyISO, formatearFecha } from '../utils/fechas';
import { useIdioma } from '../i18n/idioma';

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

function sumarCiclo(fecha, frecuencia) {
    const d = parseFecha(fecha) || new Date();
    if (frecuencia === 'diario') d.setDate(d.getDate() + 1);
    else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7);
    else {
        // Mensual: el 31 de enero pasa al 28/29 de febrero, no al 3 de marzo.
        const dia = d.getDate();
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
        const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(dia, ultimoDia));
    }
    // aISO y no toISOString: este último pasa por UTC y puede cambiar el día.
    return aISO(d);
}

function diasRestantes(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const objetivo = parseFecha(fecha);
    if (!objetivo) return 0;
    return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

function accentDeSuscripcion(sus) {
    const marca = buscarMarca(sus.nombre);
    const clave = (marca?.nombre || sus.nombre || '').toLowerCase().trim();
    return ACENTOS_MARCA[clave] || sus.color || '#0B5E66';
}

function Suscripciones({ cuentas, suscripciones, setSuscripciones, setCuentas, setTransacciones, sesion }) {

    const [suscripcionEditar, setSuscripcionEditar] = useState(null);
    const gastoMensual = suscripciones.reduce((acc, c) => acc + Number(c.monto), 0);
    const { mostrarTour, cerrarTour } = useTour('suscripciones', sesion);
    const { t } = useIdioma();
    const frecuencia = (sus) => (sus.frecuencia in DIAS_CICLO ? sus.frecuencia : 'mensual');
    const { mostrarToast } = useToast();

    async function pagarSuscripcion(sus) {
        const nuevaFecha = sumarCiclo(sus.fecha_renovacion, sus.frecuencia);

        const { error: errorFecha } = await supabase
            .from('suscripciones')
            .update({ fecha_renovacion: nuevaFecha })
            .eq('id', sus.id);
        if (errorFecha) { mostrarToast(t('suscripciones.errorActualizar'), 'error'); return; }

        const { data: nuevaTransaccion, error: errorTransaccion } = await supabase
            .from('transacciones')
            .insert({
                descripcion: sus.nombre,
                monto: sus.monto,
                tipo: 'gasto',
                categoria: 'suscripciones',
                cuenta: sus.cuenta,
                fecha: hoyISO(),
                user_id: sesion.user.id,
            })
            .select()
            .single();
        if (errorTransaccion) { mostrarToast(t('suscripciones.errorPago'), 'error'); return; }

        const cuenta = cuentas.find(c => c.nombre === sus.cuenta);
        if (cuenta) {
            const nuevoSaldo = Number(cuenta.saldo) - Number(sus.monto);
            const { error: errorSaldo } = await supabase
                .from('cuentas')
                .update({ saldo: nuevoSaldo })
                .eq('id', cuenta.id);
            if (errorSaldo) { mostrarToast(t('suscripciones.errorSaldo'), 'error'); return; }
            setCuentas(prev => prev.map(c => c.id === cuenta.id ? { ...c, saldo: nuevoSaldo } : c));
        }

        setSuscripciones(prev => prev.map(s => s.id === sus.id ? { ...s, fecha_renovacion: nuevaFecha } : s));
        setTransacciones(prev => [nuevaTransaccion, ...prev]);
        mostrarToast(t('suscripciones.pagada'), 'exito');
    }

    function eliminarSuscripcion(sus) {
        supabase.from('suscripciones').delete().eq('id', sus.id).then(() => { });
        setSuscripciones(prev => prev.filter(s => s.id !== sus.id));
        if (suscripcionEditar?.id === sus.id) setSuscripcionEditar(null);
        mostrarToast(t('suscripciones.eliminada'), 'exito');
    }

    return (
        <div className="suscripciones-page contenido-pagina">
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: t('suscripciones.tour1Titulo'), texto: t('suscripciones.tour1Texto') },
                { titulo: t('suscripciones.tour2Titulo'), texto: t('suscripciones.tour2Texto') }
            ]} />}

            <div className="suscripciones-header">
                <div>
                    <p className="overline">{t('suscripciones.overline')}</p>
                    <h1>{t('suscripciones.titulo')}</h1>
                    <p>{t('suscripciones.subtitulo')}</p>
                </div>
                <div className="header-acciones">
                    <button className="btn-pildora-secundario" onClick={() => exportarCSV(suscripciones, 'suscripciones')}>
                        <Icon name="download" size={16} /> {t('comun.exportar')}
                    </button>
                    <button className="btn-pildora-acento" onClick={() => setSuscripcionEditar(null)}>
                        <Icon name="plus" size={16} /> {t('suscripciones.nueva')}
                    </button>
                </div>
            </div>

            <div className="suscripciones-layout">
                <div className="suscripciones-col-lista">
                    <div className="subs-total">
                        <div>
                            <p>{t('suscripciones.totalMensual')}</p>
                            <h2>${gastoMensual.toLocaleString('es-CO')}</h2>
                        </div>
                        <div className="subs-total-dato">
                            <p>{t('suscripciones.activas')}</p>
                            <h2>{suscripciones.length}</h2>
                        </div>
                        <div className="subs-total-dato">
                            <p>{t('suscripciones.alAnio')}</p>
                            <h2>${(gastoMensual * 12).toLocaleString('es-CO')}</h2>
                        </div>
                    </div>

                    {suscripciones.length === 0 ? (
                        <div className="seccion-vacia">
                            <p>{t('suscripciones.vacioTitulo')}</p>
                            <p>{t('suscripciones.vacioTexto')}</p>
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
                                    ? t('suscripciones.vencidaHace', { n: Math.abs(dias) })
                                    : dias === 0
                                        ? t('suscripciones.hoy')
                                        : t('suscripciones.dias', { n: dias });

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
                                                    <span className="punto"></span> {vencida ? t('suscripciones.vencida') : t('suscripciones.activa')}
                                                </span>
                                                <button
                                                    className={`sub-card-editar ${suscripcionEditar?.id === sus.id ? 'sub-card-editando' : ''}`}
                                                    title={t('comun.editar')}
                                                    onClick={() => setSuscripcionEditar(sus)}
                                                >
                                                    <Icon name="pencil" size={14} />
                                                </button>
                                                <button
                                                    className="sub-card-cerrar"
                                                    title={t('comun.eliminar')}
                                                    onClick={() => eliminarSuscripcion(sus)}
                                                >
                                                    <Icon name="x" size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="sub-card-nombre">{sus.nombre}</h3>
                                            <span className="sub-card-categoria">{t(`suscripciones.frecuencias.${frecuencia(sus)}`)}</span>
                                        </div>

                                        <div className="sub-card-precio">
                                            <span className="monto">${Number(sus.monto).toLocaleString('es-CO')}</span>
                                            <span className="periodo">{t(`suscripciones.periodos.${frecuencia(sus)}`)}</span>
                                        </div>

                                        <hr className="sub-card-divisor" />

                                        <div className="sub-card-pago">
                                            <div className="pago-anillo" style={{ '--dias-progreso': progreso }}>
                                                <span>{vencida ? '!' : dias}</span>
                                            </div>
                                            <div className="pago-info">
                                                <span className="etiqueta">{t('suscripciones.proximoPago')}</span>
                                                <span className="dias">{etiquetaDias}</span>
                                                <span className="fecha">{formatearFecha(sus.fecha_renovacion, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        <button className="sub-card-btn-pagar" onClick={() => pagarSuscripcion(sus)}>
                                            <Icon name="credit-card" size={16} />
                                            {t('suscripciones.pagar', { monto: '$' + Number(sus.monto).toLocaleString('es-CO') })}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="suscripciones-form-panel">
                    <FormularioSuscripcion
                        key={suscripcionEditar ? suscripcionEditar.id : 'nuevo'}
                        setSuscripciones={setSuscripciones}
                        onClose={() => setSuscripcionEditar(null)}
                        cuentas={cuentas}
                        setCuentas={setCuentas}
                        sesion={sesion}
                        suscripcionEditar={suscripcionEditar}
                    />
                </div>
            </div>
        </div>
    );
}

export default Suscripciones;