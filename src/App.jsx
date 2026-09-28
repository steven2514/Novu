import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Modal from './components/Modal/Modal';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import ModalAgregar from './components/ModalAgregar/ModalAgregar';
import { supabase } from './supabase';
import Landing from './pages/Landing';
import Loader from './components/Loader/Loader';
import Splash from './components/Splash/Splash';

// Las páginas se cargan bajo demanda: quien entra a la Landing no descarga el
// panel ni recharts (la librería de gráficas, lo más pesado del proyecto).
// Landing se queda fuera porque es lo primero que ve un visitante.
const Inicio = lazy(() => import('./pages/Inicio'));
const Transacciones = lazy(() => import('./pages/Transacciones'));
const Suscripciones = lazy(() => import('./pages/Suscripciones'));
const Cuenta = lazy(() => import('./pages/Cuentas'));
const Meta = lazy(() => import('./pages/Metas'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Aprendizaje = lazy(() => import('./pages/Aprendizaje'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Presupuestos = lazy(() => import('./pages/Presupuestos'));
const Login = lazy(() => import('./pages/Login'));
const Terminos = lazy(() => import('./pages/Terminos'));
const Privacidad = lazy(() => import('./pages/Privacidad'));
const Admin = lazy(() => import('./pages/Admin'));
import { useToast } from './Context/toast';
import { useConfirmar } from './Context/confirmar';
import { useIdioma } from './i18n/idioma';
import { ajustarSaldos, revertirSaldos, conSaldosNuevos, efectoEnSaldo } from './utils/saldos';



function App() {

    const [tareas, setTareas] = useState([]);
    const [transacciones, setTransacciones] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTipo, setModalTipo] = useState('');
    const [cuentas, setCuentas] = useState([]);
    const [metas, setMetas] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mostrarSplash, setMostrarSplash] = useState(true);
    const [transaccionEditar, setTransaccionEditar] = useState(null);
    const [presupuestos, setPresupuestos] = useState([]);
    // null = cargando, false = la tabla no existe todavía en Supabase
    const [presupuestosDisponibles, setPresupuestosDisponibles] = useState(null);
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();
    const { t } = useIdioma();

    // true si alguna tabla no se pudo cargar: se muestra un aviso con "Reintentar"
    // en vez de pantallas vacías que parecen "no tienes datos".
    const [errorCarga, setErrorCarga] = useState(false);
    const [perfil, setPerfil] = useState(null);
    const [intentoCarga, setIntentoCarga] = useState(0);

    // Depende del id y no del objeto sesión: la sesión cambia cada vez que
    // Supabase renueva el token (≈ cada hora) y eso recargaba todo sin motivo.
    const userId = sesion?.user?.id;

    // Los efectos de carga avisan con toasts traducidos, pero no deben volver a
    // cargar los datos porque cambie el idioma: por eso leen t desde una ref.
    const avisar = useRef({ t, mostrarToast });
    useEffect(() => { avisar.current = { t, mostrarToast }; }, [t, mostrarToast]);
    const avisarDeshabilitada = useCallback(() => {
        avisar.current.mostrarToast(avisar.current.t('admin.cuentaDeshabilitada'), 'error');
    }, []);

    useEffect(() => {
        if (!userId) return;
        let vigente = true;

        const consulta = (tabla) => supabase.from(tabla).select('*').eq('user_id', userId);

        Promise.all([
            consulta('transacciones'), consulta('cuentas'), consulta('metas'),
            consulta('suscripciones'), consulta('tareas'), consulta('presupuestos'),
            consulta('perfiles'),
        ]).then(async ([trans, cuent, met, susc, tar, pres, perf]) => {
            if (!vigente) return;

            // Una cuenta deshabilitada por un administrador no entra.
            const miPerfil = perf.data?.[0] || null;
            if (miPerfil && miPerfil.habilitado === false) {
                avisarDeshabilitada();
                await supabase.auth.signOut();
                return;
            }
            if (!perf.error && !miPerfil) {
                // Primera vez que entra: se crea su perfil.
                supabase.from('perfiles').insert([{ user_id: userId, tours_vistos: '' }]).then(() => { });
            }
            setPerfil(miPerfil);

            if (trans.data) setTransacciones(trans.data);
            if (cuent.data) setCuentas(cuent.data);
            if (met.data) setMetas(met.data);
            if (susc.data) setSuscripciones(susc.data);
            if (tar.data) setTareas(tar.data);
            // Presupuestos es opcional: si la tabla no existe (migración sin
            // ejecutar) la página lo explica; no cuenta como error de carga.
            setPresupuestosDisponibles(!pres.error);
            if (pres.data) setPresupuestos(pres.data);

            setErrorCarga([trans, cuent, met, susc, tar].some(r => r.error));
        });

        return () => { vigente = false; };
    }, [userId, intentoCarga, avisarDeshabilitada]);

    // Al volver a la ventana se revisa si un administrador la deshabilitó
    // mientras tanto (las políticas RLS ya le impiden leer o escribir datos).
    useEffect(() => {
        if (!userId) return;
        async function revisarEstado() {
            const { data } = await supabase.from('perfiles').select('habilitado').eq('user_id', userId).maybeSingle();
            if (data && data.habilitado === false) {
                avisarDeshabilitada();
                await supabase.auth.signOut();
            }
        }
        window.addEventListener('focus', revisarEstado);
        return () => window.removeEventListener('focus', revisarEstado);
    }, [userId, avisarDeshabilitada]);

    // Un movimiento o suscripción que mencionaba la cuenta por su nombre viejo
    // pasa a mostrar el nuevo (en Supabase ya lo cambió utils/cuentas.js).
    function renombrarCuentaEnEstado(anterior, nuevo) {
        const cambiar = (lista) => lista.map(x => (x.cuenta === anterior ? { ...x, cuenta: nuevo } : x));
        setTransacciones(cambiar);
        setSuscripciones(cambiar);
    }

    const esAdmin = perfil?.rol === 'admin';

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSesion(data.session);
            setCargando(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSesion(session);
            if (!session) {
                // Al cerrar sesión no deben quedar en memoria los datos de la
                // cuenta anterior (importa en un computador compartido).
                setTransacciones([]); setCuentas([]); setMetas([]); setSuscripciones([]);
                setTareas([]); setPresupuestos([]); setPresupuestosDisponibles(null);
                setPerfil(null); setErrorCarga(false);
            }
        });
        // Sin esto la suscripción queda viva al desmontar; en desarrollo, con
        // StrictMode, se registraba dos veces.
        return () => subscription.unsubscribe();
    }, []);




    // Abre el modal de transacciones (gasto / ingreso / transferencia / aporte).
    // Se usa tanto para crear como para editar (pasando la transacción existente).
    function abrirModal(tipo, transaccion = null) {
        setModalTipo(tipo);
        setTransaccionEditar(transaccion);
        setModalVisible(true);
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

    if (cargando) {
        return <Loader />;
    }

    if (mostrarSplash) {
        return <Splash onTerminar={cerrarSplash} />;
    }

    function cerrarSplash() {
        setMostrarSplash(false);
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<Loader />}>
            {!sesion ? (
                <Routes>
                    <Route path='/' element={<Landing />} />
                    <Route path='/login' element={<Login onLoginSuccess={() => {
                        supabase.auth.getSession().then(({ data }) => {
                            setSesion(data.session);
                        });
                    }} />} />
                    {/* Los términos y la privacidad se leen ANTES de registrarse:
                        antes estas rutas sólo existían con sesión iniciada y un
                        visitante acababa en la Landing. */}
                    <Route path='/terminos' element={<Terminos />} />
                    <Route path='/privacidad' element={<Privacidad />} />
                    <Route path='*' element={<Landing />} />
                </Routes>
            ) : (
                <div className='layout'>
                    <Sidebar onAgregar={() => abrirModal('gasto')} onTransferir={() => abrirModal('transferencia')} sesion={sesion} esAdmin={esAdmin} />
                    <div className='contenido'>
                        {errorCarga && (
                            <div className="aviso-carga" role="alert">
                                <span>{t('errores.carga')}</span>
                                <button onClick={() => { setErrorCarga(false); setIntentoCarga(n => n + 1); }}>
                                    {t('errores.reintentar')}
                                </button>
                            </div>
                        )}
                        <Routes>

                            <Route path='/transacciones' element={<Transacciones transacciones={transacciones} setTransacciones={setTransacciones} abrirModal={abrirModal} eliminar={eliminar} sesion={sesion} />} />

                            <Route path='/' element={<Inicio transacciones={transacciones} metas={metas} suscripciones={suscripciones} cuentas={cuentas} presupuestos={presupuestos} sesion={sesion} abrirModal={abrirModal} />} />

                            <Route path='/cuentas' element={<Cuenta cuentas={cuentas} setCuentas={setCuentas} sesion={sesion} abrirModalTransferencia={() => abrirModal('transferencia')} onCuentaRenombrada={renombrarCuentaEnEstado} />} />

                            <Route path='/Suscripciones' element={<Suscripciones cuentas={cuentas} suscripciones={suscripciones} setSuscripciones={setSuscripciones} setCuentas={setCuentas} setTransacciones={setTransacciones} sesion={sesion} />} />


                            <Route path='/Metas' element={<Meta metas={metas} setMetas={setMetas} sesion={sesion} />} />

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
                        <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}>
                            <ModalAgregar
                                setTransacciones={setTransacciones}
                                cuentas={cuentas}
                                setCuentas={setCuentas}
                                metas={metas}
                                setMetas={setMetas}
                                sesion={sesion}
                                onClose={() => { setModalVisible(false); setTransaccionEditar(null); }}
                                transaccionEditar={transaccionEditar}
                                tipoInicial={modalTipo}
                            />
                        </Modal>
                    </div>
                </div>
            )}
            </Suspense>
        </BrowserRouter>
    );
}

export default App;