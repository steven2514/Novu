import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Inicio.css';
import { useTour } from '../hooks/useTour';
import Tour from '../components/Tour/Tour';
import { Icon } from '../components/Icon';
import { useState } from 'react';

function Inicio({ transacciones, metas, suscripciones, cuentas = [], sesion }) {

    const { mostrarTour, cerrarTour } = useTour('dashboard', sesion);

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
    const [ocultarValores, setOcultarValores] = useState(false);

    const nombreUsuario = sesion?.user?.user_metadata?.nombre
        || sesion?.user?.user_metadata?.full_name
        || sesion?.user?.email?.split('@')[0]
        || 'Usuario';

    const transaccionesDelMes = transacciones.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesSeleccionado.getMonth() && fecha.getFullYear() === mesSeleccionado.getFullYear();
    });

    const balance = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    const totalIngresos = transaccionesDelMes
        .filter((t) => t.tipo === 'ingreso')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalGasto = transaccionesDelMes
        .filter((t) => t.tipo === 'gasto')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const totalSuscripcionesPagadasMes = transaccionesDelMes
        .filter(t => t.tipo === 'gasto' && t.categoria === 'suscripciones')
        .reduce((acc, t) => acc + Number(t.monto), 0);

    const ahorradoEnMetas = metas.reduce((acc, m) => acc + Number(m.monto_actual || 0), 0);

    const gastosPorCategoria = transaccionesDelMes
        .filter(t => t.tipo === 'gasto')
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

    const datosFlujoMensual = Array.from({ length: 6 }, (_, i) => {
        const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
        const nombreMes = fechaMes.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

        const ingresosMes = transacciones
            .filter(t => t.tipo === 'ingreso' && new Date(t.fecha).getMonth() === fechaMes.getMonth() && new Date(t.fecha).getFullYear() === fechaMes.getFullYear())
            .reduce((acc, t) => acc + Number(t.monto), 0);

        const gastosMes = transacciones
            .filter(t => t.tipo === 'gasto' && new Date(t.fecha).getMonth() === fechaMes.getMonth() && new Date(t.fecha).getFullYear() === fechaMes.getFullYear())
            .reduce((acc, t) => acc + Number(t.monto), 0);

        return { mes: nombreMes, ingresos: ingresosMes, gastos: gastosMes };
    });

    const COLORES = ['#B7B93A', '#E3DE6E', '#8FA33E', '#D8D24A', '#6E8B3D'];

    function formatoMonto(valor, signo = '') {
        if (ocultarValores) return '••••••';
        return `${signo}$${Math.abs(Number(valor)).toLocaleString('es-CO')}`;
    }

    return (
        <div className='dashboard'>
            <div className="dashboard-header">
                <div>
                    <p className="dashboard-saludo">👋 {nombreUsuario}</p>
                    <h1>Inicio</h1>
                </div>
                <button className="dashboard-btn-ojo" onClick={() => setOcultarValores(v => !v)} title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}>
                    <Icon name={ocultarValores ? 'eye-off' : 'eye'} size={18} />
                </button>
            </div>

            <div className='dashboard-mes-selector'>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - 1))}>‹</button>
                <span>{mesSeleccionado.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setMesSeleccionado(new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1))}>›</button>
            </div>

            <div className="dashboard-balance-card">
                <p className="dashboard-balance-label">Balance total</p>
                <h2 className="dashboard-balance-valor">{formatoMonto(balance)}</h2>

                <div className="dashboard-balance-fila">
                    <div className="dashboard-balance-pill">
                        <span><Icon name="trending-up" size={14} /> Ingresos</span>
                        <strong>{formatoMonto(totalIngresos)}</strong>
                    </div>
                    <div className="dashboard-balance-pill">
                        <span><Icon name="trending-down" size={14} /> Gastos</span>
                        <strong>{formatoMonto(totalGasto)}</strong>
                    </div>
                </div>
            </div>

            <div className="dashboard-fila-secundaria">
                <div className="dashboard-mini-card">
                    <p>Ahorrado en metas</p>
                    <h3>{formatoMonto(ahorradoEnMetas)}</h3>
                </div>
                <div className="dashboard-mini-card">
                    <p>Total mensual</p>
                    <h3>{formatoMonto(totalSuscripcionesPagadasMes)}</h3>
                </div>
            </div>

            <div className="dashboard-caja">
                <h3>Flujo mensual</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={datosFlujoMensual}>
                        <defs>
                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C9C93E" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#C9C93E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                        <Tooltip formatter={(valor) => `$${Number(valor).toLocaleString('es-CO')}`} />
                        <Area type="monotone" dataKey="ingresos" stroke="#B7B93A" strokeWidth={2} fill="url(#colorIngresos)" />
                        <Area type="monotone" dataKey="gastos" stroke="#DC2626" strokeWidth={1.5} fill="transparent" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="dashboard-caja">
                <h3>Gastos por categoría</h3>
                {totalGasto === 0 ? (
                    <p className="dashboard-caja-vacia">Sin gastos registrados este mes</p>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={gastosPorCategoria} dataKey="valor" nameKey="categoria" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                {gastosPorCategoria.map((entry, index) => (
                                    <Cell key={index} fill={COLORES[index % COLORES.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(valor) => `$${Number(valor).toLocaleString('es-CO')}`} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="dashboard-fila">
                <div className="dashboard-caja">
                    <h3>Metas Activas</h3>
                    {metas.length === 0 ? (
                        <p className="dashboard-caja-vacia">No hay metas activas</p>
                    ) : (
                        metas.map((meta, index) => {
                            const porcentaje = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100);
                            return (
                                <div key={index} className="meta-dashboard">
                                    <div className="meta-dashboard-header">
                                        <span>{meta.nombre_meta}</span>
                                        <span>{formatoMonto(meta.monto_actual)} / {formatoMonto(meta.monto_objetivo)}</span>
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
                        <p className="dashboard-caja-vacia">No hay pagos próximos</p>
                    ) : (
                        suscripciones
                            .sort((a, b) => new Date(a.fecha_renovacion) - new Date(b.fecha_renovacion))
                            .slice(0, 3)
                            .map((sus, index) => (
                                <div key={index} className="pago-proximo">
                                    <span>{sus.icono} {sus.nombre}</span>
                                    <span>{formatoMonto(sus.monto)}</span>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {mostrarTour && <Tour onCerrar={cerrarTour} pasos={[
                { titulo: '¡Bienvenido a NOVU!', texto: 'Aquí ves tu balance, ingresos, gastos y metas de un vistazo.' },
                { titulo: 'Tus gráficas', texto: 'Visualiza tu flujo mensual y en qué categorías gastas más.' }
            ]} />}
        </div>
    );
}

export default Inicio;