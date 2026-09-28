import { useState } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import './FormularioCuenta.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/toast';
import { useIdioma } from '../../i18n/idioma';

function FormularioCuenta({ setCuenta, onClose, cuentaEditar }) {
    // Al editar, los campos arrancan con los datos de la cuenta. El formulario
    // vive dentro de un Modal que se desmonta al cerrarse, así que cada vez que
    // se abre se vuelve a inicializar; no hace falta un useEffect.
    const [nombre, setNombre] = useState(cuentaEditar?.nombre ?? '');
    const [tipo, setTipo] = useState(cuentaEditar?.tipo ?? 'debito');
    const [saldo, setSaldo] = useState(cuentaEditar?.saldo ?? '');
    const [banco, setBanco] = useState(cuentaEditar?.banco || '');
    const [color, setColor] = useState(cuentaEditar?.color ?? PALETA_ELEMENTOS[0]);
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();

    async function guardar() {
        setGuardando(true);
        const saldoFinal = saldo === '' ? 0 : Number(saldo);
        if (cuentaEditar) {
            const { error } = await supabase.from('cuentas').update({ nombre, tipo, saldo: saldoFinal, banco, color }).eq('id', cuentaEditar.id);
            if (error) { mostrarToast(t('formularios.cuentaNoActualizada'), 'error'); setGuardando(false); return; }
            setCuenta(prev => prev.map(c => c.id === cuentaEditar.id ? { ...c, nombre, tipo, saldo: saldoFinal, banco, color } : c));
            mostrarToast(t('formularios.cuentaActualizada'), 'exito');
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const nueva = { nombre, tipo, saldo: saldoFinal, banco, color, user_id: user.id };
            const { data, error } = await supabase.from('cuentas').insert([nueva]).select().single();
            if (error) { mostrarToast(t('formularios.cuentaNoCreada'), 'error'); setGuardando(false); return; }
            setCuenta(prev => [...prev, data]);
            mostrarToast(t('formularios.cuentaCreada'), 'exito');
        }
        setGuardando(false);
        onClose();
    }

    return (
        <div className="formulario-cuenta">
            <div className="modal-kaipo-header">
                <h2>{cuentaEditar ? t('formularios.editarCuenta') : t('formularios.nuevaCuenta')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            <div className="modal-kaipo-body">
                <label>{t('comun.nombre')}</label>
                <input className="campo-pildora" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('agregar.ejCuenta')} />

                <div className="formulario-cuenta-fila-doble">
                    <div>
                        <label>{t('agregar.tipo')}</label>
                        <select className="campo-pildora" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="debito">{t('agregar.tipos.debito')}</option>
                            <option value="efectivo">{t('agregar.tipos.efectivo')}</option>
                            <option value="credito">{t('agregar.tipos.credito')}</option>
                        </select>
                    </div>
                    <div>
                        <label>{cuentaEditar ? t('formularios.saldo') : t('agregar.saldoInicial')}</label>
                        <input className="campo-pildora" type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="0.00" />
                    </div>
                </div>

                <label>{t('agregar.banco')}</label>
                <input className="campo-pildora" type="text" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder={t('agregar.ejBanco')} />

                <label>{t('comun.color')}</label>
                <div className="color-selector-grid">
                    {PALETA_ELEMENTOS.map((c) => (
                        <div key={c} className={`color-selector-opcion ${color === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                    ))}
                </div>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : cuentaEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default FormularioCuenta;