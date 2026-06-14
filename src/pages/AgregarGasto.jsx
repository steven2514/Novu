import Formulario from '../components/Formulario/Formulario';

function agregarGasto({ setTransacciones}) {
    return (
        <div>
            <h1>Gasto</h1>
            <Formulario setTransacciones={setTransacciones} tipo="gasto"/>
            
        </div>
    );
}

export default agregarGasto;