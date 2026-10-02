import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './ModalAgregar.css';
import { Icon } from '../Icon';
import { useToast } from '../../Context/toast';
import { hoyISO, aInputFecha } from '../../utils/fechas';
import { useIdioma } from '../../i18n/idioma';
import { conSaldosNuevos } from '../../utils/saldos';
import { crearMovimiento, editarMovimiento, transferir } from '../../utils/operaciones';
import { aPesos, montoParaCampo } from '../../utils/moneda';
import { CamposMovimiento, CamposTransferencia } from './CamposMovimiento';

const PESTANAS = ['gasto', 'ingreso', 'transferencia', 'aporte'];

// Al editar un movimiento, los campos arrancan con sus datos. El modal se
// desmonta al cerrarse, así que cada apertura vuelve a inicializarlos.
// "monto" está en la moneda elegida; al guardar se pasa a pesos con aPesos().
function camposIniciales(editar) {
    return {
        monto: montoParaCampo(editar?.monto),
        categoria: editar?.categoria ?? '',
        cuenta: editar?.cuenta ?? '',
        fecha: editar?.fecha ? aInputFecha(editar.fecha) : hoyISO(),
        nota: editar?.descripcion || '',
        origen: '',
        destino: '',
    };
}

// Primer dato que falta en un gasto/ingreso (clave del mensaje) o null
function faltaEnMovimiento({ monto, categoria, cuenta, fecha }) {
    if (!monto || Number(monto) <= 0) return 'agregar.montoMayor';
    if (!categoria) return 'agregar.seleccionaCategoria';
    if (!cuenta) return 'agregar.seleccionaCuenta';
    if (!fecha) return 'agregar.seleccionaFecha';
    return null;
}

function ModalAgregar({ setTransacciones, cuentas, setCuentas, metas, setMetas, sesion, onClose, transaccionEditar, tipoInicial }) {
    // Si se edita un movimiento existente, se fija en su pestaña y se ocultan las demás
    const [tab, setTab] = useState(transaccionEditar ? transaccionEditar.tipo : (tipoInicial || 'gasto'));
    const [campos, setCampos] = useState(() => camposIniciales(transaccionEditar));
    const [guardando, setGuardando] = useState(false);
    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const navigate = useNavigate();

    const esTransferencia = tab === 'transferencia' || tab === 'aporte';
    const cambiar = (campo, valor) => setCampos(prev => ({ ...prev, [campo]: valor }));

    // ─── Gasto / Ingreso ───
    async function guardarMovimiento() {
        const falta = faltaEnMovimiento(campos);
        if (falta) { mostrarToast(t(falta), 'error'); return; }

        // Al editar se deshace el efecto del movimiento original y se aplica el nuevo
        const anterior = transaccionEditar;
        const datos = {
            monto: aPesos(campos.monto, anterior?.monto),
            categoria: campos.categoria, cuenta: campos.cuenta, fecha: campos.fecha,
            descripcion: campos.nota, cuentas,
        };
        setGuardando(true);
        const r = anterior
            ? await editarMovimiento({ ...datos, anterior })
            : await crearMovimiento({ ...datos, tipo: tab, userId: sesion.user.id });
        setGuardando(false);
        if (r.error) { mostrarToast(t(r.error), 'error'); return; }

        if (anterior) {
            setTransacciones(prev => prev.map(mov => mov.id === anterior.id ? { ...mov, ...r.cambios } : mov));
        } else {
            setTransacciones(prev => [...prev, ...r.transacciones]);
        }
        setCuentas(conSaldosNuevos(r.saldos));
        const mensaje = anterior ? 'agregar.transaccionActualizada' : tab === 'ingreso' ? 'agregar.ingresoAgregado' : 'agregar.gastoAgregado';
        mostrarToast(t(mensaje), 'exito');
        onClose();
    }

    // ─── Transferencia / Aporte a meta ───
    async function guardarTransferencia() {
        setGuardando(true);
        const r = await transferir({
            origen: campos.origen, destino: campos.destino, monto: campos.monto && aPesos(campos.monto),
            cuentas, metas, userId: sesion.user.id,
            tipoDestino: tab === 'aporte' ? 'meta' : 'cuenta',
        });
        setGuardando(false);
        if (r.error) { mostrarToast(t(r.error), 'error'); return; }

        if (r.meta) setMetas(prev => prev.map(m => m.id === r.meta.id ? { ...m, monto_actual: r.meta.montoActual } : m));
        setCuentas(conSaldosNuevos(r.saldos));
        mostrarToast(tab === 'aporte' ? t('agregar.aporteOk') : t('agregar.transferenciaOk'), 'exito');
        onClose();
    }

    // Abre la página de Cuentas o Metas con su formulario de "nuevo" ya abierto
    function irA(ruta) {
        onClose();
        navigate(ruta, { state: { abrirNuevo: true } });
    }

    function cambiarTab(nuevoTab) {
        setTab(nuevoTab);
        setCampos(prev => ({ ...prev, destino: '', categoria: '' }));
    }

    const textoBoton = guardando ? 'comun.guardando' : transaccionEditar ? 'comun.guardarCambios' : 'comun.guardar';

    return (
        <div className="modal-agregar">
            <div className="modal-agregar-header">
                <h2>{transaccionEditar ? t('agregar.tituloEditar') : t('agregar.titulo')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            {!transaccionEditar && (
                <div className="tabs-pildora tabs-movimiento">
                    {PESTANAS.map((id) => (
                        <button key={id} className={`tab-pildora ${tab === id ? 'activo' : ''}`} onClick={() => cambiarTab(id)}>
                            {t(`agregar.tabs.${id}`)}
                        </button>
                    ))}
                </div>
            )}

            {esTransferencia
                ? <CamposTransferencia esAporte={tab === 'aporte'} campos={campos} cambiar={cambiar} cuentas={cuentas} metas={metas} />
                : <CamposMovimiento tipo={tab} campos={campos} cambiar={cambiar} cuentas={cuentas} />}

            <button className="btn-guardar-gradiente" onClick={esTransferencia ? guardarTransferencia : guardarMovimiento} disabled={guardando}>
                {t(textoBoton)}
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
