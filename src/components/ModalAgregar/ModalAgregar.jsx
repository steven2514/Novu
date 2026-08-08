import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import './ModalAgregar.css';
import { Icon, ICONOS_META } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/ToastContext';

const CATEGORIAS_INGRESO = [
    { value: 'salario', label: 'Salario' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'regalo', label: 'Regalo' },
    { value: 'otros', label: 'Otros' },
];

const CATEGORIAS_GASTO = [
    { value: 'comida', label: 'Comida' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'ocio', label: 'Ocio' },
    { value: 'salud', label: 'Salud' },
    { value: 'compras', label: 'Compras' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otros', label: 'Otros' },
];

const COLORES = ['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4', '#00E676'];

function fechaHoyInput() {
    return new Date().toISOString().split('T')[0];
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
    const [guardando, setGuardando] = useState(false);

    // ─── Campos: Gasto / Ingreso ───
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [fecha, setFecha] = useState(fechaHoyInput());
    const [nota, setNota] = useState('');

    // ─── Campos: Transferencia / Aporte a meta ───
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');

    // ─── Campos: Cuenta nueva ───
    const [nombreCuenta, setNombreCuenta] = useState('');
    const [tipoCuenta, setTipoCuenta] = useState('debito');
    const [saldoCuenta, setSaldoCuenta] = useState('');
    const [bancoCuenta, setBancoCuenta] = useState('');
    const [colorCuenta, setColorCuenta] = useState('#6C63FF');

    // ─── Campos: Meta nueva ───
    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState('');
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [iconoMeta, setIconoMeta] = useState('target');
    const [colorMeta, setColorMeta] = useState('#6C63FF');

    useEffect(() => {
        if (transaccionEditar) {
            setMonto(transaccionEditar.monto);
            setCategoria(transaccionEditar.categoria);
            setCuenta(transaccionEditar.cuenta);
            setNota(transaccionEditar.descripcion || '');
            if (transaccionEditar.fecha) {
                setFecha(new Date(transaccionEditar.fecha).toISOString().split('T')[0]);
            }
        }
    }, [transaccionEditar]);

    const esTransaccion = tab === 'gasto' || tab === 'ingreso';
    const esTransferencia = tab === 'transferencia' || tab === 'aporte';
    const categorias = tab === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
    const opcionesCuentas = cuentas.map(c => ({ value: c.nombre, label: c.nombre }));

    // ─── Guardar Gasto / Ingreso ───
    async function guardarTransaccion() {
        setGuardando(true);
        if (transaccionEditar) {
            const { error } = await supabase.from('transacciones').update({ descripcion: nota, monto, categoria, cuenta }).eq('id', transaccionEditar.id);
            if (error) { mostrarToast('No se pudo actualizar', 'error'); setGuardando(false); return; }
            mostrarToast('Transacción actualizada', 'exito');
            setTransacciones(prev => prev.map(t => t.id === transaccionEditar.id ? { ...t, descripcion: nota, monto, categoria, cuenta } : t));
        } else {
            const nueva = { descripcion: nota, monto, tipo: tab, categoria, cuenta, fecha: new Date(fecha).toISOString(), fuente: '', user_id: sesion.user.id };
            const { data, error } = await supabase.from('transacciones').insert([nueva]).select();
            if (error) { mostrarToast('No se pudo guardar la transacción', 'error'); setGuardando(false); return; }
            mostrarToast(tab === 'ingreso' ? 'Ingreso agregado' : 'Gasto agregado', 'exito');
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
        if (!origen || !destino || !monto) { mostrarToast('Completa todos los campos', 'error'); return; }
        const cuentaOrigen = cuentas.find(c => c.nombre === origen);
        if (!cuentaOrigen || Number(cuentaOrigen.saldo) < Number(monto)) { mostrarToast('Saldo insuficiente en la cuenta de origen', 'error'); return; }
        setGuardando(true);
        const tipoDestino = tab === 'aporte' ? 'meta' : 'cuenta';
        const nuevaTransferencia = { user_id: sesion.user.id, origen, destino, monto, tipo_destino: tipoDestino, fecha: new Date().toISOString() };
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
        mostrarToast(tab === 'aporte' ? 'Aporte realizado con éxito' : 'Transferencia realizada con éxito', 'exito');
        onClose();
    }

    // ─── Guardar Cuenta nueva ───
    async function guardarCuentaNueva() {
        if (!nombreCuenta.trim()) { mostrarToast('El nombre es obligatorio', 'error'); return; }
        setGuardando(true);
        const saldoFinal = saldoCuenta === '' ? 0 : Number(saldoCuenta);
        const { data: { user } } = await supabase.auth.getUser();
        const nueva = { nombre: nombreCuenta, tipo: tipoCuenta, saldo: saldoFinal, banco: bancoCuenta, color: colorCuenta, user_id: user.id };
        const { data, error } = await supabase.from('cuentas').insert([nueva]).select().single();
        if (error) { mostrarToast('No se pudo crear la cuenta', 'error'); setGuardando(false); return; }
        setCuentas(prev => [...prev, data]);
        mostrarToast('Cuenta creada correctamente', 'exito');
        setGuardando(false);
        onClose();
    }

    // ─── Guardar Meta nueva ───
    async function guardarMetaNueva() {
        if (!nombreMeta.trim()) { mostrarToast('El nombre es obligatorio', 'error'); return; }
        setGuardando(true);
        const nueva = { nombre_meta: nombreMeta, monto_objetivo: montoObjetivo, monto_actual: montoActual || 0, fecha_objetivo: fechaObjetivo, icono: iconoMeta, color: colorMeta, user_id: sesion.user.id };
        const { error } = await supabase.from('metas').insert([nueva]);
        if (error) { mostrarToast('No se pudo crear la meta', 'error'); setGuardando(false); return; }
        setMetas(prev => [...prev, nueva]);
        mostrarToast('Meta creada correctamente', 'exito');
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
                <h2>Agregar</h2>
                <button className="btn-cerrar-modal" onClick={onClose}><Icon name="x" /></button>
            </div>

            {!transaccionEditar && (
                <div className="tabs-pildora tabs-pildora-scroll">
                    <button className={`tab-pildora ${tab === 'gasto' ? 'activo' : ''}`} onClick={() => cambiarTab('gasto')}>Gasto</button>
                    <button className={`tab-pildora ${tab === 'ingreso' ? 'activo' : ''}`} onClick={() => cambiarTab('ingreso')}>Ingreso</button>
                    <button className={`tab-pildora ${tab === 'transferencia' ? 'activo' : ''}`} onClick={() => cambiarTab('transferencia')}>Transferencia</button>
                    <button className={`tab-pildora ${tab === 'aporte' ? 'activo' : ''}`} onClick={() => cambiarTab('aporte')}>Aporte a meta</button>
                    <button className={`tab-pildora ${tab === 'cuenta' ? 'activo' : ''}`} onClick={() => cambiarTab('cuenta')}>Cuenta</button>
                    <button className={`tab-pildora ${tab === 'meta' ? 'activo' : ''}`} onClick={() => cambiarTab('meta')}>Meta</button>
                </div>
            )}

            {esTransaccion && (
                <div className="modal-agregar-body">
                    <label>Monto</label>
                    <input className="campo-pildora" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />

                    <label>Categoría</label>
                    <DropdownPildora value={categoria} onChange={setCategoria} opciones={categorias} placeholder="Seleccionar categoría" />

                    <label>Cuenta</label>
                    <DropdownPildora value={cuenta} onChange={setCuenta} opciones={opcionesCuentas} placeholder="Seleccionar cuenta" />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>Fecha</label>
                            <input className="campo-pildora" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                        </div>
                        <div>
                            <label>Nota</label>
                            <input className="campo-pildora" type="text" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Opcional" />
                        </div>
                    </div>
                </div>
            )}

            {esTransferencia && (
                <div className="modal-agregar-body">
                    <label>Desde la cuenta</label>
                    <DropdownPildora
                        value={origen}
                        onChange={setOrigen}
                        opciones={opcionesCuentas}
                        placeholder="Seleccionar cuenta de origen"
                    />

                    <label>{tab === 'aporte' ? 'Meta' : 'Hacia la cuenta'}</label>
                    <DropdownPildora
                        value={destino}
                        onChange={setDestino}
                        opciones={tab === 'aporte'
                            ? metas.map(m => ({ value: m.nombre_meta, label: m.nombre_meta }))
                            : cuentas.filter(c => c.nombre !== origen).map(c => ({ value: c.nombre, label: c.nombre }))}
                        placeholder={tab === 'aporte' ? 'Seleccionar meta' : 'Seleccionar cuenta destino'}
                    />

                    <label>Monto</label>
                    <input className="campo-pildora" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
                </div>
            )}

            {tab === 'cuenta' && (
                <div className="modal-agregar-body">
                    <label>Nombre</label>
                    <input className="campo-pildora" type="text" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} placeholder="Ej: Cuenta Principal" />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>Tipo</label>
                            <DropdownPildora
                                value={tipoCuenta}
                                onChange={setTipoCuenta}
                                opciones={[
                                    { value: 'debito', label: 'Débito' },
                                    { value: 'efectivo', label: 'Efectivo' },
                                    { value: 'credito', label: 'Crédito' },
                                ]}
                                placeholder="Tipo de cuenta"
                            />
                        </div>
                        <div>
                            <label>Saldo inicial</label>
                            <input className="campo-pildora" type="number" value={saldoCuenta} onChange={(e) => setSaldoCuenta(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>

                    <label>Banco (opcional)</label>
                    <input className="campo-pildora" type="text" value={bancoCuenta} onChange={(e) => setBancoCuenta(e.target.value)} placeholder="Ej: Banco Nacional" />

                    <label>Color</label>
                    <div className="color-selector-grid">
                        {COLORES.map((c) => (
                            <div key={c} className={`color-selector-opcion ${colorCuenta === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColorCuenta(c)} />
                        ))}
                    </div>
                </div>
            )}

            {tab === 'meta' && (
                <div className="modal-agregar-body">
                    <label>Nombre</label>
                    <input className="campo-pildora" type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder="Ej: Iphone 16" />

                    <div className="modal-agregar-fila-doble">
                        <div>
                            <label>Objetivo</label>
                            <input className="campo-pildora" type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0" />
                        </div>
                        <div>
                            <label>Fecha límite</label>
                            <input className="campo-pildora" type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} />
                        </div>
                    </div>

                    <label>Monto actual (opcional)</label>
                    <input className="campo-pildora" type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0" />

                    <label>Icono</label>
                    <div className="icono-selector-grid">
                        {ICONOS_META.map((ic) => (
                            <div key={ic} className={`icono-selector-opcion ${iconoMeta === ic ? 'seleccionado' : ''}`} onClick={() => setIconoMeta(ic)}>
                                <Icon name={ic} />
                            </div>
                        ))}
                    </div>

                    <label>Color</label>
                    <div className="color-selector-grid">
                        {COLORES.map((c) => (
                            <div key={c} className={`color-selector-opcion ${colorMeta === c ? 'seleccionado' : ''}`} style={{ backgroundColor: c }} onClick={() => setColorMeta(c)} />
                        ))}
                    </div>
                </div>
            )}

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : transaccionEditar ? 'Guardar Cambios' : 'Guardar'}
            </button>
        </div>
    );
}

export default ModalAgregar;