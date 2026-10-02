import { MONEDAS } from '../utils/moneda';
import { usePreferencias } from '../Context/preferencias';

// Separadores de cada moneda: COP "1.000.000", USD "1,000,000.50", EUR "1.000.000,50"
const SEPARADORES = {
    COP: { miles: '.', decimal: ',' },
    USD: { miles: ',', decimal: '.' },
    EUR: { miles: '.', decimal: ',' },
};

// Lo escrito → número como texto con punto decimal ("1234.5")
function limpiar(texto, moneda) {
    const { miles, decimal } = SEPARADORES[moneda];
    const { decimales } = MONEDAS[moneda];
    let limpio = String(texto).split(miles).join('');
    if (!decimales) return limpio.replace(/\D/g, '');
    limpio = limpio.replace(decimal, '.').replace(/[^\d.]/g, '');
    const [entero, ...resto] = limpio.split('.');
    return resto.length ? `${entero}.${resto.join('').slice(0, decimales)}` : entero;
}

// "1234.5" → "1.234,5" (EUR) mientras se escribe
function mostrar(valor, moneda) {
    if (!valor) return '';
    const { miles, decimal } = SEPARADORES[moneda];
    const [entero, decimales] = String(valor).split('.');
    const conMiles = (entero || '0').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, miles);
    return decimales === undefined ? conMiles : `${conMiles}${decimal}${decimales}`;
}

/**
 * Campo de monto en la moneda elegida. `value` y `onChange` usan el número
 * como texto con punto decimal ("1234.5"); para guardar se pasa por aPesos().
 */
function CampoMonto({ value, onChange, ...props }) {
    const { moneda } = usePreferencias();
    return (
        <input
            className="campo-pildora"
            type="text"
            inputMode={MONEDAS[moneda].decimales ? 'decimal' : 'numeric'}
            placeholder="0"
            {...props}
            value={mostrar(value, moneda)}
            onChange={(e) => onChange(limpiar(e.target.value, moneda))}
        />
    );
}

export default CampoMonto;
