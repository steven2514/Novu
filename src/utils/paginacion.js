/**
 * Páginas a mostrar en una paginación numerada (base 0): siempre la primera y
 * la última, y dos a cada lado de la actual. Donde hay un salto se inserta un
 * hueco, representado como texto ('…N') para que sirva de key única.
 *
 *   paginasVisibles(19, 51)  ->  [0, '…17', 17, 18, 19, 20, 21, '…50', 50]
 */
export function paginasVisibles(actual, total) {
    if (total <= 0) return [];
    const paginas = new Set([0, total - 1]);
    for (let i = actual - 2; i <= actual + 2; i++) {
        if (i >= 0 && i < total) paginas.add(i);
    }
    const ordenadas = [...paginas].sort((a, b) => a - b);
    const resultado = [];
    ordenadas.forEach((p, i) => {
        if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push('…' + p);
        resultado.push(p);
    });
    return resultado;
}
