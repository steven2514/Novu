// Tema (claro/oscuro) y paleta de color de la app.
// Se aplican como atributos de <html> (data-theme y data-paleta) para que
// afecten a toda la app desde el primer render. Los colores viven en
// index.css (paleta por defecto) y paletas.css (el resto).

// "muestra" solo se usa para dibujar la vista previa en Ajustes:
// [sidebar, principal, acento, fondo]
export const PALETAS = [
    { id: 'teal', muestra: ['#0A3A40', '#0B5E66', '#FF6B4A', '#F7F4EE'] },
    { id: 'oceano', muestra: ['#0F2744', '#1D4E89', '#F08A2C', '#F4F6FA'] },
    { id: 'bosque', muestra: ['#173826', '#2F6B4F', '#D9653B', '#F5F4EC'] },
    { id: 'uva', muestra: ['#26184F', '#5B3FA0', '#E94E86', '#F7F5FB'] },
    { id: 'medianoche', muestra: ['#16143A', '#3730A3', '#0EA5E9', '#F5F6FB'] },
    { id: 'cereza', muestra: ['#3F0C1D', '#8C1D40', '#D98A2B', '#FAF5F3'] },
    { id: 'cacao', muestra: ['#3A2314', '#7A4A2A', '#E07A5F', '#F8F3EC'] },
    { id: 'grafito', muestra: ['#111827', '#334155', '#F97316', '#F5F5F4'] },
];

const PALETA_POR_DEFECTO = 'teal';

function leer(clave) {
    try {
        return localStorage.getItem(clave);
    } catch {
        return null;
    }
}

function guardar(clave, valor) {
    try {
        localStorage.setItem(clave, valor);
    } catch {
        // sin almacenamiento disponible: la preferencia solo dura esta sesión
    }
}

export function temaGuardado() {
    return leer('tema') === 'oscuro' ? 'oscuro' : 'claro';
}

export function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema === 'oscuro' ? 'dark' : 'light');
    guardar('tema', tema);
}

export function paletaGuardada() {
    const id = leer('paleta');
    return PALETAS.some(p => p.id === id) ? id : PALETA_POR_DEFECTO;
}

export function aplicarPaleta(id) {
    const paleta = PALETAS.some(p => p.id === id) ? id : PALETA_POR_DEFECTO;
    document.documentElement.setAttribute('data-paleta', paleta);
    guardar('paleta', paleta);
}

export function iniciarApariencia() {
    // La versión anterior guardaba un color suelto como estilo en línea; se descarta.
    ['--principal', '--principal-oscuro', '--principal-claro', '--principal-muy-claro']
        .forEach(v => document.documentElement.style.removeProperty(v));
    aplicarTema(temaGuardado());
    aplicarPaleta(paletaGuardada());
}

// Colores que el usuario puede asignar a cuentas, metas y suscripciones.
export const PALETA_ELEMENTOS = ['#0B5E66', '#1F5FBF', '#5B4FD6', '#1F7A4D', '#5FC4BA', '#E39A2D', '#FF6B4A', '#E5484D', '#334155'];
