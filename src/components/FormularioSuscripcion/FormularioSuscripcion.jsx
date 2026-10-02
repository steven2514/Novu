import { useState, useId } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import { aInputFecha } from '../../utils/fechas';
import './FormularioSuscripcion.css'
import { Icon } from '../Icon';
import { SelectorColor, SelectorIcono } from '../Selectores';
import { ICONOS_SUSCRIPCION } from '../../utils/iconos';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/toast';
import { useIdioma } from '../../i18n/idioma';
import { aPesos, montoParaCampo } from '../../utils/moneda';
import { usePreferencias } from '../../Context/preferencias';

function FormularioSuscripcion({ setSuscripciones, onClose, cuentas, sesion, suscripcionEditar }) {
    // Ids para conectar cada etiqueta con su campo (accesibilidad)
    const idForm = useId();
    // Al editar, los campos arrancan con los datos de la suscripción. Este
    // formulario está siempre visible en el panel lateral, así que quien lo usa
    // le pasa key={id}: al elegir otra suscripción React lo monta de nuevo y
    // estos valores iniciales se vuelven a calcular.
    const [nombre, setNombre] = useState(suscripcionEditar?.nombre ?? '');
    const [monto, setMonto] = useState(() => montoParaCampo(suscripcionEditar?.monto));
    const [cuenta, setCuenta] = useState(suscripcionEditar?.cuenta ?? '');
    const [fechaRenovacion, setFechaRenovacion] = useState(() => aInputFecha(suscripcionEditar?.fecha_renovacion));
    const [frecuencia, setFrecuencia] = useState(suscripcionEditar?.frecuencia ?? 'mensual');
    const [icono, setIcono] = useState(suscripcionEditar?.icono ?? 'credit-card');
    const [color, setColor] = useState(suscripcionEditar?.color ?? PALETA_ELEMENTOS[0]);
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const { moneda } = usePreferencias();
    const ICONOS = ICONOS_SUSCRIPCION;
    const COLORES = PALETA_ELEMENTOS;

    async function guardar() {
        setGuardando(true);
        const montoPesos = aPesos(monto, suscripcionEditar?.monto);
        if (suscripcionEditar) {
            const { error } = await supabase.from('suscripciones').update({ nombre, monto: montoPesos, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color }).eq('id', suscripcionEditar.id);
            if (error) { mostrarToast(t('formularios.suscripcionNoActualizada'), 'error'); setGuardando(false); return; }
            setSuscripciones(prev => prev.map(s => s.id === suscripcionEditar.id ? { ...s, nombre, monto: montoPesos, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color } : s));
            mostrarToast(t('formularios.suscripcionActualizada'), 'exito');
        } else {
            const nueva = { nombre, monto: montoPesos, cuenta, fecha_renovacion: fechaRenovacion, frecuencia, icono, color, user_id: sesion.user.id };
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
                <SelectorIcono iconos={ICONOS} valor={icono} onChange={setIcono} />

                <label htmlFor={`${idForm}-1`}>{t('comun.nombre')}</label>
                <input id={`${idForm}-1`} className="campo-pildora" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('formularios.ejSuscripcion')} />

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label htmlFor={`${idForm}-2`}>{t('comun.monto')} ({moneda})</label>
                        <input id={`${idForm}-2`} className="campo-pildora" type="number" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor={`${idForm}-3`}>{t('formularios.ciclo')}</label>
                        <select id={`${idForm}-3`} className="campo-pildora" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                            <option value="diario">{t('suscripciones.frecuencias.diario')}</option>
                            <option value="semanal">{t('suscripciones.frecuencias.semanal')}</option>
                            <option value="mensual">{t('suscripciones.frecuencias.mensual')}</option>
                        </select>
                    </div>
                </div>

                <div className="formulario-suscripcion-fila-doble">
                    <div>
                        <label htmlFor={`${idForm}-4`}>{t('formularios.proximoCobro')}</label>
                        <input id={`${idForm}-4`} className="campo-pildora" type="date" value={fechaRenovacion} onChange={(e) => setFechaRenovacion(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor={`${idForm}-5`}>{t('comun.cuenta')}</label>
                        <select id={`${idForm}-5`} className="campo-pildora" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                            <option value="">{t('comun.seleccionarCuenta')}</option>
                            {cuentas.map((c) => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
                        </select>
                    </div>
                </div>

                <p className="etiqueta-campo">{t('comun.color')}</p>
                <SelectorColor colores={COLORES} valor={color} onChange={setColor} />
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : suscripcionEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default FormularioSuscripcion;