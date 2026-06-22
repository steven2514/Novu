import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import TarjetaResumen from '../components/TarjetaResumen/TarjetaResumen';
import './Inicio.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { useState } from 'react';

function Inicio({ transacciones, metas, suscripciones, cuentas = [], sesion }) {
    
    const { mostrarTour, cerrarTour } = useTour('dashboard', sesion);

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());

    const transaccionesDelMes = transacciones.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesSeleccionado.getMonth() && fecha.getFullYear() === mesSeleccionado.getFullYear();
    });

    const balance = transaccionesDelMes.reduce((acc, t) => {
        if (t.tipo === 'ingreso') return acc + Number(t.monto);
        return acc - Number(t.monto);
    }, 0);

    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGasto = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const gastosPorCategoria = transaccionesDelMes
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, t) => {
            const cat = acc.find(c => c.categoria === t.categoria);
            if (cat) cat.valor += Number(t.monto);
            else acc.push({ categoria: t.categoria, valor: Number(t.monto) });
            return acc;
        }, []);
    
    const ingresosPorCategoria = transaccionesDelMes
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, t) => {
            const cat = acc.find(c => c.categoria === t.categoria);
            if (cat) cat.valor += Number(t.monto);
            else acc.push({ categoria: t.categoria, valor: Number(t.monto) });
            return acc;
        }, []);

    const fecha = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const hoy = new Date();
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    

    const datosSemanales = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - (6 - i));
        const diaNombre = diasSemana[fecha.getDay()];

        const ingresos = transacciones
            .filter(t => t.tipo === 'ingreso' && new Date(t.fecha).toDateString() === fecha.toDateString())
            .reduce((acc, t) => acc + Number(t.monto), 0);

        const gastos = transacciones
            .filter(t => t.tipo === 'gasto' && new Date(t.fecha).toDateString() === fecha.toDateString())
            .reduce((acc, t) => acc + Number(t.monto), 0);

        return { dia: diaNombre, ingresos, gastos };
    });

    
    const COLORES = ['#6C63FF', '#00D2A0', '#FFB347'];

    return (
        <div className='dashboard'>
            <h1>Dashboard</h1>
            <p>{fecha}</p>
            <div className='dashboard-mes-selector'>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1))}>‹</button>
                <span>{mesSeleccionado.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1))}>›</button>
            </div>
            <div className='tarjetas-grid'>
                <TarjetaResumen titulo="BALANCE TOTAL" valor={balance} color="principal" subtitulo={`${cuentas.length} cuentas activas`} />
                <TarjetaResumen titulo="INGRESOS" valor={totalIngresos} color="positivo" subtitulo="Este mes" />
                <TarjetaResumen titulo="GASTOS" valor={totalGasto} color="negativo" subtitulo="Este mes" />
                <TarjetaResumen titulo="METAS" valor={metas.length} color="texto" subtitulo="En progreso" sinPeso />
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
                                <Pie data={gastosPorCategoria} dataKey="valor" nameKey="categoria">
                                    {gastosPorCategoria.map((entry, index) => (
                                        <Cell key={index} fill={COLORES[index]} />
                                    ))}
                                    
                                </Pie>
                                <Tooltip />
                            </PieChart>
                    )}
                    
                </div>

                <div className="dashboard-caja">
                    <h3>Ingresos por Categoría</h3>
                    {totalIngresos === 0 ? (
                        <p>Sin ingresos registrados este mes</p>
                    ) : (
                        <PieChart width={300} height={250}>
                            <Pie data={ingresosPorCategoria} dataKey="valor" nameKey="categoria">
                                {ingresosPorCategoria.map((entry, index) => (
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
                    {metas.length === 0 ? (
                        <p>No hay metas activas</p>
                    ) : (
                        metas.map((meta, index) => {
                            const porcentaje = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100);
                            return (
                                <div key={index} className="meta-dashboard">
                                    <div className="meta-dashboard-header">
                                        <span>{meta.nombre_meta}</span>
                                        <span>${meta.monto_actual} / ${meta.monto_objetivo}</span>
                                    </div>
                                    <div className="barra-fondo">
                                        <div className="barra-progreso" style={{ width: `${porcentaje}%`, backgroundColor: meta.color }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="dashboard-caja">
                    <h3>Próximos Pagos</h3>
                    {suscripciones.length === 0 ? (
                        <p>No hay pagos próximos</p>
                    ) : (
                        suscripciones
                            .sort((a, b) => new Date(a.fecha_renovacion) - new Date(b.fecha_renovacion))
                            .slice(0, 3)
                            .map((sus, index) => (
                                <div key={index} className="pago-proximo">
                                    <span>{sus.icono} {sus.nombre}</span>
                                    <span>${Number(sus.monto).toLocaleString('es-CO')}</span>
                                </div>
                            ))
                    )}
                </div>
            </div>
            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: '¡Bienvenido a NOVU!', texto: 'Aquí ves tu balance, ingresos, gastos y metas de un vistazo.' },
                { titulo: 'Tus gráficas', texto: 'Visualiza tu actividad semanal y en qué categorías gastas más.' }
            ]} />}
        </div>
        
    );
}

export default Inicio;