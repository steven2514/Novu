import { useEffect } from 'react';
import './Toast.css';

function Toast({ mensaje, tipo, onCerrar }) {
    useEffect(() => {
        const t = setTimeout(() => onCerrar(), 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`toast toast-${tipo}`}>
            <span>{mensaje}</span>
        </div>
    );
}

export default Toast;