import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Avisos.css';
import Modal from '../Modal/Modal';
import { Icon } from '../Icon';
import { useIdioma } from '../../i18n/idioma';
import { textoAviso, soportaNotificaciones } from '../../hooks/useAvisos';

export function BotonAvisos({ nuevos, onClick, className = '' }) {
    const { t } = useIdioma();
    return (
        <button
            type="button"
            className={`avisos-boton ${className}`}
            onClick={onClick}
            aria-label={nuevos > 0 ? t('avisos.abrirConNuevos', { n: nuevos }) : t('avisos.abrir')}
        >
            <Icon name="bell" size={19} />
            {nuevos > 0 && <span className="avisos-contador">{nuevos > 9 ? '9+' : nuevos}</span>}
        </button>
    );
}

export function PanelAvisos({ avisos, vistos, visible, onClose }) {
    const { t } = useIdioma();
    const navigate = useNavigate();
    const [permiso, setPermiso] = useState(() => (soportaNotificaciones() ? Notification.permission : 'no-soportado'));

    async function activarNotificaciones() {
        const resultado = await Notification.requestPermission();
        setPermiso(resultado);
    }

    function ir(aviso) {
        onClose();
        navigate(aviso.ruta);
    }

    return (
        <Modal visible={visible} onClose={onClose} titulo={t('avisos.titulo')}>
            <div className="avisos-panel">
                <div className="avisos-cabecera">
                    <h2>{t('avisos.titulo')}</h2>
                    <button className="btn-cerrar-modal" onClick={onClose} aria-label={t('comun.cerrar')}><Icon name="x" /></button>
                </div>

                {avisos.length === 0 ? (
                    <div className="avisos-vacio">
                        <span className="avisos-vacio-icono"><Icon name="circle-check" size={26} /></span>
                        <p className="avisos-vacio-titulo">{t('avisos.vacioTitulo')}</p>
                        <p>{t('avisos.vacioTexto')}</p>
                    </div>
                ) : (
                    <ul className="avisos-lista">
                        {avisos.map(aviso => (
                            <li key={aviso.id}>
                                <button type="button" className={`aviso aviso-${aviso.nivel}`} onClick={() => ir(aviso)}>
                                    <span className="aviso-icono"><Icon name={aviso.icono} size={17} /></span>
                                    <span className="aviso-texto">{textoAviso(aviso, t)}</span>
                                    {!vistos.has(aviso.id) && <span className="aviso-nuevo">{t('avisos.nuevo')}</span>}
                                    <Icon name="chevron-right" size={16} className="aviso-flecha" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {permiso === 'default' && (
                    <button type="button" className="avisos-activar" onClick={activarNotificaciones}>
                        <Icon name="bell" size={16} />
                        <span>
                            <strong>{t('avisos.activarCelular')}</strong>
                            <small>{t('avisos.activarCelularTexto')}</small>
                        </span>
                    </button>
                )}
                {permiso === 'granted' && <p className="avisos-estado"><Icon name="check" size={14} /> {t('avisos.activadas')}</p>}
                {permiso === 'denied' && <p className="avisos-estado">{t('avisos.bloqueadas')}</p>}
            </div>
        </Modal>
    );
}
