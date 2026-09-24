import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Heart,
    PiggyBank,
    Search,
    ShieldCheck,
    Target,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import SelectorIdioma from '../components/SelectorIdioma/SelectorIdioma';
import { useIdioma } from '../i18n/idioma';
import './Landing.css';

const formatoPesos = (valor) => '$' + valor.toLocaleString('es-CO');

// Mini ilustraciones de cada área (no llevan texto traducible salvo "Efectivo")
function miniCuentas(t) {
    return (
        <div className="area-mini area-mini-cuentas">
            <span>Bancolombia <b>$2.450.000</b></span>
            <span>Nequi <b>$380.000</b></span>
            <span>{t('landing.areas.efectivo')} <b>$95.000</b></span>
        </div>
    );
}

const MINI_META = (
    <div className="area-mini area-mini-meta">
        <PiggyBank size={34} strokeWidth={1.6} />
        <div className="area-mini-progreso"><span style={{ width: '68%' }}></span></div>
    </div>
);

const MINI_SUBS = (
    <div className="area-mini area-mini-subs">
        <span>N</span><span>S</span><span>Y</span><span>+4</span>
    </div>
);

const MINI_CALENDARIO = (
    <div className="area-mini area-mini-calendario">
        {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={i === 4 || i === 10 ? 'marcado' : ''}></span>
        ))}
    </div>
);

// Metas de ejemplo: la clave apunta a landing.metas.<clave> y <clave>Nombre
const METAS = [
    { clave: 'viajes', fecha: new Date(2026, 11, 1), progreso: 68, aporte: 250000, icono: <TrendingUp size={40} strokeWidth={1.4} />, tono: 'meta-teal' },
    { clave: 'emergencias', fecha: new Date(2027, 5, 1), progreso: 41, aporte: 180000, icono: <ShieldCheck size={40} strokeWidth={1.4} />, tono: 'meta-oscuro' },
    { clave: 'tecnologia', fecha: new Date(2027, 2, 1), progreso: 23, aporte: 320000, icono: <Target size={40} strokeWidth={1.4} />, tono: 'meta-coral' },
];

const PASOS = [
    { clave: 'registra', icono: <Wallet size={20} /> },
    { clave: 'planea', icono: <CalendarDays size={20} /> },
    { clave: 'ahorra', icono: <PiggyBank size={20} /> },
];

function Landing() {
    const navigate = useNavigate();
    const { t, locale } = useIdioma();
    const irALogin = () => navigate('/login');

    const mesYAnio = (fecha) => {
        const texto = fecha.toLocaleDateString(locale, { month: 'long', year: 'numeric' }).replace(' de ', ' ');
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const areas = [
        { clave: 'cuentas', tono: 'area-teal', etiqueta: t('landing.areas.masUsado'), mini: miniCuentas(t) },
        { clave: 'metas', tono: 'area-coral', mini: MINI_META },
        { clave: 'suscripciones', tono: 'area-violeta', mini: MINI_SUBS },
        { clave: 'calendario', tono: 'area-ambar', mini: MINI_CALENDARIO },
    ];

    return (
        <div className="lp">
            {/* HERO */}
            <section className="lp-hero">
                <header className="lp-nav">
                    <a className="lp-marca" href="#inicio">
                        <span className="lp-marca-icono">N</span>
                        Novu<span className="lp-marca-app">App</span>
                    </a>

                    <nav className="lp-nav-links">
                        <a href="#funciones">{t('landing.nav.funciones')}</a>
                        <a href="#metas">{t('landing.nav.metas')}</a>
                        <a href="#como-funciona">{t('landing.nav.comoFunciona')}</a>
                    </nav>

                    <div className="lp-nav-acciones">
                        <SelectorIdioma variante="claro" />
                        <button className="lp-link" onClick={irALogin}>{t('landing.nav.iniciarSesion')}</button>
                        <button className="lp-btn lp-btn-coral" onClick={irALogin}>{t('landing.nav.crearCuenta')}</button>
                    </div>
                </header>

                <div className="lp-hero-contenido" id="inicio">
                    <div className="lp-hero-texto">
                        <span className="lp-overline lp-overline-linea">{t('marca.lema')}</span>

                        <h1>{t('landing.hero.titulo')}</h1>

                        <p>{t('landing.hero.texto')}</p>

                        <div className="lp-buscador">
                            <label className="lp-buscador-campo">
                                <Target size={20} />
                                <span>
                                    <small>{t('landing.hero.queLograr')}</small>
                                    <strong>{t('landing.hero.unViaje')}</strong>
                                </span>
                                <ChevronDown size={18} className="lp-buscador-chevron" />
                            </label>

                            <span className="lp-buscador-separador"></span>

                            <label className="lp-buscador-campo">
                                <CalendarDays size={20} />
                                <span>
                                    <small>{t('landing.hero.cuantoMes')}</small>
                                    <strong>{formatoPesos(250000)}</strong>
                                </span>
                            </label>

                            <button className="lp-btn lp-btn-coral lp-buscador-btn" onClick={irALogin}>
                                <Search size={18} />
                                {t('landing.hero.crearPlan')}
                            </button>
                        </div>

                        <div className="lp-prueba-social">
                            <div className="lp-avatares">
                                <span>SA</span><span>MR</span><span>JL</span>
                            </div>
                            <p><b>{t('landing.hero.gratis')}</b> {t('landing.hero.gratisResto')}</p>
                        </div>
                    </div>

                    <div className="lp-hero-visual" aria-hidden="true">
                        <div className="lp-telefono">
                            <div className="lp-telefono-saldo">
                                <small>{t('landing.telefono.balanceTotal')}</small>
                                <strong>{formatoPesos(4825000)}</strong>
                                <div className="lp-telefono-pills">
                                    <span className="positivo">+{formatoPesos(2140000)}</span>
                                    <span className="negativo">-{formatoPesos(918000)}</span>
                                </div>
                            </div>
                            <div className="lp-telefono-barras">
                                {[30, 45, 40, 65, 55, 80, 92].map((alto, i) => (
                                    <span key={i} style={{ height: `${alto}%` }}></span>
                                ))}
                            </div>
                            <ul className="lp-telefono-lista">
                                <li><span>🍔</span>{t('landing.telefono.almuerzo')}<b className="negativo">-$24.000</b></li>
                                <li><span>💼</span>{t('landing.telefono.nomina')}<b className="positivo">+$1.250.000</b></li>
                                <li><span>📺</span>Netflix<b className="negativo">-$26.900</b></li>
                            </ul>
                        </div>

                        <div className="lp-flotante lp-flotante-meta">
                            <PiggyBank size={18} />
                            <div>
                                <small>{t('landing.telefono.meta')}</small>
                                <strong>{t('landing.telefono.completado', { p: 68 })}</strong>
                            </div>
                        </div>

                        <div className="lp-flotante lp-flotante-pago">
                            <CreditCard size={18} />
                            <div>
                                <small>{t('landing.telefono.pago')}</small>
                                <strong>{formatoPesos(16900)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ÁREAS */}
            <section className="lp-seccion lp-crema" id="funciones">
                <div className="lp-contenedor">
                    <div className="lp-encabezado">
                        <div>
                            <span className="lp-overline">{t('landing.areas.overline')}</span>
                            <h2>{t('landing.areas.titulo')}</h2>
                            <p>{t('landing.areas.texto')}</p>
                        </div>
                        <button className="lp-link-flecha" onClick={irALogin}>
                            {t('landing.areas.verFunciones')} <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="lp-areas">
                        {areas.map((area) => (
                            <button key={area.clave} className={`lp-area ${area.tono}`} onClick={irALogin}>
                                {area.etiqueta && <span className="lp-area-etiqueta">{area.etiqueta}</span>}
                                {area.mini}
                                <div className="lp-area-pie">
                                    <div>
                                        <h3>{t(`landing.areas.${area.clave}`)}</h3>
                                        <p>{t(`landing.areas.${area.clave}Texto`)}</p>
                                    </div>
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* METAS */}
            <section className="lp-seccion lp-menta" id="metas">
                <div className="lp-contenedor">
                    <div className="lp-encabezado">
                        <div>
                            <span className="lp-overline">{t('landing.metas.overline')}</span>
                            <h2>{t('landing.metas.titulo')}</h2>
                            <p>{t('landing.metas.texto')}</p>
                        </div>
                        <span className="lp-en-vivo"><i></i>{t('landing.metas.enVivo')}</span>
                    </div>

                    <div className="lp-metas">
                        {METAS.map((meta) => (
                            <article key={meta.clave} className="lp-meta">
                                <div className={`lp-meta-portada ${meta.tono}`}>
                                    <span className="lp-meta-chip"><CalendarDays size={14} />{mesYAnio(meta.fecha)}</span>
                                    <span className="lp-meta-fav"><Heart size={18} /></span>
                                    {meta.icono}
                                </div>

                                <div className="lp-meta-cuerpo">
                                    <div className="lp-meta-fila">
                                        <span className="lp-overline">{t(`landing.metas.${meta.clave}`)}</span>
                                        <span className="lp-meta-porcentaje">{meta.progreso}%</span>
                                    </div>
                                    <h3>{t(`landing.metas.${meta.clave}Nombre`)}</h3>

                                    <div className="lp-meta-barra"><span style={{ width: `${meta.progreso}%` }}></span></div>

                                    <div className="lp-meta-pie">
                                        <div>
                                            <small>{t('landing.metas.aporte')}</small>
                                            <p><strong>{formatoPesos(meta.aporte)}</strong> {t('landing.metas.porMes')}</p>
                                        </div>
                                        <button className="lp-btn lp-btn-coral lp-btn-sm" onClick={irALogin}>
                                            {t('landing.metas.crear')} <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* PASOS */}
            <section className="lp-seccion lp-crema" id="como-funciona">
                <div className="lp-contenedor lp-pasos-grid">
                    <div className="lp-pasos-intro">
                        <span className="lp-overline">{t('landing.pasos.overline')}</span>
                        <h2>{t('landing.pasos.titulo')}</h2>
                        <p>{t('landing.pasos.texto')}</p>
                    </div>

                    <ol className="lp-pasos">
                        {PASOS.map((paso, i) => (
                            <li key={paso.clave}>
                                <span className="lp-paso-icono">{paso.icono}</span>
                                <small>0{i + 1}</small>
                                <h3>{t(`landing.pasos.${paso.clave}`)}</h3>
                                <p>{t(`landing.pasos.${paso.clave}Texto`)}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* BANDA */}
            <section className="lp-banda">
                <div className="lp-contenedor lp-banda-contenido">
                    <div className="lp-banda-texto">
                        <span className="lp-banda-icono"><ShieldCheck size={24} /></span>
                        <div>
                            <h3>{t('landing.banda.titulo')}</h3>
                            <p>{t('landing.banda.texto')}</p>
                        </div>
                    </div>
                    <button className="lp-btn lp-btn-blanco" onClick={irALogin}>
                        {t('landing.banda.empezar')} <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            <footer className="lp-footer">
                <div className="lp-contenedor lp-footer-contenido">
                    <span className="lp-marca">
                        <span className="lp-marca-icono">N</span>
                        Novu<span className="lp-marca-app">App</span>
                    </span>
                    <p>{t('landing.pie.lema')}</p>
                    <p>© 2026 NovuApp</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
