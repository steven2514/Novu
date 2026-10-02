import { useState, useId } from 'react';
import './Presupuestos.css';
import { supabase } from '../supabase';
import Modal from '../components/Modal/Modal';
import { Icon } from '../components/Icon';
import { useToast } from '../Context/toast';
import { useConfirmar } from '../Context/confirmar';
import { useIdioma, nombreCategoria } from '../i18n/idioma';
import { parseFecha, mismoMes } from '../utils/fechas';
import { CATEGORIAS_GASTO, ICONO_CATEGORIA } from '../utils/categorias';
import { dinero, aPesos, montoParaCampo } from '../utils/moneda';
import { usePreferencias } from '../Context/preferencias';
import CampoMonto from '../components/CampoMonto';


// A partir del 80% del límite se avisa; por encima del 100% está excedido
function estadoDe(porcentaje) {
    if (porcentaje > 100) return 'excedido';
    if (porcentaje >= 80) return 'alerta';
    return 'ok';
}

function FormularioPresupuesto({ presupuesto, categoriaInicial, disponibles, onGuardar, onClose }) {
    // Ids para conectar cada etiqueta con su campo (accesibilidad)
    const idForm = useId();
    const { t } = useIdioma();
    const [categoria, setCategoria] = useState(presupuesto?.categoria || categoriaInicial || disponibles[0] || '');
    const { moneda } = usePreferencias();
    const [monto, setMonto] = useState(() => montoParaCampo(presupuesto?.monto));
    const [guardando, setGuardando] = useState(false);
    const opciones = presupuesto ? [presupuesto.categoria] : disponibles;

    async function guardar() {
        setGuardando(true);
        const ok = await onGuardar({ categoria, monto: aPesos(monto, presupuesto?.monto) });
        setGuardando(false);
        if (ok) onClose();
    }

    return (
        <div className="formulario-presupuesto">
            <div className="modal-kaipo-header">
                <h2>{presupuesto ? t('presupuestos.editar') : t('presupuestos.nuevo')}</h2>
                <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
            </div>

            <div className="modal-kaipo-body">
                <p className="etiqueta-campo">{t('comun.categoria')}</p>
                <div className="pres-form-categorias">
                    {opciones.map((valor) => (
                        <button
                            key={valor}
                            type="button"
                            className={`pres-form-categoria ${categoria === valor ? 'activa' : ''}`}
                            onClick={() => setCategoria(valor)}
                            disabled={!!presupuesto}
                        >
                            <Icon name={ICONO_CATEGORIA[valor] || 'wallet'} size={16} />
                            {nombreCategoria(valor)}
                        </button>
                    ))}
                </div>

                <label htmlFor={`${idForm}-1`}>{t('presupuestos.limiteMensual')} ({moneda})</label>
                <CampoMonto id={`${idForm}-1`} value={monto} onChange={setMonto} />
                <p className="pres-form-ayuda">{t('presupuestos.ayudaLimite')}</p>
            </div>

            <button className="btn-guardar-gradiente" onClick={guardar} disabled={guardando || !categoria || !Number(monto)}>
                {guardando ? t('comun.guardando') : t('comun.guardar')}
            </button>
        </div>
    );
}

function Presupuestos({ presupuestos, setPresupuestos, disponibles, transacciones, sesion }) {
    const { t, locale } = useIdioma();
    const { mostrarToast } = useToast();
    const confirmar = useConfirmar();

    const [mes, setMes] = useState(new Date());
    const [formulario, setFormulario] = useState(null); // { presupuesto?, categoria? }

    const hoy = new Date();
    const esMesActual = mismoMes(hoy, mes);
    const diasRestantes = esMesActual
        ? new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate() - hoy.getDate() + 1
        : 0;

    // Gasto del mes por categoría
    const gastoPorCategoria = transacciones
        .filter(mov => mov.tipo === 'gasto' && mismoMes(parseFecha(mov.fecha), mes))
        .reduce((acc, mov) => {
            const clave = mov.categoria || 'otros';
            acc[clave] = (acc[clave] || 0) + Number(mov.monto);
            return acc;
        }, {});

    const filas = presupuestos
        .map(p => {
            const gastado = gastoPorCategoria[p.categoria] || 0;
            const limite = Number(p.monto);
            const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0;
            return { ...p, gastado, limite, porcentaje, estado: estadoDe(porcentaje) };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    const totalLimite = filas.reduce((acc, f) => acc + f.limite, 0);
    const totalGastado = filas.reduce((acc, f) => acc + f.gastado, 0);
    const porcentajeTotal = totalLimite > 0 ? (totalGastado / totalLimite) * 100 : 0;
    const excedidos = filas.filter(f => f.estado === 'excedido').length;

    const categoriasConPresupuesto = new Set(presupuestos.map(p => p.categoria));
    const categoriasLibres = CATEGORIAS_GASTO.filter(c => !categoriasConPresupuesto.has(c));
    const sinPresupuesto = Object.entries(gastoPorCategoria)
        .filter(([categoria]) => !categoriasConPresupuesto.has(categoria))
        .sort((a, b) => b[1] - a[1]);

    const nombreMes = mes.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

    async function guardarPresupuesto({ categoria, monto }) {
        const existente = presupuestos.find(p => p.categoria === categoria);
        if (existente) {
            const { error } = await supabase.from('presupuestos').update({ monto }).eq('id', existente.id);
            if (error) { mostrarToast(t('presupuestos.errorGuardar'), 'error'); return false; }
            setPresupuestos(prev => prev.map(p => p.id === existente.id ? { ...p, monto } : p));
        } else {
            const { data, error } = await supabase.from('presupuestos')
                .insert([{ categoria, monto, user_id: sesion.user.id }])
                .select()
                .single();
            if (error) { mostrarToast(t('presupuestos.errorGuardar'), 'error'); return false; }
            setPresupuestos(prev => [...prev, data]);
        }
        mostrarToast(t('presupuestos.guardado'), 'exito');
        return true;
    }

    async function eliminarPresupuesto(presupuesto) {
        const aceptado = await confirmar({
            titulo: t('confirmar.eliminarPresupuesto', { nombre: nombreCategoria(presupuesto.categoria) }),
            mensaje: t('confirmar.eliminarPresupuestoTexto'),
        });
        if (!aceptado) return;
        const { error } = await supabase.from('presupuestos').delete().eq('id', presupuesto.id);
        if (error) { mostrarToast(t('confirmar.noSePudoEliminar'), 'error'); return; }
        setPresupuestos(prev => prev.filter(p => p.id !== presupuesto.id));
        mostrarToast(t('confirmar.eliminado'), 'exito');
    }

    return (
        <div className="presupuestos-page contenido-pagina">
            <div className="page-header">
                <div>
                    <p className="overline">{t('presupuestos.overline')}</p>
                    <h1>{t('presupuestos.titulo')}</h1>
                    <p>{t('presupuestos.subtitulo')}</p>
                </div>
                <div className="header-acciones">
                    <div className="pres-mes">
                        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label={t('comun.mesAnterior')}>
                            <Icon name="chevron-left" size={16} />
                        </button>
                        <span>{nombreMes}</span>
                        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label={t('comun.mesSiguiente')}>
                            <Icon name="chevron-right" size={16} />
                        </button>
                    </div>
                    {disponibles && categoriasLibres.length > 0 && (
                        <button className="btn-pildora-acento" onClick={() => setFormulario({})}>
                            <Icon name="plus" size={16} /> {t('presupuestos.nuevo')}
                        </button>
                    )}
                </div>
            </div>

            {disponibles === false ? (
                <div className="seccion-vacia">
                    <p>{t('presupuestos.noDisponibleTitulo')}</p>
                    <p>{t('presupuestos.noDisponibleTexto')}</p>
                </div>
            ) : filas.length === 0 ? (
                <div className="seccion-vacia">
                    <p>{t('presupuestos.vacioTitulo')}</p>
                    <p>{t('presupuestos.vacioTexto')}</p>
                    <button className="btn-pildora-acento" onClick={() => setFormulario({})}>
                        <Icon name="plus" size={16} /> {t('presupuestos.crearPrimero')}
                    </button>
                </div>
            ) : (
                <>
                    {/* Resumen del mes */}
                    <div className={`pres-resumen pres-${estadoDe(porcentajeTotal)}`}>
                        <div className="pres-resumen-principal">
                            <span className="pres-label">{t('presupuestos.gastadoDe')}</span>
                            <div className="pres-resumen-cifras">
                                <strong>{dinero(totalGastado)}</strong>
                                <span>/ {dinero(totalLimite)}</span>
                            </div>
                            <div className="pres-barra"><span style={{ width: `${Math.min(porcentajeTotal, 100)}%` }} /></div>
                        </div>
                        <div className="pres-resumen-dato">
                            <span className="pres-label">{t('presupuestos.disponible')}</span>
                            <strong>{dinero(Math.max(totalLimite - totalGastado, 0))}</strong>
                        </div>
                        <div className="pres-resumen-dato">
                            <span className="pres-label">{t('presupuestos.porDia')}</span>
                            <strong>{esMesActual ? dinero(Math.max(totalLimite - totalGastado, 0) / diasRestantes) : '—'}</strong>
                        </div>
                        <div className="pres-resumen-dato">
                            <span className="pres-label">{t('presupuestos.excedidos')}</span>
                            <strong className={excedidos ? 'texto-negativo' : ''}>{excedidos}</strong>
                        </div>
                    </div>

                    {/* Un presupuesto por categoría */}
                    <div className="pres-lista">
                        {filas.map((fila) => {
                            const restante = fila.limite - fila.gastado;
                            return (
                                <article key={fila.id} className={`pres-tarjeta pres-${fila.estado}`}>
                                    <div className="pres-tarjeta-top">
                                        <span className="pres-icono"><Icon name={ICONO_CATEGORIA[fila.categoria] || 'wallet'} size={18} /></span>
                                        <div className="pres-tarjeta-titulo">
                                            <h3>{nombreCategoria(fila.categoria)}</h3>
                                            <span className="pres-chip">{t(`presupuestos.estados.${fila.estado}`)}</span>
                                        </div>
                                        <div className="pres-acciones">
                                            <button className="btn-icono" title={t('comun.editar')} onClick={() => setFormulario({ presupuesto: fila })}>
                                                <Icon name="pencil" size={15} />
                                            </button>
                                            <button className="btn-fila-eliminar" title={t('comun.eliminar')} onClick={() => eliminarPresupuesto(fila)}>
                                                <Icon name="trash-2" size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pres-cifras">
                                        <strong>{dinero(fila.gastado)}</strong>
                                        <span>{t('presupuestos.deLimite', { limite: dinero(fila.limite) })}</span>
                                        <b>{Math.round(fila.porcentaje)}%</b>
                                    </div>

                                    <div className="pres-barra"><span style={{ width: `${Math.min(fila.porcentaje, 100)}%` }} /></div>

                                    <p className="pres-restante">
                                        {restante >= 0
                                            ? t('presupuestos.teQuedan', { monto: dinero(restante) })
                                            : t('presupuestos.tePasaste', { monto: dinero(-restante) })}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Categorías con gastos pero sin límite: acceso rápido para crearlo */}
            {disponibles && sinPresupuesto.length > 0 && (
                <section className="pres-sin-limite">
                    <h3>{t('presupuestos.sinPresupuesto')}</h3>
                    <p>{t('presupuestos.sinPresupuestoTexto')}</p>
                    <div className="pres-sin-limite-lista">
                        {sinPresupuesto.map(([categoria, gastado]) => (
                            <button
                                key={categoria}
                                className="pres-sin-limite-item"
                                onClick={() => CATEGORIAS_GASTO.includes(categoria) && setFormulario({ categoria })}
                                disabled={!CATEGORIAS_GASTO.includes(categoria)}
                            >
                                <Icon name={ICONO_CATEGORIA[categoria] || 'wallet'} size={16} />
                                <span>{nombreCategoria(categoria)}</span>
                                <b>{dinero(gastado)}</b>
                                {CATEGORIAS_GASTO.includes(categoria) && <Icon name="plus" size={14} />}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <Modal visible={!!formulario} titulo={formulario?.presupuesto ? t('presupuestos.editar') : t('presupuestos.nuevo')} onClose={() => setFormulario(null)}>
                {formulario && (
                    <FormularioPresupuesto
                        presupuesto={formulario.presupuesto}
                        categoriaInicial={formulario.categoria}
                        disponibles={categoriasLibres}
                        onGuardar={guardarPresupuesto}
                        onClose={() => setFormulario(null)}
                    />
                )}
            </Modal>
        </div>
    );
}

export default Presupuestos;
