import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import TarjetaResumen from '../components/TarjetaResumen/TarjetaResumen';
import './Inicio.css';

function Inicio({ transacciones, setTransacciones }) {

    const balance = transacciones.reduce((acc, t) => {
        if (t.tipo === 'ingreso') return acc + Number(t.monto);
        return acc - Number(t.monto);
    }, 0);

    const totalIngresos = transacciones
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGasto = transacciones
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const datosPrueba = [
        { categoria: 'Comida', valor: 50000 },
        { categoria: 'Transporte', valor: 30000 },
        { categoria: 'Entretenimiento', valor: 20000 },
    ];

    const fecha = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const datosSemanales = [
        { dia: 'Lun', ingresos: 0, gastos: 0 },
        { dia: 'Mar', ingresos: 0, gastos: 0 },
        { dia: 'Mié', ingresos: 0, gastos: 0 },
        { dia: 'Jue', ingresos: 0, gastos: 0 },
        { dia: 'Vie', ingresos: 0, gastos: 0 },
        { dia: 'Sáb', ingresos: 0, gastos: 0 },
        { dia: 'Dom', ingresos: 0, gastos: 0 },
    ];

    const COLORES = ['#6C63FF', '#00D2A0', '#FFB347'];

    return (
        <div className='dashboard'>
            <h1>Dashboard</h1>
            <p>{fecha}</p>
            <div className='tarjetas-grid'>
                <TarjetaResumen titulo="BALANCE TOTAL" valor={balance} color="principal" subtitulo="0 cuentas activas" />
                <TarjetaResumen titulo="INGRESOS" valor={totalIngresos} color="positivo" subtitulo="Este mes" />
                <TarjetaResumen titulo="GASTOS" valor={totalGasto} color="negativo" subtitulo="Este mes" />
                <TarjetaResumen titulo="METAS" valor={0} color="texto" subtitulo="En progreso" />
            </div>

            <div className="dashboard-fila">
                <div className="dashboard-caja">
                    <h3>Actividad Semanal</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={datosSemanales}>
                            <XAxis dataKey="dia" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="ingresos" stroke="#00D2A0" />
                            <Line type="monotone" dataKey="gastos" stroke="#FF6B6B" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="dashboard-caja">
                    <h3>Gastos por Categoría</h3>
                    {totalGasto === 0 ? (
                        <p>Sin gastos registrados este mes</p>
                    ) : (
                            <PieChart width={300} height={250}>
                                <Pie data={datosPrueba} dataKey="valor" nameKey="categoria">
                                    {datosPrueba.map((entry, index) => (
                                        <Cell key={index} fill={COLORES[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                    )}
                </div>
            </div>

            <div className="dashboard-fila">
                <div className="dashboard-caja">
                    <h3>Metas Activas</h3>
                </div>
                <div className="dashboard-caja">
                    <h3>Próximos Pagos</h3>
                    <p>No hay pagos próximos</p>
                </div>
            </div>
        </div>
    );
}

export default Inicio;