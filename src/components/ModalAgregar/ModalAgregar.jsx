import { useState, useEffect, useRef } from "react";
import { PALETA_ELEMENTOS } from '../../utils/tema';
import { createPortal } from "react-dom";
import './ModalAgregar.css';
import { Icon, ICONOS_META } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';
import { hoyISO, aInputFecha } from '../../utils/fechas';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';

// Valores que se guardan en la base de datos; el nombre visible sale de i18n (categorias.*)
const CATEGORIAS_INGRESO = ['salario', 'freelance', 'regalo', 'otros'];

const CATEGORIAS_GASTO = ['comida', 'transporte', 'hogar', 'ocio', 'salud', 'compras', 'servicios', 'otros'];

const COLORES = PALETA_ELEMENTOS;

// ─── Helpers de formato de monto (7000 -> "7.000") ───
function limpiarNumero(valor) {
    // Deja solo dígitos (quita puntos, letras, etc.)
    return String(valor).replace(/\D/g, '');
}
function formatearNumero(valor) {
    const limpio = limpiarNumero(valor);
    if (!limpio) return '';
    return new Intl.NumberFormat('es-CO').format(Number(limpio));
}

// ─── Iconos SVG propios (no dependen del mapeo de Icon) ───
function ChevronDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// ─── Dropdown personalizado, con el panel en un portal para que nunca se corte ───
function DropdownPildora({ value, onChange, opciones, placeholder }) {
    const [abierto, setAbierto] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    function abrir() {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
        setAbierto(true);
    }

    useEffect(() => {
        function handler(e) {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) {
                setAbierto(false);
            }
        }
        if (abierto) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [abierto]);

    const seleccionada = opciones.find(o => o.value === value);

    return (
        <div className="dropdown-pildora">
            <button ref={triggerRef} type="button" className="campo-pildora dropdown-pildora-trigger" onClick={() => (abierto ? setAbierto(false) : abrir())}>
                <span className={seleccionada ? '' : 'dropdown-placeholder'}>{seleccionada ? seleccionada.label : placeholder}</span>
                <ChevronDownIcon />
            </button>
            {abierto && createPortal(
                <div ref={panelRef} className="dropdown-pildora-panel" style={{ top: pos.top, left: pos.left, width: pos.width }}>
                    {opciones.map((o) => (
                        <div
                            key={o.value}
                            className={`dropdown-pildora-opcion ${value === o.value ? 'seleccionada' : ''}`}
                            onClick={() => { onChange(o.value); setAbierto(false); }}
                        >
                            <span>{o.label}</span>
                            {value === o.value && <CheckIcon />}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

function ModalAgregar({ setTransacciones, cuentas, setCuentas, metas, setMetas, sesion, onClose, transaccionEditar, tipoInicial }) {

    // Si estamos editando una transacción existente, se fija en su pestaña y se ocultan las demás
    const [tab, setTab] = useState(transaccionEditar ? transaccionEditar.tipo : (tipoInicial || 'gasto'));
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const [guardando, setGuardando] = useState(false);

    // ─── Campos: Gasto / Ingreso ───
    // "monto" guarda SOLO dígitos (ej: "7000"), lo que se envía a Supabase.
    // En el input se muestra formateado con formatearNumero(monto) (ej: "7.000").
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [fecha, setFecha] = useState(hoyISO());
    const [nota, setNota] = useState('');

    // ─── Campos: Transferencia / Aporte a meta ───
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');

    // ─── Campos: Cuenta nueva ───
    const [nombreCuenta, setNombreCuenta] = useState('');
    const [tipoCuenta, setTipoCuenta] = useState('debito');
    const [saldoCuenta, setSaldoCuenta] = useState('');
    const [bancoCuenta, setBancoCuenta] = useState('');
    const [colorCuenta, setColorCuenta] = useState(PALETA_ELEMENTOS[0]);

    // ─── Campos: Meta nueva ───
    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState('');
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [iconoMeta, setIconoMeta] = useState('target');
    const [colorMeta, setColorMeta] = useState(PALETA_ELEMENTOS[0]);

    useEffect(() => {
        if (transaccionEditar) {
            setMonto(limpiarNumero(transaccionEditar.monto));
            setCategoria(transaccionEditar.categoria);
            setCuenta(transaccionEditar.cuenta);
            setNota(transaccionEditar.descripcion || '');
            if (transaccionEditar.fecha) {
                setFecha(aInputFecha(transaccionEditar.fecha));
            }
        }
    }, [transaccionEditar]);

    const esTransaccion = tab === 'gasto' || tab === 'ingreso';
    const esTransferencia = tab === 'transferencia' || tab === 'aporte';
    const categorias = (tab === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO)
        .map(valor => ({ value: valor, label: nombreCategoria(valor) }));
    const opcionesCuentas = cuentas.map(c => ({ value: c.nombre, label: c.nombre }));

    // ─── Guardar Gasto / Ingreso ───
    async function guardarTransaccion() {
        // Antes se podía guardar un gasto sin monto, sin categoría o sin cuenta.
        if (!monto || Number(monto) <= 0) { mostrarToast(t('agregar.montoMayor'), 'error'); return; }
        if (!categoria) { mostrarToast(t('agregar.seleccionaCategoria'), 'error'); return; }
        if (!cuenta) { mostrarToast(t('agregar.seleccionaCuenta'), 'error'); return; }
        if (!fecha) { mostrarToast(t('agregar.seleccionaFecha'), 'error'); return; }
        setGuardando(true);
        if (transaccionEditar) {
            const { error } = await supabase.from('transacciones').update({ descripcion: nota, monto, categoria, cuenta }).eq('id', transaccionEditar.id);
            if (error) { mostrarToast(t('agregar.noActualizar'), 'error'); setGuardando(false); return; }
            mostrarToast(t('agregar.transaccionActualizada'), 'exito');
            setTransacciones(prev => prev.map(t => t.id === transaccionEditar.id ? { ...t, descripcion: nota, monto, categoria, cuenta } : t));
        } else {
            const nueva = { descripcion: nota, monto, tipo: tab, categoria, cuenta, fecha, fuente: '', user_id: sesion.user.id };
            const { data, error } = await supabase.from('transacciones').insert([nueva]).select();
            if (error) { mostrarToast(t('agregar.noGuardar'), 'error'); setGuardando(false); return; }
            mostrarToast(tab === 'ingreso' ? t('agregar.ingresoAgregado') : t('agregar.gastoAgregado'), 'exito');
            setTransacciones(prev => [...prev, ...data]);
            const cuentaObj = cuentas.find(c => c.nombre === cuenta);
            if (cuentaObj) {
                const nuevoSaldo = tab === 'ingreso' ? Number(cuentaObj.saldo) + Number(monto) : Number(cuentaObj.saldo) - Number(monto);
                await supabase.from('cuentas').update({ saldo: nuevoSaldo }).eq('id', cuentaObj.id);
                setCuentas(prev => prev.map(c => c.id === cuentaObj.id ? { ...c, saldo: nuevoSaldo } : c));
            }
        }
        setGuardando(false);
        onClose();
    }

    // ─── Guardar Transferencia / Aporte a meta ───
    async function guardarTransferencia() {
        if (!origen || !destino || !monto) { mostrarToast(t('agregar.completaCampos'), 'error'); return; }
        if (Number(monto) <= 0) { mostrarToast(t('agregar.montoMayor'), 'error'); return; }
        const cuentaOrigen = cuentas.find(c => c.nombre === origen);
        if (!cuentaOrigen || Number(cuentaOrigen.saldo) < Number(monto)) { mostrarToast(t('agregar.saldoInsuficiente'), 'error'); return; }
        setGuardando(true);
        const tipoDestino = tab === 'aporte' ? 'meta' : 'cuenta';
        const nuevaTransferencia = { user_id: sesion.user.id, origen, destino, monto, tipo_destino: tipoDestino, fecha: hoyISO() };
        await supabase.from('transferencias').insert([nuevaTransferencia]);
        await supabase.from('cuentas').update({ saldo: Number(cuentaOrigen.saldo) - Number(monto) }).eq('id', cuentaOrigen.id);
        setCuentas(prev => prev.map(c => c.id === cuentaOrigen.id ? { ...c, saldo: Number(c.saldo) - Number(monto) } : c));
        if (tipoDestino === 'cuenta') {
            const cuentaDestino = cuentas.find(c => c.nombre === destino);
            await supabase.from('cuentas').update({ saldo: Number(cuentaDestino.saldo) + Number(monto) }).eq('id', cuentaDestino.id);
            setCuentas(prev => prev.map(c => c.id === cuentaDestino.id ? { ...c, saldo: Number(c.saldo) + Number(monto) } : c));
        } else {
            const meta = metas.find(m => m.nombre_meta === destino);
            const nuevoMontoActual = Number(meta.monto_actual) + Number(monto);
            await supabase.from('metas').update({ monto_actual: nuevoMontoActual }).eq('id', meta.id);
            setMetas(prev => prev.map(m => m.id === meta.id ? { ...m, monto_actual: nuevoMontoActual } : m));
        }
        setGuardando(false);
        mostrarToast(tab === 'aporte' ? t('agregar.aporteOk') : t('agregar.transferenciaOk'), 'exito');
        onClose();
    }

    // ─── Guardar Cuenta nueva ───
    async function guardarCuentaNueva() {
        if (!nombreCuenta.trim()) { mostrarToast(t('agregar.nombreObligatorio'), 'error'); return; }
        setGuardando(true);
        const saldoFinal = saldoCuenta === '' ? 0 : Number(saldoCuenta);
        const { data: { user } } = await supabase.auth.getUser();
        const nueva = { nombre: nombreCuenta, tipo: tipoCuenta, saldo: saldoFinal, banco: bancoCuenta, color: colorCuenta, user_id: user.id };
        const { data, error } = await supabase.from('cuentas').insert([nueva]).select().single();
        if (error) { mostrarToast(t('agregar.noCrearCuenta'), 'error'); setGuardando(false); return; }
        setCuentas(prev => [...prev, data]);
        mostrarToast(t('agregar.cuentaCreada'), 'exito');
        setGuardando(false);
        onClose();
    }

    // ─── Guardar Meta nueva ───
    async function guardarMetaNueva() {
        if (!nombreMeta.trim()) { mostrarToast(t('agregar.nombreObligatorio'), 'error'); return; }
        if (!montoObjetivo || Number(montoObjetivo) <= 0) { mostrarToast(t('agregar.objetivoMayor'), 'error'); return; }
        setGuardando(true);
        const nueva = { nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual || 0, fecha_objetivo: fechaObjetivo, icono: iconoMeta, color: colorMeta, user_id: sesion.user.id };
        // .select().single() devuelve la fila creada con su id: sin él, aportar a
        // la meta antes de recargar descontaba de la cuenta sin sumar a la meta.
        const { data, error } = await supabase.from('metas').insert([nueva]).select().single();
        if (error) { mostrarToast(t('agregar.noCrearMeta'), 'error'); setGuardando(false); return; }
        setMetas(prev => [...prev, data]);
        mostrarToast(t('agregar.metaCreada'), 'exito');
        setGuardando(false);
        onClose();
    }

    function guardar() {
        if (esTransaccion) {
            guardarTransaccion();
        } else if (esTransferencia) {
            guardarTransferencia();
        } else if (tab === 'cuenta') {
            guardarCuentaNueva();
        } else if (tab === 'meta') {
            guardarMetaNueva();
        }
    }

    function cambiarTab(nuevoTab) {
        setTab(nuevoTab);
        setDestino('');
        setCategoria('');
    }

    return (
        <div className="modal-agregar">
            <div className="modal-agregar-header">
                <h2>{transaccionEditar ? t('agregar.tituloEditar') : t('agregar.titulo')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            {!transaccionEditar && (
                <div className="tabs-pildora tabs-pildora-scroll">
                    {['gasto', 'ingreso', 'transferencia', 'aporte', 'cuenta', 'meta'].map((id) => (
                        <button key={id} className={`tab-pildora ${tab === id ? 'activo' : ''}`} onClick={() => cambiarTab(id)}>
                            {t(`agregar.tabs.${id}`)}
                        </button>
                    ))}
                </div>
            )}

            {esTransaccion && (
                <div className="modal-agregar-body">
                    <label>{t('comun.monto')}</label>
                    <input
                        className="campo-pildora"
                        type="text"
                        inputMode="numeric"
                        value={formatearNumero(monto)}
                        onChange={(e) => setMonto(limpiarNumero(e.target.value))}
                        placeholder="0"
                    />

                    <label>{t('comun.categoria')}</label>
                    <DropdownPildora value={categoria} onChange={setCategoria} opciones={categorias} placeholder={t('agregar.seleccionarCategoria')} />

                    <label>{t('comun.cuenta')}</label>
                    <DropdownPildora value={cuenta} onChange={setCuenta} opciones={opcionesCuentas} placeholder={t('comun.seleccionarCuenta')} />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>{t('comun.fecha')}</label>
                            <input className="campo-pildora" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                        </div>
                        <div>
                            <label>{t('agregar.nota')}</label>
                            <input className="campo-pildora" type="text" value={nota} onChange={(e) => setNota(e.target.value)} placeholder={t('comun.opcional')} />
                        </div>
                    </div>
                </div>
            )}

            {esTransferencia && (
                <div className="modal-agregar-body">
                    <label>{t('agregar.desde')}</label>
                    <DropdownPildora
                        value={origen}
                        onChange={setOrigen}
                        opciones={opcionesCuentas}
                        placeholder={t('agregar.seleccionarOrigen')}
                    />

                    <label>{tab === 'aporte' ? t('agregar.meta') : t('agregar.hacia')}</label>
                    <DropdownPildora
                        value={destino}
                        onChange={setDestino}
                        opciones={tab === 'aporte'
                            ? metas.map(m => ({ value: m.nombre_meta, label: m.nombre_meta }))
                            : cuentas.filter(c => c.nombre !== origen).map(c => ({ value: c.nombre, label: c.nombre }))}
                        placeholder={tab === 'aporte' ? t('agregar.seleccionarMeta') : t('agregar.seleccionarDestino')}
                    />

                    <label>{t('comun.monto')}</label>
                    <input
                        className="campo-pildora"
                        type="text"
                        inputMode="numeric"
                        value={formatearNumero(monto)}
                        onChange={(e) => setMonto(limpiarNumero(e.target.value))}
                        placeholder="0"
                    />
                </div>
            )}

            {tab === 'cuenta' && (
                <div className="modal-agregar-body">
                    <label>{t('comun.nombre')}</label>
                    <input className="campo-pildora" type="text" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} placeholder={t('agregar.ejCuenta')} />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>{t('agregar.tipo')}</label>
                            <DropdownPildora
                                value={tipoCuenta}
                                onChange={setTipoCuenta}
                                opciones={['debito', 'efectivo', 'credito'].map(valor => ({ value: valor, label: t(`agregar.tipos.${valor}`) }))}
                                placeholder={t('agregar.tipoCuenta')}
                            />
                        </div>
                        <div>
                            <label>{t('agregar.saldoInicial')}</label>
                            <input
                                className="campo-pildora"
                                type="text"
                                inputMode="numeric"
                                value={formatearNumero(saldoCuenta)}
                                onChange={(e) => setSaldoCuenta(limpiarNumero(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <label>{t('agregar.banco')}</label>
                    <input className="campo-pildora" type="text" value={bancoCuenta} onChange={(e) => setBancoCuenta(e.target.value)} placeholder={t('agregar.ejBanco')} />

                    <label>{t('comun.color')}</label>
                    <div className="color-selector-grid">
                        {COLORES.map((c) => (
                            <div key={c} className={`color-selector-opcion ${colorCuenta === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColorCuenta(c)} />
                        ))}
                    </div>
                </div>
            )}

            {tab === 'meta' && (
                <div className="modal-agregar-body">
                    <label>{t('comun.nombre')}</label>
                    <input className="campo-pildora" type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder={t('agregar.ejMeta')} />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>{t('agregar.objetivo')}</label>
                            <input
                                className="campo-pildora"
                                type="text"
                                inputMode="numeric"
                                value={formatearNumero(montoObjetivo)}
                                onChange={(e) => setMontoObjetivo(limpiarNumero(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label>{t('agregar.fechaLimite')}</label>
                            <input className="campo-pildora" type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />
                        </div>
                    </div>

                    <label>{t('agregar.montoActual')}</label>
                    <input
                        className="campo-pildora"
                        type="text"
                        inputMode="numeric"
                        value={formatearNumero(montoActual)}
                        onChange={(e) => setMontoActual(limpiarNumero(e.target.value))}
                        placeholder="0"
                    />

                    <label>{t('comun.icono')}</label>
                    <div className="icono-selector-grid">
                        {ICONOS_META.map((ic) => (
                            <div key={ic} className={`icono-selector-opcion ${iconoMeta === ic ? 'seleccionado' : ''}`} onClick={() => setIconoMeta(ic)}>
                                <Icon name={ic} />
                            </div>
                        ))}
                    </div>

                    <label>{t('comun.color')}</label>
                    <div className="color-selector-grid">
                        {COLORES.map((c) => (
                            <div key={c} className={`color-selector-opcion ${colorMeta === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColorMeta(c)} />
                        ))}
                    </div>
                </div>
            )}

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : transaccionEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>
        </div>
    );
}

export default ModalAgregar;