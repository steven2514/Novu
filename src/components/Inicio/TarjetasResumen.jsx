import { Icon } from '../Icon';
import { useIdioma } from '../../i18n/idioma';
import { dinero } from '../../utils/moneda';

function Tendencia({ valor, subirEsBueno }) {
    const { t } = useIdioma();
    if (valor === null) return <small className="dashboard-stat-nota">{t('inicio.sinDatosMesPasado')}</small>;
    const bueno = subirEsBueno ? valor >= 0 : valor <= 0;
    return (
        <small className={bueno ? 'dashboard-tendencia-up-claro' : 'dashboard-tendencia-down-claro'}>
            {valor >= 0 ? '▲' : '▼'} {t('inicio.vsMesPasado', { p: Math.abs(valor).toFixed(1) })}
        </small>
    );
}

// Balance destacado + 3 métricas del mes
function TarjetasResumen({ balance, numCuentas, ingresos, gastos, tendenciaIngresos, tendenciaGastos, ahorrado, numMetas }) {
    const { t } = useIdioma();

    return (
        <div className="dashboard-stats">
            <div className="dashboard-stat-card dashboard-stat-destacada">
                <div className="dashboard-stat-top">
                    <span className="dashboard-stat-label">{t('inicio.balanceTotal')}</span>
                    <span className="dashboard-stat-icon"><Icon name="wallet" size={18} /></span>
                </div>
                <div className="dashboard-stat-value">{dinero(balance)}</div>
                <small className="dashboard-stat-nota">
                    {t('comun.cuentas', { n: numCuentas })} · {t('inicio.flujoMes')} {dinero(ingresos - gastos, { signo: true })}
                </small>
            </div>

            <div className="dashboard-stat-card">
                <div className="dashboard-stat-top">
                    <span className="dashboard-stat-label">{t('inicio.ingresosMes')}</span>
                    <span className="dashboard-stat-icon stat-icon-positivo"><Icon name="arrow-down-left" size={18} /></span>
                </div>
                <div className="dashboard-stat-value">{dinero(ingresos)}</div>
                <Tendencia valor={tendenciaIngresos} subirEsBueno />
            </div>

            <div className="dashboard-stat-card">
                <div className="dashboard-stat-top">
                    <span className="dashboard-stat-label">{t('inicio.gastosMes')}</span>
                    <span className="dashboard-stat-icon stat-icon-negativo"><Icon name="arrow-up-right" size={18} /></span>
                </div>
                <div className="dashboard-stat-value">{dinero(gastos)}</div>
                <Tendencia valor={tendenciaGastos} subirEsBueno={false} />
            </div>

            <div className="dashboard-stat-card">
                <div className="dashboard-stat-top">
                    <span className="dashboard-stat-label">{t('inicio.ahorradoMetas')}</span>
                    <span className="dashboard-stat-icon stat-icon-ahorro"><Icon name="piggy-bank" size={18} /></span>
                </div>
                <div className="dashboard-stat-value">{dinero(ahorrado)}</div>
                <small className="dashboard-stat-nota">{t('inicio.metasActivas', { n: numMetas })}</small>
            </div>
        </div>
    );
}

export default TarjetasResumen;
