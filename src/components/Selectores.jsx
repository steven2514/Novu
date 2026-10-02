import { Icon } from './Icon';
import { useIdioma } from '../i18n/idioma';

// Selectores de color e icono de los formularios (cuentas, metas, suscripciones).
// Antes eran <div onClick>: no se podían usar con teclado ni los anunciaba un
// lector de pantalla. Ahora son botones en un grupo de opciones (radiogroup):
// Tab entra al grupo, las flechas cambian de opción y Enter/Espacio elige.

function moverConFlechas(e, lista, valor, onChange) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const actual = Math.max(0, lista.indexOf(valor));
    const siguiente = (actual + delta + lista.length) % lista.length;
    onChange(lista[siguiente]);
    // El foco sigue a la opción elegida.
    e.currentTarget.querySelectorAll('button')[siguiente]?.focus();
}

export function SelectorColor({ colores, valor, onChange }) {
    const { t } = useIdioma();
    return (
        <div className="color-selector-grid" role="radiogroup" aria-label={t('comun.color')}
             onKeyDown={(e) => moverConFlechas(e, colores, valor, onChange)}>
            {colores.map((c, i, lista) => (
                <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={valor === c}
                    aria-label={`${t('comun.color')} ${i + 1}`}
                    // Sólo la opción elegida (o la primera) entra en el orden de Tab.
                    tabIndex={valor === c || (i === 0 && !lista.includes(valor)) ? 0 : -1}
                    className={`color-selector-opcion ${valor === c ? 'seleccionado' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onChange(c)}
                />
            ))}
        </div>
    );
}

export function SelectorIcono({ iconos, valor, onChange }) {
    const { t } = useIdioma();
    return (
        <div className="icono-selector-grid" role="radiogroup" aria-label={t('comun.icono')}
             onKeyDown={(e) => moverConFlechas(e, iconos, valor, onChange)}>
            {iconos.map((ic, i, lista) => (
                <button
                    key={ic}
                    type="button"
                    role="radio"
                    aria-checked={valor === ic}
                    aria-label={ic.replace(/-/g, ' ')}
                    tabIndex={valor === ic || (i === 0 && !lista.includes(valor)) ? 0 : -1}
                    className={`icono-selector-opcion ${valor === ic ? 'seleccionado' : ''}`}
                    onClick={() => onChange(ic)}
                >
                    <Icon name={ic} />
                </button>
            ))}
        </div>
    );
}
