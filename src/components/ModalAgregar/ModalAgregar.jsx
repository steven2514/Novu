import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import './ModalAgregar.css';
import { Icon } from '../Icon';
import { supabase } from '../../supabase';
import { useToast } from '../../Context/toast';
import { hoyISO, aInputFecha } from '../../utils/fechas';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../../utils/categorias';
import { ajustarSaldos, ajustarMeta, revertirSaldos, conSaldosNuevos, efectoEnSaldo } from '../../utils/saldos';




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

// ─── Dropdown personalizado ───
// El panel va en un portal (document.body) para que el overflow del modal no lo
// recorte. Se coloca debajo del campo si cabe y, si no, ENCIMA: antes se abría
// siempre hacia abajo y en el campo "Cuenta", que está al final del formulario,
// la lista se salía de la pantalla. Se reubica con el scroll y el resize.
// Accesible con teclado: flechas para moverse, Enter para elegir, Escape/Tab
// para cerrar.
const ALTO_MAX_PANEL = 280;
const MARGEN = 8;

function calcularPosicion(rect, cantidad) {
    const altoIdeal = Math.min(ALTO_MAX_PANEL, cantidad * 42 + 12);
    const abajo = window.innerHeight - rect.bottom - MARGEN;
    const arriba = rect.top - MARGEN;
    const haciaArriba = abajo < altoIdeal && arriba > abajo;
    const disponible = Math.max(120, (haciaArriba ? arriba : abajo) - 6);
    return {
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(ALTO_MAX_PANEL, disponible),
        ...(haciaArriba
            ? { bottom: window.innerHeight - rect.top + 6 }
            : { top: rect.bottom + 6 }),
    };
}

function DropdownPildora({ value, onChange, opciones, placeholder }) {
    const [abierto, setAbierto] = useState(false);
    const [pos, setPos] = useState(null);
    const [activa, setActiva] = useState(-1);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const idLista = useId();

    function cerrar(devolverFoco = false) {
        setAbierto(false);
        if (devolverFoco) triggerRef.current?.focus();
    }

    function abrir() {
        setPos(calcularPosicion(triggerRef.current.getBoundingClientRect(), opciones.length));
        setActiva(Math.max(0, opciones.findIndex(o => o.value === value)));
        setAbierto(true);
    }

    function elegir(opcion) {
        onChange(opcion.value);
        cerrar(true);
    }

    // Clic fuera cierra; scroll o resize reubican el panel junto al campo.
    useEffect(() => {
        if (!abierto) return;
        function clicFuera(e) {
            if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) cerrar();
        }
        function reubicar(e) {
            if (panelRef.current?.contains(e.target)) return; // scroll dentro de la propia lista
            setPos(calcularPosicion(triggerRef.current.getBoundingClientRect(), opciones.length));
        }
        document.addEventListener('mousedown', clicFuera);
        window.addEventListener('scroll', reubicar, true);
        window.addEventListener('resize', reubicar);
        return () => {
            document.removeEventListener('mousedown', clicFuera);
            window.removeEventListener('scroll', reubicar, true);
            window.removeEventListener('resize', reubicar);
        };
    }, [abierto, opciones.length]);

    // La opción activa siempre visible al moverse con las flechas.
    useEffect(() => {
        if (abierto && activa >= 0) {
            panelRef.current?.children[activa]?.scrollIntoView({ block: 'nearest' });
        }
    }, [abierto, activa]);

    function teclado(e) {
        if (!abierto) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir(); }
            return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiva(i => Math.min(opciones.length - 1, i + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiva(i => Math.max(0, i - 1)); }
        else if (e.key === 'Home') { e.preventDefault(); setActiva(0); }
        else if (e.key === 'End') { e.preventDefault(); setActiva(opciones.length - 1); }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (opciones[activa]) elegir(opciones[activa]);
        }
        else if (e.key === 'Escape') { e.preventDefault(); cerrar(true); }
        else if (e.key === 'Tab') cerrar();
    }

    const seleccionada = opciones.find(o => o.value === value);

    return (
        <div className="dropdown-pildora">
            <button
                ref={triggerRef}
                type="button"
                className="campo-pildora dropdown-pildora-trigger"
                onClick={() => (abierto ? cerrar() : abrir())}
                onKeyDown={teclado}
                aria-haspopup="listbox"
                aria-expanded={abierto}
                aria-controls={abierto ? idLista : undefined}
                aria-activedescendant={abierto && activa >= 0 ? `${idLista}-${activa}` : undefined}
            >
                <span className={`dropdown-pildora-valor ${seleccionada ? '' : 'dropdown-placeholder'}`}>
                    {seleccionada ? seleccionada.label : placeholder}
                </span>
                <ChevronDownIcon />
            </button>
            {abierto && pos && createPortal(
                <ul ref={panelRef} id={idLista} role="listbox" className="dropdown-pildora-panel" style={pos}>
                    {opciones.length === 0 && <li className="dropdown-pildora-vacio">{placeholder}</li>}
                    {opciones.map((o, i) => (
                        <li
                            key={o.value}
                            id={`${idLista}-${i}`}
                            role="option"
                            aria-selected={value === o.value}
                            className={`dropdown-pildora-opcion ${value === o.value ? 'seleccionada' : ''} ${i === activa ? 'activa' : ''}`}
                            onMouseEnter={() => setActiva(i)}
                            onMouseDown={(e) => e.preventDefault()} /* el foco se queda en el botón */
                            onClick={() => elegir(o)}
                        >
                            <span>{o.label}</span>
                            {value === o.value && <CheckIcon />}
                        </li>
                    ))}
                </ul>,
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
    // Al editar un movimiento, los campos arrancan con sus datos. El modal se
    // desmonta al cerrarse, así que cada apertura vuelve a inicializarlos.
    const [monto, setMonto] = useState(() => (transaccionEditar ? limpiarNumero(transaccionEditar.monto) : ''));
    const [categoria, setCategoria] = useState(transaccionEditar?.categoria ?? '');
    const [cuenta, setCuenta] = useState(transaccionEditar?.cuenta ?? '');
    const [fecha, setFecha] = useState(() => (transaccionEditar?.fecha ? aInputFecha(transaccionEditar.fecha) : hoyISO()));
    const [nota, setNota] = useState(transaccionEditar?.descripcion || '');

    // ─── Campos: Transferencia / Aporte a meta ───
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');

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
        const cuentaObj = cuentas.find(c => c.nombre === cuenta);

        if (transaccionEditar) {
            // Al editar se deshace el efecto del movimiento original en su cuenta
            // y se aplica el nuevo (puede cambiar el monto y también la cuenta).
            const anterior = transaccionEditar;
            const cuentaAnterior = cuentas.find(c => c.nombre === anterior.cuenta);
            const cambios = { descripcion: nota, monto, categoria, cuenta, fecha };

            const { error } = await supabase.from('transacciones').update(cambios).eq('id', anterior.id);
            if (error) { mostrarToast(t('agregar.noActualizar'), 'error'); setGuardando(false); return; }

            const ajuste = await ajustarSaldos([
                { cuenta: cuentaAnterior, delta: -efectoEnSaldo(anterior.tipo, anterior.monto) },
                { cuenta: cuentaObj, delta: efectoEnSaldo(anterior.tipo, monto) },
            ]);
            if (ajuste.error) {
                // Si el saldo no se pudo corregir, el movimiento vuelve a como estaba
                await supabase.from('transacciones')
                    .update({ descripcion: anterior.descripcion, monto: anterior.monto, categoria: anterior.categoria, cuenta: anterior.cuenta, fecha: anterior.fecha })
                    .eq('id', anterior.id);
                mostrarToast(t('errores.saldo'), 'error');
                setGuardando(false);
                return;
            }

            setTransacciones(prev => prev.map(mov => mov.id === anterior.id ? { ...mov, ...cambios } : mov));
            setCuentas(conSaldosNuevos(ajuste.saldos));
            mostrarToast(t('agregar.transaccionActualizada'), 'exito');
        } else {
            const nueva = { descripcion: nota, monto, tipo: tab, categoria, cuenta, fecha, fuente: '', user_id: sesion.user.id };
            const { data, error } = await supabase.from('transacciones').insert([nueva]).select();
            if (error) { mostrarToast(t('agregar.noGuardar'), 'error'); setGuardando(false); return; }

            const ajuste = await ajustarSaldos([{ cuenta: cuentaObj, delta: efectoEnSaldo(tab, monto) }]);
            if (ajuste.error) {
                // Sin saldo actualizado el movimiento quedaría descuadrado: se borra
                await supabase.from('transacciones').delete().eq('id', data[0].id);
                mostrarToast(t('errores.saldo'), 'error');
                setGuardando(false);
                return;
            }

            setTransacciones(prev => [...prev, ...data]);
            setCuentas(conSaldosNuevos(ajuste.saldos));
            mostrarToast(tab === 'ingreso' ? t('agregar.ingresoAgregado') : t('agregar.gastoAgregado'), 'exito');
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
        const tipoDestino = tab === 'aporte' ? 'meta' : 'cuenta';
        const cuentaDestino = tipoDestino === 'cuenta' ? cuentas.find(c => c.nombre === destino) : null;
        const meta = tipoDestino === 'meta' ? metas.find(m => m.nombre_meta === destino) : null;
        if (!cuentaDestino && !meta) { mostrarToast(t('agregar.completaCampos'), 'error'); return; }
        setGuardando(true);

        // Cada paso se verifica; si uno falla se deshacen los anteriores
        // para que nunca "desaparezca" ni "aparezca" dinero.
        const fallar = async (aplicados, idTransferencia) => {
            await revertirSaldos(aplicados);
            if (idTransferencia) await supabase.from('transferencias').delete().eq('id', idTransferencia);
            mostrarToast(t('errores.transferencia'), 'error');
            setGuardando(false);
        };

        // 1. Registro de la transferencia (historial)
        const nuevaTransferencia = { user_id: sesion.user.id, origen, destino, monto, tipo_destino: tipoDestino, fecha: hoyISO() };
        const { data: registro, error: errorRegistro } = await supabase.from('transferencias').insert([nuevaTransferencia]).select().single();
        if (errorRegistro) { await fallar([]); return; }

        // 2. Saldos: sale de la cuenta de origen (y entra a la de destino si es entre cuentas)
        const ajuste = await ajustarSaldos([
            { cuenta: cuentaOrigen, delta: -Number(monto) },
            { cuenta: cuentaDestino, delta: Number(monto) },
        ]);
        if (ajuste.error) { await fallar([], registro.id); return; }

        // 3. Aporte a meta
        if (meta) {
            const { montoActual, error: errorMeta } = await ajustarMeta(meta, Number(monto));
            if (errorMeta) { await fallar(ajuste.aplicados, registro.id); return; }
            setMetas(prev => prev.map(m => m.id === meta.id ? { ...m, monto_actual: montoActual } : m));
        }

        setCuentas(conSaldosNuevos(ajuste.saldos));
        setGuardando(false);
        mostrarToast(tab === 'aporte' ? t('agregar.aporteOk') : t('agregar.transferenciaOk'), 'exito');
        onClose();
    }

    function guardar() {
        if (esTransaccion) {
            guardarTransaccion();
        } else if (esTransferencia) {
            guardarTransferencia();
        }
    }

    // Abre la página de Cuentas o Metas con su formulario de "nuevo" ya abierto
    const navigate = useNavigate();
    function irA(ruta) {
        onClose();
        navigate(ruta, { state: { abrirNuevo: true } });
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
                <div className="tabs-pildora tabs-movimiento">
                    {['gasto', 'ingreso', 'transferencia', 'aporte'].map((id) => (
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

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando}>
                {guardando ? t('comun.guardando') : transaccionEditar ? t('comun.guardarCambios') : t('comun.guardar')}
            </button>

            {/* Crear cuentas y metas no es un movimiento: se hace en su página,
                que tiene el formulario completo. Estos atajos la abren directo. */}
            {!transaccionEditar && (
                <p className="modal-agregar-atajos">
                    {t('agregar.necesitas')}{' '}
                    <button type="button" onClick={() => irA('/cuentas')}>{t('agregar.crearCuenta')}</button>
                    {' · '}
                    <button type="button" onClick={() => irA('/Metas')}>{t('agregar.crearMeta')}</button>
                </p>
            )}
        </div>
    );
}

export default ModalAgregar;