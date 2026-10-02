import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import { IconoMarca } from '../IconoMarca';
import { buscarMarca } from '../../utils/marcas';
import { compararFechas } from '../../utils/fechas';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';
import { dinero } from '../../utils/moneda';

function Caja({ titulo, enlace, textoEnlace, children }) {
    return (
        <div className="dashboard-caja">
            <div className="dashboard-caja-header">
                <h3>{titulo}</h3>
                <Link to={enlace} className="dashboard-ver-todo">{textoEnlace}</Link>
            </div>
            {children}
        </div>
    );
}

function BarraProgreso({ nombre, actual, total, porcentaje, color, clase = '' }) {
    return (
        <div className="meta-dashboard">
            <div className="meta-dashboard-header">
                <span>{nombre}</span>
                <span>{dinero(actual)} / {dinero(total)}</span>
            </div>
            <div className="barra-fondo">
                <div className={`barra-progreso ${clase}`} style={{ width: `${Math.min(porcentaje, 100)}%`, backgroundColor: color }}></div>
            </div>
        </div>
    );
}

// Metas, presupuestos del mes y próximas suscripciones
function ColumnaLateral({ metas, presupuestosDelMes, suscripciones, totalSuscripcionesMensual }) {
    const { t } = useIdioma();

    const proximas = suscripciones
        .slice()
        .sort((a, b) => compararFechas(a.fecha_renovacion, b.fecha_renovacion))
        .slice(0, 3);

    return (
        <div className="dashboard-col-lateral">
            <Caja titulo={t('inicio.metas')} enlace="/Metas" textoEnlace={t('comun.verTodas')}>
                {metas.length === 0 ? (
                    <p className="dashboard-caja-vacia">{t('inicio.sinMetas')}</p>
                ) : (
                    metas.slice(0, 3).map((meta) => (
                        <BarraProgreso
                            key={meta.id}
                            nombre={meta.nombre_meta}
                            actual={meta.monto_actual}
                            total={meta.monto_objetivo}
                            porcentaje={(meta.monto_actual / meta.monto_objetivo) * 100}
                            color={meta.color}
                        />
                    ))
                )}
            </Caja>

            <Caja titulo={t('inicio.presupuestos')} enlace="/presupuestos" textoEnlace={t('comun.verTodos')}>
                {presupuestosDelMes.length === 0 ? (
                    <div className="dashboard-caja-vacia">
                        <p>{t('inicio.sinPresupuestos')}</p>
                        <Link to="/presupuestos" className="dashboard-ver-todo">{t('inicio.crearPresupuesto')}</Link>
                    </div>
                ) : (
                    presupuestosDelMes.slice(0, 3).map((p) => (
                        <BarraProgreso
                            key={p.id}
                            nombre={nombreCategoria(p.categoria)}
                            actual={p.gastado}
                            total={p.monto}
                            porcentaje={p.porcentaje}
                            clase={`barra-presupuesto ${p.porcentaje > 100 ? 'excedido' : p.porcentaje >= 80 ? 'alerta' : ''}`}
                        />
                    ))
                )}
            </Caja>

            <Caja titulo={t('inicio.suscripciones')} enlace="/Suscripciones" textoEnlace={t('comun.verTodas')}>
                {suscripciones.length === 0 ? (
                    <p className="dashboard-caja-vacia">{t('inicio.sinSuscripciones')}</p>
                ) : (
                    <>
                        {proximas.map((sus) => (
                            <div key={sus.id} className="pago-proximo">
                                <span className="pago-proximo-nombre">
                                    {buscarMarca(sus.nombre) ? (
                                        <IconoMarca nombre={sus.nombre} size={14} badgeSize={26} borderRadius="8px" />
                                    ) : (
                                        <span className="pago-proximo-icono-generico" style={{ backgroundColor: (sus.color || "#0B5E66") + '22', color: sus.color || "#0B5E66" }}>
                                            <Icon name={sus.icono} size={13} />
                                        </span>
                                    )}
                                    {sus.nombre}
                                </span>
                                <span>{dinero(sus.monto)}</span>
                            </div>
                        ))}
                        <div className="dashboard-total-mensual">
                            <span>{t('inicio.totalMensual')}</span>
                            <b>{dinero(totalSuscripcionesMensual)}</b>
                        </div>
                    </>
                )}
            </Caja>
        </div>
    );
}

export default ColumnaLateral;
