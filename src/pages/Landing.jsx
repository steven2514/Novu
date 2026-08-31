import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import './Landing.css';

function Landing() {
    const navigate = useNavigate();

    const irALogin = () => navigate('/login');

    return (
        <div className="landing">
            {/* Fondos luminosos */}
            <div className="landing-ambient landing-ambient-1"></div>
            <div className="landing-ambient landing-ambient-2"></div>
            <div className="landing-ambient landing-ambient-3"></div>

            {/* NAVBAR */}
            <header className="landing-header glass">
                <div className="landing-marca">
                    <div className="landing-logo-icono">N</div>
                    <span>Novu</span>
                </div>

                <button
                    className="landing-btn-login-link"
                    onClick={irALogin}
                >
                    Iniciar sesión
                    <Icon name="arrow-up-right" size={16} />
                </button>
            </header>

            {/* HERO */}
            <section className="landing-hero">

                <div className="landing-hero-texto">
                    <span className="landing-overline">
                        TU DINERO, CLARO Y EN CALMA
                    </span>

                    <h1>
                        Controla tus finanzas
                        <br />
                        <span>sin esfuerzo</span>
                    </h1>

                    <p className="landing-descripcion">
                        Registra ingresos, gastos y transferencias,
                        ahorra para tus metas y paga tus suscripciones
                        desde un solo lugar.
                    </p>

                    <div className="landing-botones">
                        <button
                            className="landing-btn-principal"
                            onClick={irALogin}
                        >
                            Comenzar gratis
                            <Icon name="arrow-right" size={18} />
                        </button>

                        <button
                            className="landing-btn-secundario glass-button"
                            onClick={irALogin}
                        >
                            Ya tengo cuenta
                        </button>
                    </div>
                </div>

                {/* TARJETA DE BALANCE */}
                <div className="landing-preview">
                    <div className="landing-preview-card glass-panel">

                        <div className="preview-glow"></div>

                        <div className="landing-preview-top">
                            <div>
                                <p className="landing-preview-label">
                                    Balance total
                                </p>

                                <p className="landing-preview-balance">
                                    $48,320.00
                                </p>
                            </div>

                            <div className="preview-wallet">
                                <Icon name="wallet2" size={20} />
                            </div>
                        </div>

                        <div className="landing-preview-fila">

                            <div className="landing-preview-pill positivo">
                                <span>Ingresos</span>
                                <strong>+$21,400</strong>
                            </div>

                            <div className="landing-preview-pill negativo">
                                <span>Gastos</span>
                                <strong>-$9,180</strong>
                            </div>

                        </div>

                        <div className="preview-chart-header">
                            <span>Actividad</span>
                            <span>Últimos 7 días</span>
                        </div>

                        <div className="landing-preview-barras">
                            <span style={{ height: '30%' }}></span>
                            <span style={{ height: '45%' }}></span>
                            <span style={{ height: '40%' }}></span>
                            <span style={{ height: '65%' }}></span>
                            <span style={{ height: '55%' }}></span>
                            <span style={{ height: '80%' }}></span>
                            <span style={{ height: '92%' }}></span>
                        </div>

                        <div className="landing-preview-lista">

                            <div className="landing-preview-item">
                                <div className="preview-item-info">
                                    <span className="preview-item-icon">🍜</span>
                                    <span>Ramen Kudo</span>
                                </div>

                                <strong className="negativo">
                                    -$240
                                </strong>
                            </div>

                            <div className="landing-preview-item">
                                <div className="preview-item-info">
                                    <span className="preview-item-icon">💼</span>
                                    <span>Nómina</span>
                                </div>

                                <strong className="positivo">
                                    +$12,500
                                </strong>
                            </div>

                            <div className="landing-preview-item">
                                <div className="preview-item-info">
                                    <span className="preview-item-icon">📺</span>
                                    <span>Netflix</span>
                                </div>

                                <strong className="negativo">
                                    -$219
                                </strong>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="landing-features">

                <div className="landing-feature-card glass-panel">
                    <div className="landing-feature-icono">
                        <Icon name="arrow-left-right" size={20} />
                    </div>

                    <h3>Movimientos al instante</h3>

                    <p>
                        Ingresos, gastos y transferencias entre cuentas
                        en dos toques.
                    </p>
                </div>

                <div className="landing-feature-card glass-panel">
                    <div className="landing-feature-icono">
                        <Icon name="target" size={20} />
                    </div>

                    <h3>Metas de ahorro</h3>

                    <p>
                        Aparta dinero y mira tu progreso en tiempo real.
                    </p>
                </div>

                <div className="landing-feature-card glass-panel">
                    <div className="landing-feature-icono">
                        <Icon name="credit-card" size={20} />
                    </div>

                    <h3>Suscripciones</h3>

                    <p>
                        Nunca olvides un cobro y págalo desde la app.
                    </p>
                </div>

                <div className="landing-feature-card glass-panel">
                    <div className="landing-feature-icono">
                        <Icon
                            name="chart-no-axes-column-increasing"
                            size={20}
                        />
                    </div>

                    <h3>Gráficas claras</h3>

                    <p>
                        Entiende a dónde se va tu dinero cada mes.
                    </p>
                </div>

            </section>

            <footer className="landing-footer">
                © 2026 NovuApp — Todos los derechos reservados
            </footer>
        </div>
    );
}

export default Landing;