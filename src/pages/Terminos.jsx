import './Legal.css';
import { useIdioma } from '../i18n/idioma';

function Terminos() {
    const { t } = useIdioma();
    const secciones = t('legal.terminos.secciones');

    return (
        <div className="legal-page">
            <h1>{t('legal.terminos.titulo')}</h1>
            <p className="legal-fecha">{t('legal.actualizacion')}</p>

            {secciones.map((seccion) => (
                <section key={seccion.titulo}>
                    <h2>{seccion.titulo}</h2>
                    <p>{seccion.texto}</p>
                </section>
            ))}

            <h2>{t('legal.terminos.contactoTitulo')}</h2>
            <p>{t('legal.terminos.contactoTexto')} <a href="https://wa.me/573113065812" target="_blank" rel="noopener noreferrer">+57 311 306 5812</a></p>
        </div>
    );
}

export default Terminos;
