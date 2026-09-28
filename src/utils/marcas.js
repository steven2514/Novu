import {
    SiNetflix,
    SiSpotify,
    SiDropbox,
    SiYoutube,
    SiHbomax,
    SiApplemusic,
    SiIcloud,
    SiParamountplus,
    SiCrunchyroll,
    SiTwitch,
    SiPlaystation,
    SiSteam,
    SiTidal,
    SiDeezer,
    SiNotion,
    SiGoogledrive,
    SiGoogleplay,
} from 'react-icons/si';

// Vive fuera de IconoMarca.jsx para que ese archivo exporte sólo componentes
// (lo exige el Fast Refresh de Vite para recargar en caliente sin perder estado).

// Mapa de marcas conocidas: clave = texto a buscar (en minúsculas, sin tildes) dentro del nombre de la suscripción.
// bg = color de fondo del badge, fg = color del ícono, Comp = componente del logo.
const MARCAS = [
    { match: ['netflix'], Comp: SiNetflix, bg: '#000000', fg: '#E50914' },
    { match: ['spotify'], Comp: SiSpotify, bg: '#000000', fg: '#1DB954' },
    { match: ['dropbox'], Comp: SiDropbox, bg: '#0061FF', fg: '#ffffff' },
    { match: ['youtube'], Comp: SiYoutube, bg: '#FF0000', fg: '#ffffff' },
    { match: ['hbo'], Comp: SiHbomax, bg: '#000000', fg: '#ffffff' },
    { match: ['apple music', 'applemusic'], Comp: SiApplemusic, bg: '#000000', fg: '#FA243C' },
    { match: ['icloud'], Comp: SiIcloud, bg: '#3693F3', fg: '#ffffff' },
    { match: ['paramount'], Comp: SiParamountplus, bg: '#0064FF', fg: '#ffffff' },
    { match: ['crunchyroll'], Comp: SiCrunchyroll, bg: '#F47521', fg: '#ffffff' },
    { match: ['twitch'], Comp: SiTwitch, bg: '#9146FF', fg: '#ffffff' },
    { match: ['playstation', 'ps plus', 'psn'], Comp: SiPlaystation, bg: '#003791', fg: '#ffffff' },
    { match: ['steam'], Comp: SiSteam, bg: '#1B2838', fg: '#ffffff' },
    { match: ['tidal'], Comp: SiTidal, bg: '#000000', fg: '#ffffff' },
    { match: ['deezer'], Comp: SiDeezer, bg: '#A238FF', fg: '#ffffff' },
    { match: ['notion'], Comp: SiNotion, bg: '#ffffff', fg: '#000000' },
    { match: ['google drive', 'googledrive'], Comp: SiGoogledrive, bg: '#ffffff', fg: '#0F9D58' },
    { match: ['google play', 'googleplay'], Comp: SiGoogleplay, bg: '#ffffff', fg: '#00DDA6' },
];

function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

// Busca una marca conocida a partir del nombre de la suscripción (ej: "Netflix Premium" -> Netflix).
export function buscarMarca(nombre) {
    const texto = normalizar(nombre);
    return MARCAS.find((m) => m.match.some((clave) => texto.includes(clave))) || null;
}
