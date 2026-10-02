import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useIdioma } from '../../i18n/idioma';
import { pxEscalados } from '../../utils/escala';
import { dinero } from '../../utils/moneda';
import { usePreferencias } from '../../Context/preferencias';
import { estiloTooltip } from './graficas';

// Ingresos vs. gastos en el tiempo (se carga aparte junto con recharts)
function GraficaResumen({ datos }) {
    const { t } = useIdioma();
    const { saldosOcultos } = usePreferencias();

    return (
        <ResponsiveContainer width="100%" height={pxEscalados(270)}>
            <AreaChart data={datos}>
                <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#12A77F" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#12A77F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: pxEscalados(12), fill: 'var(--texto-gris)' }} />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: pxEscalados(12), fill: 'var(--texto-gris)' }}
                    tickFormatter={(valor) => (saldosOcultos ? '' : dinero(valor, { compacto: true }))}
                    width={pxEscalados(56)}
                />
                <Tooltip {...estiloTooltip} formatter={(valor) => dinero(valor)} />
                <Area type="monotone" dataKey="ingresos" name={t('inicio.ingresos')} stroke="#12A77F" strokeWidth={2.5} fill="url(#colorIngresos)" dot={false} />
                <Area type="monotone" dataKey="gastos" name={t('inicio.gastos')} stroke="#FF6B4A" strokeWidth={2.5} fill="url(#colorGastos)" dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default GraficaResumen;
