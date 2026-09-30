// Tamaño general de la interfaz.
//
// Todo el CSS usa rem, y el tamaño de 1rem lo decide --escala en index.css
// (1 = 16px, 1.125 = 18px...). Lo que se dibuja con números desde JavaScript
// (iconos, alto de las gráficas) pasa por aquí para crecer igual que el resto.

/** Tamaño de diseño en px (a escala 1) → valor CSS en rem, ej: 18 → '1.125rem'. */
export function rem(px) {
    return `${px / 16}rem`;
}

/** Tamaño de diseño en px → px reales según la escala actual (para librerías que sólo aceptan números). */
export function pxEscalados(px) {
    if (typeof document === 'undefined') return px;
    const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return Math.round(px * (base / 16));
}
