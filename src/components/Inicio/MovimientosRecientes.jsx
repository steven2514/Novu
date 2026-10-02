import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import { IconoMarca } from '../IconoMarca';
import { buscarMarca } from '../../utils/marcas';
import { compararFechas } from '../../utils/fechas';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';
import { dinero } from '../../utils/moneda';

function iniciales(nombre) {
    return (nombre || '?').trim().slice(0, 1).toUpperCase();
}

// Los 4 movimientos más recientes
export function MovimientosRecientes({ transacciones }) {
    const { t } = useIdioma();

    const recientes = transacciones
        .slice()
        .sort((a, b) => compararFechas(b.fecha, a.fecha))
        .slice(0, 4);

    return (
        <div className="dashboard-caja dashboard-grid-recientes">
            <div className="dashboard-caja-header">
                <h3>{t('inicio.recientes')}</h3>
                <Link to="/transacciones" className="dashboard-ver-todo">{t('comun.verTodos')}</Link>
            </div>
            {recientes.length === 0 ? (
                <p className="dashboard-caja-vacia">{t('inicio.sinMovimientos')}</p>
            ) : (
                recientes.map((mov) => (
                    <div key={mov.id} className="fila-movimiento-reciente">
                        {buscarMarca(mov.descripcion) ? (
                            <IconoMarca nombre={mov.descripcion} size={16} badgeSize={34} borderRadius="50%" />
                        ) : (
                            <div className="fila-movimiento-avatar">{iniciales(mov.descripcion)}</div>
                        )}
                        <div className="fila-movimiento-info">
                            <b>{mov.descripcion || t('comun.sinDescripcion')}</b>
                            <small>{nombreCategoria(mov.categoria)}</small>
                        </div>
                        <span className={mov.tipo === 'ingreso' ? 'dashboard-monto-in' : 'dashboard-monto-out'}>
                            {mov.tipo === 'ingreso' ? '+ ' : '- '}{dinero(mov.monto)}
                        </span>
                    </div>
                ))
            )}
        </div>
    );
}

// Atajo para transferir entre las primeras cuentas
export function TransferenciaRapida({ cuentas, abrirModal }) {
    const { t } = useIdioma();

    return (
        <div className="dashboard-caja dashboard-grid-transferencia">
            <h3>{t('inicio.transferenciaRapida')}</h3>
            <p className="dashboard-transferencia-sub">{t('inicio.transferenciaTexto')}</p>
            {cuentas.length === 0 ? (
                <p className="dashboard-caja-vacia">{t('inicio.agregaCuenta')}</p>
            ) : (
                <div className="dashboard-avatares-cuentas">
                    {cuentas.slice(0, 3).map((c) => (
                        <button key={c.id} className="dashboard-avatar-cuenta" onClick={() => abrirModal && abrirModal('transferencia')} title={c.nombre}>
                            <span style={{ backgroundColor: c.color || "var(--principal)" }}>{iniciales(c.nombre)}</span>
                            <small>{c.nombre}</small>
                        </button>
                    ))}
                    <Link to="/cuentas" className="dashboard-avatar-cuenta">
                        <span className="dashboard-avatar-agregar"><Icon name="plus" size={16} /></span>
                        <small>{t('comun.agregar')}</small>
                    </Link>
                </div>
            )}
            {abrirModal && (
                <button className="dashboard-btn-transferir" onClick={() => abrirModal('transferencia')}>
                    <Icon name="send" size={14} /> {t('comun.transferir')}
                </button>
            )}
        </div>
    );
}
