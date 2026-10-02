import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { pxEscalados } from '../../utils/escala';
import { dinero } from '../../utils/moneda';
import { COLORES, estiloTooltip } from './graficas';

// Dona de gastos por categoría (se carga aparte junto con recharts)
function GraficaCategorias({ datos }) {
    return (
        <ResponsiveContainer width="100%" height={pxEscalados(190)}>
            <PieChart>
                <Pie data={datos} dataKey="valor" nameKey="categoria" innerRadius={pxEscalados(58)} outerRadius={pxEscalados(85)} paddingAngle={2} stroke="none">
                    {datos.map((entry, index) => (
                        <Cell key={entry.categoria} fill={COLORES[index % COLORES.length]} />
                    ))}
                </Pie>
                <Tooltip {...estiloTooltip} formatter={(valor) => dinero(valor)} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default GraficaCategorias;
