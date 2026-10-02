import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import { useIdioma } from '../../i18n/idioma';

const BENEFICIOS = [
    { icono: 'arrow-left-right', texto: 'login.beneficio1' },
    { icono: 'target', texto: 'login.beneficio2' },
    { icono: 'credit-card', texto: 'login.beneficio3' },
];

const BARRAS = [35, 50, 42, 68, 58, 82, 94];

// Panel de marca a la izquierda del formulario
export function PanelMarca() {
    const { t } = useIdioma();
    return (
        <aside className="login-panel">
            <Link to="/" className="login-marca">
                <span className="login-marca-icono">N</span>
                Novu<span className="login-marca-app">App</span>
            </Link>

            <div className="login-panel-texto">
                <span className="login-overline">{t('marca.lema')}</span>
                <h2>{t('login.panelTitulo')}</h2>
                <ul>
                    {BENEFICIOS.map((b) => (
                        <li key={b.texto}>
                            <span><Icon name={b.icono} size={16} /></span>
                            {t(b.texto)}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="login-panel-tarjeta" aria-hidden="true">
                <small>{t('login.balanceTotal')}</small>
                <strong>$4.825.000</strong>
                <div className="login-panel-barras">
                    {BARRAS.map((alto, i) => <span key={i} style={{ height: `${alto}%` }} />)}
                </div>
            </div>
        </aside>
    );
}

function LogoGoogle() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
    );
}

export function BotonGoogle({ onClick, cargando }) {
    const { t } = useIdioma();
    return (
        <button type="button" className="btn-google" onClick={onClick} disabled={cargando}>
            {cargando
                ? <div className="loader-spinner spinner-pequeño"></div>
                : <><LogoGoogle /> {t('login.google')}</>}
        </button>
    );
}

// Campo de contraseña con su botón para mostrarla u ocultarla
export function CampoPassword({ id, etiqueta, value, onChange, autoComplete }) {
    const { t } = useIdioma();
    const [visible, setVisible] = useState(false);
    return (
        <>
            <label htmlFor={id}>{etiqueta}</label>
            <div className="login-input-wrap">
                <Icon name="lock" size={17} />
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="••••••••"
                />
                <button type="button" className="login-password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? t('login.ocultarContrasena') : t('login.mostrarContrasena')}>
                    <Icon name={visible ? 'eye-off' : 'eye'} size={17} />
                </button>
            </div>
        </>
    );
}
