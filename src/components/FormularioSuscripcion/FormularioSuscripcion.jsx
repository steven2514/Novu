import { useState, useEffect } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import { aInputFecha } from '../../utils/fechas';
import './FormularioSuscripcion.css'
import { Icon, ICONOS_SUSCRIPCION } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';
import { useIdioma } from '../../i18n/idioma';

function FormularioSuscripcion({ setSuscripciones, onClose, cuentas, sesion, suscripcionEditar }) {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState();
    const [cuenta, setCuenta] = useState('');
    const [fechaRenovacion, setFechaRenovacion] = useState('');
    const [frecuencia, setFrecuencia] = useState('mensual');
    const [icono, setIcono] = useState('credit-card');
    const [color, setColor] = useState(PALETA_ELEMENTOS[0]);
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const ICONOS = ICONOS_SUSCRIPCION;
    const COLORES = PALETA_ELEMENTOS;

    useEffect(() => {
        if (suscripcionEditar) {
            setNombre(suscripcionEditar.nombre);
            setMonto(suscripcionEditar.monto);
            setCuenta(suscripcionEditar.cuenta);
            setFechaRenovacion(aInputFecha(suscripcionEditar.fecha_renovacion));
            setFrecuencia(suscripcionEditar.frecuencia);
            setIcono(suscripcionEditar.icono);
            setColor(suscripcionEditar.color);
        }
    }, [suscripcionEditar]);

    async function guardar() {
        setGuardando(true);
        if (suscripcionEditar) {
            const { error } = await supabase.from('suscripciones').update({ nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color }).eq('id', suscripcionEditar.id);
            if (error) { mostrarToast(t('formularios.suscripcionNoActualizada'), 'error'); setGuardando(false); return; }
            setSuscripciones(prev => prev.map(s => s.id === suscripcionEditar.id ? { ...s, nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color } : s));
            mostrarToast(t('formularios.suscripcionActualizada'), 'exito');
        } else {
            const nueva = { nombre, monto, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color, user_id: sesion.user.id };
            const { data, error } = await supabase.from('suscripciones').insert([nueva]).select().single();
            if (error) { mostrarToast(t('formularios.suscripcionNoCreada'), 'error'); setGuardando(false); return; }
            setSuscripciones(prev => [...prev, data]);
            // Crear la suscripción no cobra: el cobro lo hace "Pagar" en
            // Suscripciones, que descuenta de la cuenta y avanza la renovación.
            // Antes aquí se descontaba sólo en pantalla (no en Supabase) y el
            // saldo "volvía" al recargar.
            mostrarToast(t('formularios.suscripcionCreada'), 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-suscripcion">
            <div className="modal-kaipo-header">
                <h2>{suscripcionEditar ? t('formularios.editarSuscripcion') : t('formularios.nuevaSuscripcion')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            <div className="modal-kaipo-body">
                <div className="icono-selector-grid">
                    {ICONOS.map((ic) => (
                        <div key={ic} className={`icono-selector-opcion ${icono === ic ? 'seleccionado' : ''}`} onClick={() => setIcono(ic)}>
                            <Icon name={ic} />
                        </div>
                    ))}
                </div>

                <label>{t('comun.nombre')}</label>
                <input className="campo-pildora" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('formularios.ejSuscripcion')} />

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label>{t('comun.monto')}</label>
                        <input className="campo-pildora" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <label>{t('formularios.ciclo')}</label>
                        <select className="campo-pildora" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                            <option value="diario">{t('suscripciones.frecuencias.diario')}</option>
                            <option value="semanal">{t('suscripciones.frecuencias.semanal')}</option>
                            <option value="mensual">{t('suscripciones.frecuencias.mensual')}</option>
                        </select>
                    </div>
                </div>

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label>{t('formularios.proximoCobro')}</label>
                        <input className="campo-pildora" type="date" value={fechaRenovacion} onChange={(e) => setFechaRenovacion(e.target.value)} />
                    </div>
                    <div>
                        <label>{t('comun.cuenta')}</label>
                        <select className="campo-pildora" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                            <option value="">{t('comun.seleccionarCuenta')}</option>
                            {cuentas.map((c, i) => (<option key={i} value={c.nombre}>{c.nombre}</option>))}
                        </select>
                    </div>
                </div>

                <label>{t('comun.color')}</label>
                <div className="color-selector-grid">
                    {COLORES.map((c) => (
                        <div key={c} className={`color-selector-opcion ${color === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                    ))}
                </div>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : suscripcionEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default FormularioSuscripcion;