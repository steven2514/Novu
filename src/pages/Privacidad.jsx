import './Legal.css';
import { useIdioma } from '../i18n/idioma';

function Privacidad() {
    const { t } = useIdioma();
    const secciones = t('legal.privacidad.secciones');

    return (
        <div className="legal-page">
            <h1>{t('legal.privacidad.titulo')}</h1>
            <p className="legal-fecha">{t('legal.actualizacion')}</p>

            {secciones.map((seccion) => (
                <section key={seccion.titulo}>
                    <h2>{seccion.titulo}</h2>
                    <p>{seccion.texto}</p>
                    {seccion.lista && (
                        <ul>
                            {seccion.lista.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    )}
                </section>
            ))}

            <h2>{t('legal.privacidad.contactoTitulo')}</h2>
            <p>{t('legal.privacidad.contactoTexto')}</p>
            <p>{t('legal.contactoWhatsapp')}: <a href="https://wa.me/573113065812" target="_blank" rel="noopener noreferrer">+57 311 306 5812</a></p>
        </div>
    );
}

export default Privacidad;
