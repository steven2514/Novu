import { parseFecha, aISO } from './fechas';
import { totalPorTipo, delMes, calcularTendencia, gastosPorCategoria } from './resumen';

// ─── Resumen del mes ────────────────────────────────────────────────────────
// Cuánto entró, cuánto salió, en qué se fue y cómo va frente al mes anterior.

function diasContados(mes, hoy) {
    const esteMes = mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth();
    const futuro = new Date(mes.getFullYear(), mes.getMonth(), 1) > hoy;
    if (futuro) return 0;
    // Mes en curso: los días que van; mes pasado: todos sus días
    return esteMes ? hoy.getDate() : new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
}

export function resumenDelMes(transacciones, mes, hoy = new Date()) {
    const delMesActual = delMes(transacciones, mes);
    const anterior = delMes(transacciones, new Date(mes.getFullYear(), mes.getMonth() - 1, 1));

    const ingresos = totalPorTipo(delMesActual, 'ingreso');
    const gastos = totalPorTipo(delMesActual, 'gasto');
    const ingresosAntes = totalPorTipo(anterior, 'ingreso');
    const gastosAntes = totalPorTipo(anterior, 'gasto');
    const balance = ingresos - gastos;

    // Categorías de gasto, de mayor a menor, con su cambio frente al mes anterior
    const categoriasAntes = gastosPorCategoria(anterior);
    const categorias = gastosPorCategoria(delMesActual)
        .sort((a, b) => b.valor - a.valor)
        .map(c => {
            const antes = categoriasAntes.find(x => x.categoria === c.categoria)?.valor || 0;
            return {
                categoria: c.categoria,
                valor: c.valor,
                porcentaje: gastos > 0 ? (c.valor / gastos) * 100 : 0,
                antes,
                diferencia: c.valor - antes,
            };
        });

    // La categoría que más subió (solo si existía el mes anterior y subió)
    const masSubio = categorias
        .filter(c => c.antes > 0 && c.diferencia > 0)
        .sort((a, b) => b.diferencia - a.diferencia)[0] || null;

    const gastosLista = delMesActual.filter(x => x.tipo === 'gasto');
    const mayorGasto = gastosLista.reduce((mayor, x) => (!mayor || Number(x.monto) > Number(mayor.monto) ? x : mayor), null);

    // Día con más gasto
    const porDia = {};
    gastosLista.forEach(x => {
        const fecha = parseFecha(x.fecha);
        if (!fecha) return;
        const clave = aISO(fecha);
        porDia[clave] = (porDia[clave] || 0) + Number(x.monto);
    });
    const [diaMasGasto = null, valorDiaMasGasto = 0] = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0] || [];

    const dias = diasContados(mes, hoy);

    return {
        hayDatos: delMesActual.length > 0,
        movimientos: delMesActual.length,
        ingresos,
        gastos,
        balance,
        // Qué parte de lo que entró quedó sin gastar
        tasaAhorro: ingresos > 0 ? (balance / ingresos) * 100 : null,
        tendenciaIngresos: calcularTendencia(ingresos, ingresosAntes),
        tendenciaGastos: calcularTendencia(gastos, gastosAntes),
        categorias,
        masSubio,
        mayorGasto: mayorGasto ? { descripcion: mayorGasto.descripcion, categoria: mayorGasto.categoria, monto: Number(mayorGasto.monto), fecha: mayorGasto.fecha } : null,
        diaMasGasto: diaMasGasto ? { fecha: diaMasGasto, valor: valorDiaMasGasto } : null,
        promedioDiario: dias > 0 ? gastos / dias : null,
    };
}
