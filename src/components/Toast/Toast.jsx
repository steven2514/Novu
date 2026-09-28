import { useEffect, useRef } from 'react';
import './Toast.css';

function Toast({ mensaje, tipo, onCerrar }) {
    // Con la ref el temporizador corre una sola vez aunque onCerrar cambie de
    // identidad en cada render; como dependencia, el toast podría no cerrarse.
    const onCerrarRef = useRef(onCerrar);
    useEffect(() => { onCerrarRef.current = onCerrar; }, [onCerrar]);

    useEffect(() => {
        const t = setTimeout(() => onCerrarRef.current(), 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`toast toast-${tipo}`}>
            <span>{mensaje}</span>
        </div>
    );
}

export default Toast;