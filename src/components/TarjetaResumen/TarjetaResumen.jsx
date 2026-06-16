import './TarjetaResumen.css';

function TarjetaResumen({ titulo, valor, color }) {
    return (
        <div className="tarjeta-resumen">
            <p className='tarjeta-titulo'>{titulo }</p>
            <h2 className='tarjeta-valor'>{valor }</h2>
        </div>
    );
}

export default TarjetaResumen;