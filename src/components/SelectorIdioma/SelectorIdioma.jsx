import { useIdioma, IDIOMAS } from '../../i18n/idioma';
import './SelectorIdioma.css';

// Interruptor compacto ES | EN. variante="claro" para fondos oscuros (landing, login).
function SelectorIdioma({ variante = '' }) {
    const { idioma, cambiarIdioma, t } = useIdioma();

    return (
        <div className={`selector-idioma ${variante ? `selector-idioma-${variante}` : ''}`} role="group" aria-label={t('ajustes.idioma')}>
            {IDIOMAS.map((codigo) => (
                <button
                    key={codigo}
                    type="button"
                    className={idioma === codigo ? 'activo' : ''}
                    onClick={() => cambiarIdioma(codigo)}
                    aria-pressed={idioma === codigo}
                >
                    {codigo.toUpperCase()}
                </button>
            ))}
        </div>
    );
}

export default SelectorIdioma;
