import './TarjetaResumen.css';

function TarjetaResumen({ titulo, valor, color, subtitulo }) {
    return (
        <div className="tarjeta-resumen">
            <p className='tarjeta-titulo'>{titulo}</p>
            <h2 className={`tarjeta-valor ${color}`}>${valor}</h2>
            <p className='tarjeta-subtitulo'>{subtitulo}</p>
        </div>
    );
}
export default TarjetaResumen;