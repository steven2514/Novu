import './TarjetaResumen.css';

function TarjetaResumen({ titulo, valor, color, subtitulo, sinPeso }) {
    return (
        <div className="tarjeta-resumen">
            <p className='tarjeta-titulo'>{titulo}</p>
            <h2 className={`tarjeta-valor ${color}`}>{sinPeso ? '' : '$'}{Number(valor).toLocaleString('es-CO')}</h2>
            <p className='tarjeta-subtitulo'>{subtitulo}</p>
        </div>
    );
}
export default TarjetaResumen;