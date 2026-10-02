// Cálculos del panel de Inicio. Son funciones puras (sin React) para poder
// probarlas por separado.
import { parseFecha, mismoMes, mismoDia } from './fechas';

export function totalPorTipo(transacciones, tipo) {
    return transacciones
        .filter(t => t.tipo === tipo)
        .reduce((acc, t) => acc + Number(t.monto), 0);
}

export function delMes(transacciones, fecha) {
    return transacciones.filter(t => mismoMes(parseFecha(t.fecha), fecha));
}

// Variación porcentual frente al período anterior; null si no hay con qué comparar
export function calcularTendencia(actual, anterior) {
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
}

// [{ categoria, valor }] de los gastos, en el orden en que aparecen
export function gastosPorCategoria(transacciones) {
    return transacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => {
            const cat = acc.find(c => c.categoria === t.categoria);
            if (cat) cat.valor += Number(t.monto);
            else acc.push({ categoria: t.categoria, valor: Number(t.monto) });
            return acc;
        }, []);
}

function totalesEntre(transacciones, inicio, fin, tipo) {
    return transacciones
        .filter(t => {
            const f = parseFecha(t.fecha);
            return t.tipo === tipo && f && f >= inicio && f <= fin;
        })
        .reduce((acc, t) => acc + Number(t.monto), 0);
}

/**
 * Puntos de la gráfica "Resumen de movimientos": [{ mes, ingresos, gastos }]
 *   'semana' → los últimos 7 días
 *   'año'    → los últimos 12 meses
 *   'mes'    → las semanas del mes seleccionado
 */
export function datosResumen(transacciones, periodo, mesSeleccionado, locale, hoy = new Date()) {
    const mesCorto = (fecha) => fecha.toLocaleDateString(locale, { month: 'short' }).replace('.', '');

    if (periodo === 'semana') {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (6 - i));
            const delDia = transacciones.filter(t => mismoDia(parseFecha(t.fecha), d));
            return { mes: `${d.getDate()} ${mesCorto(d)}`, ingresos: totalPorTipo(delDia, 'ingreso'), gastos: totalPorTipo(delDia, 'gasto') };
        });
    }

    if (periodo === 'año') {
        return Array.from({ length: 12 }, (_, i) => {
            const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
            const inicio = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1);
            const fin = new Date(fechaMes.getFullYear(), fechaMes.getMonth() + 1, 0, 23, 59, 59);
            return {
                mes: mesCorto(fechaMes),
                ingresos: totalesEntre(transacciones, inicio, fin, 'ingreso'),
                gastos: totalesEntre(transacciones, inicio, fin, 'gasto'),
            };
        });
    }

    const inicioMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
    const finMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0, 23, 59, 59);
    const semanas = [];
    let cursor = new Date(inicioMes);
    while (cursor <= finMes) {
        const inicioSemana = new Date(cursor);
        const finSemanaCalculado = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6, 23, 59, 59);
        const finSemana = finSemanaCalculado > finMes ? finMes : finSemanaCalculado;
        semanas.push({
            mes: `${inicioSemana.getDate()} ${mesCorto(inicioSemana)}`,
            ingresos: totalesEntre(transacciones, inicioSemana, finSemana, 'ingreso'),
            gastos: totalesEntre(transacciones, inicioSemana, finSemana, 'gasto'),
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
    }
    return semanas;
}
