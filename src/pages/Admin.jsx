import { useEffect, useState } from 'react';
import './Admin.css';
import { supabase } from '../supabase';
import { Icon } from '../components/Icon';
import { useToast } from '../Context/toast';
import { useConfirmar } from '../Context/confirmar';
import { useIdioma } from '../i18n/idioma';
import { formatearFecha } from '../utils/fechas';
import { paginasVisibles } from '../utils/paginacion';

// Panel de administración.
//
// Todo pasa por funciones SQL de database/migracion_v3_saldos_y_seguridad.sql
// que comprueban en el servidor que quien llama es administrador: esconder el
// enlace del menú es sólo comodidad, la seguridad está en la base de datos.
//
// Por privacidad el panel muestra cifras globales y datos de cuenta (correo,
// rol, estado), nunca los movimientos ni saldos de cada persona.

const POR_PAGINA = 10;

function esFuncionInexistente(error) {
    return error?.code === 'PGRST202' || error?.code === '42883';
}

function Admin({ sesion }) {
    const { t } = useIdioma();
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();
    const miId = sesion?.user?.id;

    const [resumen, setResumen] = useState(null);
    const [sinMigracion, setSinMigracion] = useState(false);
    const [errorResumen, setErrorResumen] = useState(false);

    const [usuarios, setUsuarios] = useState([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(0);
    const [busqueda, setBusqueda] = useState('');
    const [busquedaAplicada, setBusquedaAplicada] = useState('');
    const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
    const [recarga, setRecarga] = useState(0);
    const [ocupado, setOcupado] = useState(null); // id del usuario con una acción en curso

    // ── Resumen ──
    useEffect(() => {
        let vigente = true;
        supabase.rpc('admin_resumen').then(({ data, error }) => {
            if (!vigente) return;
            if (esFuncionInexistente(error)) { setSinMigracion(true); return; }
            if (error) { setErrorResumen(true); return; }
            setResumen(data);
        });
        return () => { vigente = false; };
    }, [recarga]);

    // ── Búsqueda con pausa: no consulta en cada tecla ──
    useEffect(() => {
        const temporizador = setTimeout(() => {
            setBusquedaAplicada(busqueda.trim());
            setPagina(0);
        }, 350);
        return () => clearTimeout(temporizador);
    }, [busqueda]);

    // ── Usuarios ──
    useEffect(() => {
        let vigente = true;
        supabase.rpc('admin_listar_usuarios', {
            p_busqueda: busquedaAplicada,
            p_limite: POR_PAGINA,
            p_desde: pagina * POR_PAGINA,
        }).then(({ data, error }) => {
            if (!vigente) return;
            setCargandoUsuarios(false);
            if (error) {
                if (esFuncionInexistente(error)) setSinMigracion(true);
                else mostrarToast(t('admin.errorUsuarios'), 'error');
                return;
            }
            setUsuarios(data || []);
            setTotal(data?.[0]?.total ? Number(data[0].total) : 0);
        });
        return () => { vigente = false; };
    }, [busquedaAplicada, pagina, recarga, mostrarToast, t]);

    async function cambiarEstado(usuario) {
        const habilitar = !usuario.habilitado;
        const ok = await confirmar({
            titulo: habilitar ? t('admin.confirmarHabilitar') : t('admin.confirmarDeshabilitar'),
            mensaje: t(habilitar ? 'admin.confirmarHabilitarTexto' : 'admin.confirmarDeshabilitarTexto', { correo: usuario.email }),
        });
        if (!ok) return;
        setOcupado(usuario.user_id);
        const { error } = await supabase.rpc('admin_cambiar_estado', { p_user_id: usuario.user_id, p_habilitado: habilitar });
        setOcupado(null);
        if (error) { mostrarToast(error.message || t('admin.errorAccion'), 'error'); return; }
        mostrarToast(habilitar ? t('admin.habilitado') : t('admin.deshabilitado'), 'exito');
        setRecarga(r => r + 1);
    }

    async function cambiarRol(usuario) {
        const hacerAdmin = usuario.rol !== 'admin';
        const ok = await confirmar({
            titulo: hacerAdmin ? t('admin.confirmarHacerAdmin') : t('admin.confirmarQuitarAdmin'),
            mensaje: t(hacerAdmin ? 'admin.confirmarHacerAdminTexto' : 'admin.confirmarQuitarAdminTexto', { correo: usuario.email }),
        });
        if (!ok) return;
        setOcupado(usuario.user_id);
        const { error } = await supabase.rpc('admin_cambiar_rol', { p_user_id: usuario.user_id, p_rol: hacerAdmin ? 'admin' : 'usuario' });
        setOcupado(null);
        if (error) { mostrarToast(error.message || t('admin.errorAccion'), 'error'); return; }
        mostrarToast(hacerAdmin ? t('admin.ahoraAdmin') : t('admin.yaNoAdmin'), 'exito');
        setRecarga(r => r + 1);
    }

    if (sinMigracion) {
        return (
            <div className="admin-page contenido-pagina">
                <div className="page-header">
                    <div>
                        <p className="overline">{t('admin.overline')}</p>
                        <h1>{t('admin.titulo')}</h1>
                    </div>
                </div>
                <div className="estado-vacio card">
                    <Icon name="database" size={28} />
                    <p className="estado-vacio-titulo">{t('admin.sinMigracionTitulo')}</p>
                    <p>{t('admin.sinMigracionTexto')}</p>
                    <code className="admin-codigo">database/migracion_v3_saldos_y_seguridad.sql</code>
                </div>
            </div>
        );
    }

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const maxRegistros = Math.max(1, ...(resumen?.registrosPorMes || []).map(m => m.usuarios));

    const kpis = resumen ? [
        { icono: 'users', clave: 'usuarios', valor: resumen.usuarios, sub: t('admin.nuevosMes', { n: resumen.nuevosMes }) },
        { icono: 'activity', clave: 'activos', valor: resumen.activos30, sub: t('admin.ultimos30') },
        { icono: 'arrow-left-right', clave: 'movimientos', valor: resumen.movimientos, sub: t('admin.esteMes', { n: resumen.movimientosMes }) },
        { icono: 'landmark', clave: 'cuentas', valor: resumen.cuentas, sub: t('admin.metasCreadas', { n: resumen.metas }) },
        { icono: 'shield', clave: 'administradores', valor: resumen.administradores, sub: '' },
        { icono: 'user-x', clave: 'deshabilitados', valor: resumen.deshabilitados, sub: '', alerta: resumen.deshabilitados > 0 },
    ] : [];

    return (
        <div className="admin-page contenido-pagina">
            <div className="page-header">
                <div>
                    <p className="overline">{t('admin.overline')}</p>
                    <h1>{t('admin.titulo')}</h1>
                    <p>{t('admin.subtitulo')}</p>
                </div>
            </div>

            {/* ── Indicadores ── */}
            {errorResumen && <p className="admin-error card">{t('admin.errorResumen')}</p>}
            {!resumen && !errorResumen && <div className="admin-kpis">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card admin-kpi admin-cargando" />)}</div>}
            {resumen && (
                <div className="admin-kpis">
                    {kpis.map(k => (
                        <div key={k.clave} className={`card admin-kpi ${k.alerta ? 'admin-kpi-alerta' : ''}`}>
                            <span className="admin-kpi-icono"><Icon name={k.icono} size={18} /></span>
                            <span className="admin-kpi-etiqueta">{t(`admin.kpi.${k.clave}`)}</span>
                            <strong className="admin-kpi-valor">{Number(k.valor || 0).toLocaleString('es-CO')}</strong>
                            {k.sub && <span className="admin-kpi-sub">{k.sub}</span>}
                        </div>
                    ))}
                </div>
            )}

            {resumen?.registrosPorMes?.length > 0 && (
                <section className="card admin-registros">
                    <h2>{t('admin.registrosPorMes')}</h2>
                    <div className="admin-barras" role="img" aria-label={t('admin.registrosPorMes')}>
                        {resumen.registrosPorMes.map(m => (
                            <div key={m.mes} className="admin-barra">
                                <span className="admin-barra-valor">{m.usuarios}</span>
                                <span className="admin-barra-relleno" style={{ height: `${(m.usuarios / maxRegistros) * 100}%` }} />
                                <span className="admin-barra-mes">{formatearFecha(`${m.mes}-01`, { month: 'short' })}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Usuarios ── */}
            <section className="card admin-usuarios">
                <div className="admin-usuarios-cabecera">
                    <h2>{t('admin.usuarios')} <span className="admin-contador">{total.toLocaleString('es-CO')}</span></h2>
                    <label className="admin-buscar">
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder={t('admin.buscar')}
                            aria-label={t('admin.buscar')}
                        />
                    </label>
                </div>

                {!cargandoUsuarios && usuarios.length === 0 ? (
                    <p className="admin-vacio">{busquedaAplicada ? t('admin.sinResultados') : t('admin.sinUsuarios')}</p>
                ) : (
                    <div className="admin-tabla-scroll">
                        <table className="admin-tabla">
                            <thead>
                                <tr>
                                    <th>{t('admin.col.usuario')}</th>
                                    <th>{t('admin.col.rol')}</th>
                                    <th>{t('admin.col.estado')}</th>
                                    <th>{t('admin.col.registro')}</th>
                                    <th>{t('admin.col.ultimoAcceso')}</th>
                                    <th><span className="sr-only">{t('admin.col.acciones')}</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => {
                                    const soyYo = u.user_id === miId;
                                    return (
                                        <tr key={u.user_id}>
                                            <td>
                                                <div className="admin-usuario">
                                                    <span className="admin-avatar">{(u.nombre || u.email || '?').charAt(0).toUpperCase()}</span>
                                                    <div>
                                                        <b>{u.nombre || t('admin.sinNombre')}{soyYo && <span className="admin-tu"> · {t('admin.tu')}</span>}</b>
                                                        <small>{u.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className={`chip ${u.rol === 'admin' ? 'admin-chip-admin' : ''}`}>{u.rol === 'admin' ? t('admin.rolAdmin') : t('admin.rolUsuario')}</span></td>
                                            <td><span className={`chip ${u.habilitado ? 'chip-positivo' : 'chip-negativo'}`}>{u.habilitado ? t('admin.activo') : t('admin.inactivo')}</span></td>
                                            <td>{formatearFecha(u.creado, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>{u.ultimo_acceso ? formatearFecha(u.ultimo_acceso, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                            <td className="admin-acciones">
                                                <button className="admin-btn" onClick={() => cambiarRol(u)} disabled={soyYo || ocupado === u.user_id}
                                                        title={soyYo ? t('admin.noATiMismo') : undefined}>
                                                    <Icon name={u.rol === 'admin' ? 'shield-off' : 'shield'} size={15} />
                                                    {u.rol === 'admin' ? t('admin.quitarAdmin') : t('admin.hacerAdmin')}
                                                </button>
                                                <button className={`admin-btn ${u.habilitado ? 'admin-btn-peligro' : 'admin-btn-ok'}`}
                                                        onClick={() => cambiarEstado(u)} disabled={soyYo || ocupado === u.user_id}
                                                        title={soyYo ? t('admin.noATiMismo') : undefined}>
                                                    <Icon name={u.habilitado ? 'user-x' : 'user-check'} size={15} />
                                                    {u.habilitado ? t('admin.deshabilitar') : t('admin.habilitar')}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPaginas > 1 && (
                    <nav className="admin-paginacion" aria-label={t('admin.paginacion')}>
                        <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 0} aria-label={t('transacciones.anterior')}>
                            <Icon name="chevron-left" size={16} />
                        </button>
                        {paginasVisibles(pagina, totalPaginas).map(p => (
                            typeof p === 'string'
                                ? <span key={p} className="admin-pag-hueco" aria-hidden="true">…</span>
                                : <button key={p} className={p === pagina ? 'actual' : ''} aria-current={p === pagina ? 'page' : undefined}
                                          onClick={() => setPagina(p)}>{p + 1}</button>
                        ))}
                        <button onClick={() => setPagina(p => p + 1)} disabled={pagina >= totalPaginas - 1} aria-label={t('transacciones.siguiente')}>
                            <Icon name="chevron-right" size={16} />
                        </button>
                    </nav>
                )}
            </section>
        </div>
    );
}

export default Admin;
