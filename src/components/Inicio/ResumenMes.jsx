import './ResumenMes.css';
import Modal from '../Modal/Modal';
import { Icon } from '../Icon';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';
import { dinero } from '../../utils/moneda';
import { formatearFecha } from '../../utils/fechas';
import { resumenDelMes } from '../../utils/resumenMes';
import { COLORES } from './graficas';

// Resumen del mes elegido en Inicio: cuánto entró y salió, en qué se fue y lo
// más destacado, comparado con el mes anterior.

function Tendencia({ valor, subirEsBueno }) {
    const { t } = useIdioma();
    if (valor === null) return <p className="resumen-mes-tendencia">{t('resumenMes.sinComparar')}</p>;
    const sube = valor > 0;
    const bueno = valor === 0 || sube === subirEsBueno;
    return (
        <p className={`resumen-mes-tendencia ${bueno ? 'tendencia-buena' : 'tendencia-mala'}`}>
            {valor === 0 ? '=' : sube ? '▲' : '▼'} {Math.abs(valor).toFixed(0)}% {t('resumenMes.vsMesAnterior')}
        </p>
    );
}

function ResumenMes({ transacciones, mes, visible, onClose }) {
    const { t, locale } = useIdioma();
    if (!visible) return null;

    const r = resumenDelMes(transacciones, mes);
    const nombreMes = mes.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

    let titular = t('resumenMes.empate');
    let subtitulo = '';
    if (r.balance > 0) {
        titular = t('resumenMes.ahorraste', { monto: dinero(r.balance) });
        subtitulo = t('resumenMes.ahorrasteTexto', { porcentaje: Math.round(r.tasaAhorro) });
    } else if (r.balance < 0) {
        titular = t('resumenMes.gastasteMas', { monto: dinero(-r.balance) });
        subtitulo = t('resumenMes.gastasteMasTexto');
    }

    return (
        <Modal visible={visible} onClose={onClose} titulo={t('resumenMes.titulo', { mes: nombreMes })}>
            <div className="resumen-mes">
                <div className="resumen-mes-cabecera">
                    <h2>{t('resumenMes.titulo', { mes: nombreMes })}</h2>
                    <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
                </div>

                {!r.hayDatos ? (
                    <p className="resumen-mes-vacio">{t('resumenMes.sinDatos')}</p>
                ) : (
                    <>
                        <div className={`resumen-mes-titular ${r.balance < 0 ? 'titular-negativo' : ''}`}>
                            <Icon name={r.balance < 0 ? 'trending-down' : 'piggy-bank'} size={26} />
                            <div>
                                <p className="resumen-mes-titular-texto">{titular}</p>
                                {subtitulo && <p>{subtitulo}</p>}
                            </div>
                        </div>

                        <div className="resumen-mes-cifras">
                            <div>
                                <p className="resumen-mes-etiqueta">{t('resumenMes.ingresos')}</p>
                                <p className="resumen-mes-valor valor-positivo">{dinero(r.ingresos)}</p>
                                <Tendencia valor={r.tendenciaIngresos} subirEsBueno />
                            </div>
                            <div>
                                <p className="resumen-mes-etiqueta">{t('resumenMes.gastos')}</p>
                                <p className="resumen-mes-valor valor-negativo">{dinero(r.gastos)}</p>
                                <Tendencia valor={r.tendenciaGastos} subirEsBueno={false} />
                            </div>
                            <div>
                                <p className="resumen-mes-etiqueta">{t('resumenMes.movimientos')}</p>
                                <p className="resumen-mes-valor">{r.movimientos}</p>
                            </div>
                        </div>

                        {r.categorias.length > 0 && (
                            <section>
                                <h3 className="resumen-mes-subtitulo">{t('resumenMes.enQueSeFue')}</h3>
                                <ul className="resumen-mes-categorias">
                                    {r.categorias.slice(0, 5).map((c, i) => (
                                        <li key={c.categoria}>
                                            <div className="resumen-mes-categoria-fila">
                                                <span>{nombreCategoria(c.categoria)}</span>
                                                <span><strong>{dinero(c.valor)}</strong> · {Math.round(c.porcentaje)}%</span>
                                            </div>
                                            <div className="resumen-mes-barra">
                                                <span style={{ width: `${c.porcentaje}%`, background: COLORES[i % COLORES.length] }} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section>
                            <h3 className="resumen-mes-subtitulo">{t('resumenMes.destacados')}</h3>
                            <div className="resumen-mes-destacados">
                                {r.promedioDiario !== null && (
                                    <Destacado icono="calendar" etiqueta={t('resumenMes.promedioDiario')} valor={dinero(r.promedioDiario)} />
                                )}
                                {r.mayorGasto && (
                                    <Destacado
                                        icono="receipt"
                                        etiqueta={t('resumenMes.mayorGasto')}
                                        valor={dinero(r.mayorGasto.monto)}
                                        detalle={r.mayorGasto.descripcion || nombreCategoria(r.mayorGasto.categoria)}
                                    />
                                )}
                                {r.diaMasGasto && (
                                    <Destacado
                                        icono="calendar-days"
                                        etiqueta={t('resumenMes.diaMasGasto')}
                                        valor={dinero(r.diaMasGasto.valor)}
                                        detalle={formatearFecha(r.diaMasGasto.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
                                    />
                                )}
                                {r.masSubio && (
                                    <Destacado
                                        icono="trending-up"
                                        etiqueta={t('resumenMes.masSubio')}
                                        valor={nombreCategoria(r.masSubio.categoria)}
                                        detalle={t('resumenMes.masSubioTexto', { monto: dinero(r.masSubio.diferencia) })}
                                    />
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </Modal>
    );
}

function Destacado({ icono, etiqueta, valor, detalle }) {
    return (
        <div className="resumen-mes-destacado">
            <span className="resumen-mes-destacado-icono"><Icon name={icono} size={16} /></span>
            <div>
                <p className="resumen-mes-etiqueta">{etiqueta}</p>
                <p className="resumen-mes-destacado-valor">{valor}</p>
                {detalle && <p className="resumen-mes-destacado-detalle">{detalle}</p>}
            </div>
        </div>
    );
}

export default ResumenMes;
