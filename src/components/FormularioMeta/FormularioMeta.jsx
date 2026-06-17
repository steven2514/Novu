import { useState } from "react";
import './FormularioMeta.css';


function FormularioMeta({setMetas, onClose}) {

    const [nombreMeta, setNombreMeta] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState();
    const [icono, setIcono] = useState('');
    const [color, setColor] = useState('');
    const ICONOS = ['🎯', '✈️', '🏠', '🚗', '🧮', '💻', '🎓', '💰', '🎁', '🎗️'];
    const COLORES = ['#6C63FF', '#4A90D9', '#00D2A0', '#FFB347', '#FF6B6B', '#FF69B4', '#00BCD4'];

    function guardar() {
        setMetas(prev => [...prev, { nombreMeta, montoObjetivo, montoActual, icono,color }]);
        onClose();
        
    }

    return (
        <div className="formulario-meta">
            <h2>Nueva Meta</h2>

            <label>Nombre de la Meta</label>
            <input type="text" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} placeholder="EJ: Iphone 16" />
            
            <label>Monto objetivo</label>
            <input type="number" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="0"/>
            
            <label>Monto Actual</label>
            <input type="text" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} placeholder="0"/>
            
            <label>Icono</label>
            <div className="iconos-opciones">
                {ICONOS.map((ic) => (
                    <div
                        key={ic}
                        className={`icono-opcion ${icono === ic ? 'seleccionado' : ''}`}
                        onClick={() => setIcono(ic)}
                    >{ic}</div>
                ))}
            </div>

            <label>Color</label>
            <div className="color-opciones">
                {COLORES.map((c) => (
                    <div
                        key={c}
                        className={`color-circulo ${color === c ? 'seleccionado' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>
            <button onClick={guardar}>Crear Meta</button>
        </div>
    );
}

export default FormularioMeta;