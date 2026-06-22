function exportarCSV(datos, nombreArchivo) {
    if (!datos || datos.length === 0) return;

    const columnas = Object.keys(datos[0]).filter(k => k !== 'user_id' && k !== 'id');
    const encabezado = columnas.join(',');
    const filas = datos.map(item =>
        columnas.map(col => {
            const valor = item[col] ?? '';
            return `"${String(valor).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csv = [encabezado, ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export default exportarCSV;