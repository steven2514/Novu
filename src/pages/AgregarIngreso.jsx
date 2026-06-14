import Formulario from '../components/Formulario/Formulario';

function agregarIngreso({setTransacciones}) {
    return (
        <div>
            <h1>Ingreso</h1>
            <Formulario setTransacciones={setTransacciones} tipo="ingreso"/>
        </div>
    );
}

export default agregarIngreso;