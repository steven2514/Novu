// Sistema de traducción de la app (español / inglés), sin dependencias.
//
// Uso en componentes:   const { t, idioma, locale } = useIdioma();
//                       t('inicio.titulo')                 -> "Tu resumen"
//                       t('comun.cuentas', { n: 3 })       -> "3 cuentas" (plural)
//                       t('metas.faltanDias', { n: 12 })   -> "Faltan 12 días"
import { createContext, useContext } from 'react';
import es from './es';
import en from './en';

const DICCIONARIOS = { es, en };
export const IDIOMAS = ['es', 'en'];
const LOCALES = { es: 'es-CO', en: 'en-US' };

function idiomaGuardado() {
    try {
        return localStorage.getItem('idioma') === 'en' ? 'en' : 'es';
    } catch {
        return 'es';
    }
}

// Idioma activo a nivel de módulo: lo usan también utilidades que no son
// componentes (por ejemplo formatearFecha) para elegir el formato correcto.
let idiomaActual = idiomaGuardado();

export function obtenerIdioma() {
    return idiomaActual;
}

export function localeActual() {
    return LOCALES[idiomaActual];
}

export function guardarIdioma(idioma) {
    idiomaActual = IDIOMAS.includes(idioma) ? idioma : 'es';
    try {
        localStorage.setItem('idioma', idiomaActual);
    } catch {
        // sin almacenamiento disponible: el idioma solo dura esta sesión
    }
    document.documentElement.lang = idiomaActual;
    return idiomaActual;
}

function buscar(diccionario, clave) {
    return clave.split('.').reduce((nodo, parte) => (nodo == null ? undefined : nodo[parte]), diccionario);
}

/**
 * Devuelve el texto traducido. Si el valor es { uno, otros } y se pasa { n },
 * elige la forma en singular o plural. Las variables {nombre} se reemplazan.
 * Si falta la traducción en inglés se usa la de español, y si no existe, la clave.
 */
export function traducir(clave, variables) {
    let valor = buscar(DICCIONARIOS[idiomaActual], clave);
    if (valor === undefined) valor = buscar(es, clave);
    if (valor === undefined) return clave;

    if (valor && typeof valor === 'object' && 'uno' in valor && variables && 'n' in variables) {
        valor = Number(variables.n) === 1 ? valor.uno : valor.otros;
    }

    if (typeof valor === 'string' && variables) {
        return valor.replace(/\{(\w+)\}/g, (_, nombre) => (variables[nombre] ?? ''));
    }
    return valor;
}

/** Nombre visible de una categoría guardada como slug (ej: 'comida' -> 'Comida' / 'Food'). */
export function nombreCategoria(slug) {
    if (!slug) return traducir('comun.sinCategoria');
    const valor = buscar(DICCIONARIOS[idiomaActual].categorias, slug) ?? buscar(es.categorias, slug);
    if (typeof valor === 'string') return valor;
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

export const IdiomaContext = createContext({
    idioma: idiomaActual,
    locale: LOCALES[idiomaActual],
    t: traducir,
    cambiarIdioma: () => { },
});

export function useIdioma() {
    return useContext(IdiomaContext);
}

export function valoresIdioma(idioma, cambiarIdioma) {
    return { idioma, locale: LOCALES[idioma], t: traducir, cambiarIdioma };
}
