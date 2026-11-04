// Bloquea el zoom con dos dedos en el iPhone. Safari ignora user-scalable=no
// del viewport, así que hay que cancelar el gesto a mano.
export function bloquearZoom() {
    const cancelar = (evento) => evento.preventDefault();
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((tipo) => {
        document.addEventListener(tipo, cancelar, { passive: false });
    });
    // Respaldo: un toque con dos dedos que cambia la escala
    document.addEventListener('touchmove', (evento) => {
        if (evento.scale !== undefined && evento.scale !== 1) evento.preventDefault();
    }, { passive: false });
}
