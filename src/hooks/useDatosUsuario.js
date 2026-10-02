import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { useToast } from '../Context/toast';
import { useIdioma } from '../i18n/idioma';
import { usePreferencias } from '../Context/preferencias';

// Sesión y datos del usuario (movimientos, cuentas, metas, suscripciones,
// tareas, presupuestos y perfil). Antes vivía todo dentro de App.jsx.
export function useDatosUsuario() {
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [tareas, setTareas] = useState([]);
    const [transacciones, setTransacciones] = useState([]);
    const [cuentas, setCuentas] = useState([]);
    const [metas, setMetas] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [presupuestos, setPresupuestos] = useState([]);
    // null = cargando, false = la tabla no existe todavía en Supabase
    const [presupuestosDisponibles, setPresupuestosDisponibles] = useState(null);
    const [perfil, setPerfil] = useState(null);

    // true si alguna tabla no se pudo cargar: se muestra un aviso con "Reintentar"
    // en vez de pantallas vacías que parecen "no tienes datos".
    const [errorCarga, setErrorCarga] = useState(false);
    const [intentoCarga, setIntentoCarga] = useState(0);

    const { mostrarToast } = useToast();
    const { t } = useIdioma();
    const { cambiarMoneda } = usePreferencias();

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
            // La moneda elegida en el perfil se aplica en todo el panel
            if (miPerfil?.moneda) cambiarMoneda(miPerfil.moneda);

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
    }, [userId, intentoCarga, avisarDeshabilitada, cambiarMoneda]);

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

    // Un movimiento o suscripción que mencionaba la cuenta por su nombre viejo
    // pasa a mostrar el nuevo (en Supabase ya lo cambió utils/cuentas.js).
    const renombrarCuentaEnEstado = useCallback((anterior, nuevo) => {
        const cambiar = (lista) => lista.map(x => (x.cuenta === anterior ? { ...x, cuenta: nuevo } : x));
        setTransacciones(cambiar);
        setSuscripciones(cambiar);
    }, []);

    const reintentarCarga = useCallback(() => {
        setErrorCarga(false);
        setIntentoCarga(n => n + 1);
    }, []);

    return {
        sesion, setSesion, cargando, perfil, esAdmin: perfil?.rol === 'admin',
        errorCarga, reintentarCarga,
        transacciones, setTransacciones,
        cuentas, setCuentas,
        metas, setMetas,
        suscripciones, setSuscripciones,
        tareas, setTareas,
        presupuestos, setPresupuestos, presupuestosDisponibles,
        renombrarCuentaEnEstado,
    };
}
