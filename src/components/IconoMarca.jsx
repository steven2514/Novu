import { buscarMarca } from '../utils/marcas';
import { rem } from '../utils/escala';

// Ícono circular con el logo de la marca. Devuelve null si no reconoce la marca
// (el componente que lo usa debe hacer fallback al ícono genérico en ese caso).
// El catálogo de marcas y buscarMarca() están en utils/marcas.js.
export function IconoMarca({ nombre, size = 20, badgeSize, borderRadius = '12px', className = '' }) {
    const marca = buscarMarca(nombre);
    if (!marca) return null;

    const { Comp, bg, fg } = marca;
    const tamañoBadge = badgeSize || size + 22;

    return (
        <div
            className={`icono-marca ${className}`}
            style={{
                width: rem(tamañoBadge),
                height: rem(tamañoBadge),
                borderRadius,
                backgroundColor: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: bg === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
            }}
        >
            <Comp size={rem(size)} color={fg} />
        </div>
    );
}
