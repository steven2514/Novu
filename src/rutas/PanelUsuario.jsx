import { lazy, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Modal from '../components/Modal/Modal';
import ModalAgregar from '../components/ModalAgregar/ModalAgregar';
import { supabase } from '../supabase';
import { useToast } from '../Context/toast';
import { useConfirmar } from '../Context/confirmar';
import { useIdioma } from '../i18n/idioma';
import { ajustarSaldos, revertirSaldos, conSaldosNuevos, efectoEnSaldo } from '../utils/saldos';

// Las páginas se cargan bajo demanda: quien entra a la Landing no descarga el
// panel ni recharts (la librería de gráficas, lo más pesado del proyecto).
const Inicio = lazy(() => import('../pages/Inicio'));
const Transacciones = lazy(() => import('../pages/Transacciones'));
const Suscripciones = lazy(() => import('../pages/Suscripciones'));
const Cuentas = lazy(() => import('../pages/Cuentas'));
const Metas = lazy(() => import('../pages/Metas'));
const Calendario = lazy(() => import('../pages/Calendario'));
const Aprendizaje = lazy(() => import('../pages/Aprendizaje'));
const Perfil = lazy(() => import('../pages/Perfil'));
const Presupuestos = lazy(() => import('../pages/Presupuestos'));
const Terminos = lazy(() => import('../pages/Terminos'));
const Privacidad = lazy(() => import('../pages/Privacidad'));
const Admin = lazy(() => import('../pages/Admin'));

// Panel con sesión iniciada: menú lateral, páginas y el modal de movimientos.
function PanelUsuario({ datos }) {
    const {
        sesion, setSesion, esAdmin, errorCarga, reintentarCarga,
        transacciones, setTransacciones, cuentas, setCuentas, metas, setMetas,
        suscripciones, setSuscripciones, tareas, setTareas,
        presupuestos, setPresupuestos, presupuestosDisponibles, renombrarCuentaEnEstado,
    } = datos;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [transaccionEditar, setTransaccionEditar] = useState(null);
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();
    const { t } = useIdioma();

    // Abre el modal de transacciones (gasto / ingreso / transferencia / aporte).
    // Se usa tanto para crear como para editar (pasando la transacción existente).
    function abrirModal(tipo, transaccion = null) {
        setModalTipo(tipo);
        setTransaccionEditar(transaccion);
        setModalVisible(true);
    }

    function cerrarModal() {
        setModalVisible(false);
        setTransaccionEditar(null);
    }

    // Elimina un movimiento y devuelve su efecto al saldo de la cuenta.
    // Primero se ajusta el saldo (se puede revertir) y luego se borra el
    // movimiento; si el borrado falla, el saldo vuelve a como estaba.
    async function eliminar(id) {
        const transaccion = transacciones.find(mov => mov.id === id);
        if (!transaccion) return;

        const aceptado = await confirmar({
            titulo: t('confirmar.eliminarMovimiento'),
            mensaje: t('confirmar.eliminarMovimientoTexto', { nombre: transaccion.descripcion || t('comun.sinDescripcion') }),
        });
        if (!aceptado) return;

        const cuentaActual = cuentas.find(c => c.nombre === transaccion.cuenta);
        const ajuste = await ajustarSaldos([{ cuenta: cuentaActual, delta: -efectoEnSaldo(transaccion.tipo, transaccion.monto) }]);
        if (ajuste.error) { mostrarToast(t('errores.saldo'), 'error'); return; }

        const { error } = await supabase.from('transacciones').delete().eq('id', id);
        if (error) {
            await revertirSaldos(ajuste.aplicados);
            mostrarToast(t('confirmar.noSePudoEliminar'), 'error');
            return;
        }

        setTransacciones(prev => prev.filter(mov => mov.id !== id));
        setCuentas(conSaldosNuevos(ajuste.saldos));
        mostrarToast(t('confirmar.eliminado'), 'exito');
    }

    return (
        <div className='layout'>
            <Sidebar onAgregar={() => abrirModal('gasto')} onTransferir={() => abrirModal('transferencia')} sesion={sesion} esAdmin={esAdmin} />
            <div className='contenido'>
                {errorCarga && (
                    <div className="aviso-carga" role="alert">
                        <span>{t('errores.carga')}</span>
                        <button onClick={reintentarCarga}>{t('errores.reintentar')}</button>
                    </div>
                )}
                <Routes>
                    <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} presupuestos={presupuestos} sesion={sesion} abrirModal={abrirModal} />} />
                    <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} sesion={sesion} />} />
                    <Route path='/cuentas' element={<Cuentas cuentas={cuentas} setCuentas={setCuentas} sesion={sesion} abrirModalTransferencia={() => abrirModal('transferencia')} onCuentaRenombrada={renombrarCuentaEnEstado} />} />
                    <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} setTransacciones={setTransacciones} sesion={sesion} />} />
                    <Route path='/Metas' element={<Metas metas={metas} setMetas={setMetas} sesion={sesion} />} />
                    <Route path='/Calendario' element={<Calendario metas={metas} transacciones={transacciones} suscripciones={suscripciones} tareas={tareas} sesion={sesion} />} />
                    <Route path='/presupuestos' element={<Presupuestos presupuestos={presupuestos} setPresupuestos={setPresupuestos} disponibles={presupuestosDisponibles} transacciones={transacciones} sesion={sesion} />} />
                    <Route path='/Aprendizaje' element={<Aprendizaje tareas={tareas} setTareas={setTareas} sesion={sesion} />} />
                    <Route path='/perfil' element={<Perfil sesion={sesion} setSesion={setSesion} />} />

                    {/* Sólo aparece para administradores. Aunque alguien escriba
                        /admin a mano, las funciones SQL comprueban el rol en el
                        servidor y no devuelven nada a quien no lo es. */}
                    {esAdmin && <Route path='/admin' element={<Admin sesion={sesion} />} />}

                    <Route path='/login' element={<Navigate to="/" replace />} />
                    <Route path='/terminos' element={<Terminos />} />
                    <Route path='/privacidad' element={<Privacidad />} />
                    <Route path='*' element={<Navigate to="/" replace />} />
                </Routes>

                {/* Modal único: Gasto / Ingreso / Transferencia / Aporte a meta (con pestañas) */}
                <Modal visible={modalVisible} titulo={transaccionEditar ? t('agregar.tituloEditar') : t('agregar.titulo')} onClose={cerrarModal}>
                    <ModalAgregar
                        setTransacciones={setTransacciones}
                        cuentas={cuentas}
                        setCuentas={setCuentas}
                        metas={metas}
                        setMetas={setMetas}
                        sesion={sesion}
                        onClose={cerrarModal}
                        transaccionEditar={transaccionEditar}
                        tipoInicial={modalTipo}
                    />
                </Modal>
            </div>
        </div>
    );
}

export default PanelUsuario;
