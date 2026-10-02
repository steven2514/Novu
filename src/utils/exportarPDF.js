// Exporta un reporte en PDF con la identidad de Novu: encabezado con el logo,
// tarjetas de resumen, una tabla y pie de página con la numeración.
//
// jsPDF se importa al momento de exportar (no al cargar la app): pesa bastante
// y sólo lo necesita quien pulsa "Exportar".
//
// Uso:
//   await exportarPDF({
//     titulo: 'Movimientos',
//     subtitulo: '120 registros',
//     archivo: 'novu-movimientos',
//     resumen: [{ etiqueta: 'Total ingresos', valor: '$2.800.000', tono: 'positivo' }],
//     columnas: [{ titulo: 'Fecha' }, { titulo: 'Monto', alinear: 'right' }],
//     filas: [['30 sept 2026', { texto: '+$2.800.000', tono: 'positivo' }]],
//   });

import { traducir, localeActual } from '../i18n/idioma';
import { dinero } from './moneda';

// Colores de la marca (RGB)
const COLOR = {
    tinta: [16, 38, 43],
    teal: [11, 94, 102],
    tealOscuro: [10, 58, 64],
    brillo: [127, 214, 207],
    coral: [255, 107, 74],
    crema: [247, 244, 238],
    borde: [230, 226, 218],
    gris: [94, 107, 110],
    grisClaro: [139, 150, 153],
    blanco: [255, 255, 255],
    positivo: [18, 167, 127],
    negativo: [229, 72, 77],
};

const ANCHO = 210;   // A4 vertical, en mm
const ALTO = 297;
const MARGEN = 14;

/**
 * Dibuja el logo de Novu (barras de crecimiento con el punto de la meta)
 * dentro de un cuadrado de 'lado' mm con esquina superior izquierda (x, y).
 * Es el mismo dibujo del favicon y de la pantalla de carga.
 */
function dibujarLogo(doc, x, y, lado) {
    const e = lado / 140; // el diseño original mide 140×140
    doc.setFillColor(...COLOR.blanco);
    doc.roundedRect(x, y, lado, lado, 32 * e, 32 * e, 'F');
    doc.setFillColor(...COLOR.teal);
    [[35, 80, 30], [58, 65, 45], [81, 45, 65]].forEach(([bx, by, alto]) => {
        doc.roundedRect(x + bx * e, y + by * e, 14 * e, alto * e, 6 * e, 6 * e, 'F');
    });
    doc.setFillColor(...COLOR.coral);
    doc.circle(x + 88 * e, y + 33 * e, 7 * e, 'F');
}

function dibujarMarca(doc, x, yBase, tamano) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(tamano);
    doc.setTextColor(...COLOR.blanco);
    doc.text('Novu', x, yBase);
    doc.setTextColor(...COLOR.brillo);
    doc.text('App', x + doc.getTextWidth('Novu'), yBase);
}

/** Encabezado grande de la primera página. */
function dibujarEncabezado(doc, titulo, fechaTexto) {
    doc.setFillColor(...COLOR.tealOscuro);
    doc.rect(0, 0, ANCHO, 40, 'F');
    // Detalle decorativo: círculos suaves a la derecha, recortados a la franja
    doc.saveGraphicsState();
    doc.rect(0, 0, ANCHO, 40, null);
    doc.clip();
    doc.discardPath();
    doc.setFillColor(...COLOR.teal);
    doc.circle(ANCHO - 18, 6, 26, 'F');
    doc.setFillColor(19, 128, 127);
    doc.circle(ANCHO - 4, 34, 16, 'F');
    doc.restoreGraphicsState();
    // Línea coral inferior
    doc.setFillColor(...COLOR.coral);
    doc.rect(0, 40, ANCHO, 1.2, 'F');

    dibujarLogo(doc, MARGEN, 11, 18);
    dibujarMarca(doc, MARGEN + 23, 20, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(191, 217, 214);
    doc.text(traducir('marca.lema'), MARGEN + 23, 26.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLOR.blanco);
    doc.text(titulo, ANCHO - MARGEN, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(191, 217, 214);
    doc.text(fechaTexto, ANCHO - MARGEN, 26.5, { align: 'right' });
}

/** Encabezado compacto para las páginas siguientes. */
function dibujarEncabezadoCompacto(doc, titulo) {
    doc.setFillColor(...COLOR.tealOscuro);
    doc.rect(0, 0, ANCHO, 16, 'F');
    doc.setFillColor(...COLOR.coral);
    doc.rect(0, 16, ANCHO, 0.8, 'F');
    dibujarLogo(doc, MARGEN, 4, 8);
    dibujarMarca(doc, MARGEN + 11, 10, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.blanco);
    doc.text(titulo, ANCHO - MARGEN, 10, { align: 'right' });
}

/** Tarjetas de resumen (hasta 4 por fila). Devuelve la y donde terminan. */
function dibujarResumen(doc, resumen, y) {
    if (!resumen.length) return y;
    const porFila = Math.min(resumen.length, 4);
    const separacion = 4;
    const ancho = (ANCHO - MARGEN * 2 - separacion * (porFila - 1)) / porFila;
    const alto = 20;

    resumen.forEach((dato, i) => {
        const fila = Math.floor(i / porFila);
        const col = i % porFila;
        const x = MARGEN + col * (ancho + separacion);
        const yy = y + fila * (alto + separacion);

        doc.setFillColor(...COLOR.crema);
        doc.setDrawColor(...COLOR.borde);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, yy, ancho, alto, 3, 3, 'FD');
        // Franja de color a la izquierda
        doc.setFillColor(...(COLOR[dato.tono] || COLOR.teal));
        doc.roundedRect(x, yy, 1.6, alto, 0.8, 0.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...COLOR.gris);
        doc.text(String(dato.etiqueta).toUpperCase(), x + 5, yy + 7, { maxWidth: ancho - 8 });

        doc.setFontSize(12.5);
        doc.setTextColor(...(COLOR[dato.tono] || COLOR.tinta));
        doc.text(String(dato.valor), x + 5, yy + 15, { maxWidth: ancho - 8 });
    });

    const filas = Math.ceil(resumen.length / porFila);
    return y + filas * alto + (filas - 1) * separacion;
}

function dibujarPies(doc) {
    const total = doc.getNumberOfPages();
    for (let n = 1; n <= total; n++) {
        doc.setPage(n);
        doc.setDrawColor(...COLOR.borde);
        doc.setLineWidth(0.3);
        doc.line(MARGEN, ALTO - 14, ANCHO - MARGEN, ALTO - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR.grisClaro);
        doc.text(`NovuApp · ${traducir('marca.lema')}`, MARGEN, ALTO - 9);
        doc.text(traducir('pdf.pagina', { n, total }), ANCHO - MARGEN, ALTO - 9, { align: 'right' });
    }
}

export async function exportarPDF({ titulo, subtitulo = '', archivo, resumen = [], columnas, filas }) {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const ahora = new Date();
    const fechaTexto = traducir('pdf.generado', {
        fecha: ahora.toLocaleDateString(localeActual(), { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    doc.setProperties({ title: `NovuApp — ${titulo}`, creator: 'NovuApp' });
    dibujarEncabezado(doc, titulo, fechaTexto);

    let y = 52;
    if (subtitulo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...COLOR.gris);
        doc.text(subtitulo, MARGEN, y);
        y += 5;
    }
    y = dibujarResumen(doc, resumen, y) + 8;

    // Cada celda puede ser un texto o { texto, tono } para colorear montos
    const cuerpo = filas.length
        ? filas.map(fila => fila.map(celda => (celda && typeof celda === 'object' ? celda.texto : celda ?? '')))
        : [[{ content: traducir('pdf.sinDatos'), colSpan: columnas.length, styles: { halign: 'center', textColor: COLOR.grisClaro } }]];

    autoTable(doc, {
        startY: y,
        margin: { top: 24, left: MARGEN, right: MARGEN, bottom: 20 },
        head: [columnas.map(c => c.titulo)],
        body: cuerpo,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: COLOR.tinta,
            cellPadding: { top: 3.2, bottom: 3.2, left: 3, right: 3 },
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: COLOR.teal,
            textColor: COLOR.blanco,
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: COLOR.crema },
        columnStyles: Object.fromEntries(columnas.map((c, i) => [i, {
            halign: c.alinear || 'left',
            ...(c.ancho ? { cellWidth: c.ancho } : {}),
            ...(c.negrita ? { fontStyle: 'bold' } : {}),
        }])),
        didParseCell(data) {
            if (data.section === 'head') {
                data.cell.styles.halign = columnas[data.column.index]?.alinear || 'left';
                return;
            }
            const original = filas[data.row.index]?.[data.column.index];
            if (original && typeof original === 'object' && original.tono) {
                data.cell.styles.textColor = COLOR[original.tono] || COLOR.tinta;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        didDrawCell(data) {
            // Línea fina entre filas (tras la última celda, para que ningún fondo la tape)
            if (data.section === 'body' && data.column.index === columnas.length - 1) {
                doc.setDrawColor(...COLOR.borde);
                doc.setLineWidth(0.15);
                doc.line(MARGEN, data.cell.y + data.cell.height, ANCHO - MARGEN, data.cell.y + data.cell.height);
            }
        },
        didDrawPage(data) {
            if (data.pageNumber > 1) dibujarEncabezadoCompacto(doc, titulo);
        },
    });

    dibujarPies(doc);

    const fechaArchivo = ahora.toISOString().slice(0, 10);
    doc.save(`${archivo}-${fechaArchivo}.pdf`);
}

/** Formato de dinero usado en los reportes (pesos colombianos). */
// En el PDF los montos siempre se ven, aunque "ocultar saldos" esté activo
export function pesos(valor) {
    return dinero(valor, { ocultable: false });
}
