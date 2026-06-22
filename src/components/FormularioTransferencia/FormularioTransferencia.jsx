import { useState } from "react";
import './FormularioTransferencia.css';
import { supabase } from '../../supabase';

function FormularioTransferencia({ cuentas, metas, setCuentas, setMetas, onClose, sesion }) {

    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [tipoDestino, setTipoDestino] = useState('cuenta');
    const [monto, setMonto] = useState('');

    function transferir() {
        if (!origen || !destino || !monto) return;

        const cuentaOrigen = cuentas.find(c => c.nombre === origen);
        if (!cuentaOrigen || Number(cuentaOrigen.saldo) < Number(monto)) {
            alert('Saldo insuficiente en la cuenta de origen');
            return;
        }

        const nuevaTransferencia = {
            user_id: sesion.user.id,
            origen,
            destino,
            monto,
            tipo_destino: tipoDestino,
            fecha: new Date().toISOString()
        };

        supabase.from('transferencias').insert([nuevaTransferencia]).then(() => { });

        supabase.from('cuentas').update({ saldo: Number(cuentaOrigen.saldo) - Number(monto) }).eq('id', cuentaOrigen.id).then(() => { });
        setCuentas(prev => prev.map(c => c.id === cuentaOrigen.id ? { ...c, saldo: Number(c.saldo) - Number(monto) } : c));

        if (tipoDestino === 'cuenta') {
            const cuentaDestino = cuentas.find(c => c.nombre === destino);
            supabase.from('cuentas').update({ saldo: Number(cuentaDestino.saldo) + Number(monto) }).eq('id', cuentaDestino.id).then(() => { });
            setCuentas(prev => prev.map(c => c.id === cuentaDestino.id ? { ...c, saldo: Number(c.saldo) + Number(monto) } : c));
        } else {
            const meta = metas.find(m => m.nombre_meta === destino);
            const nuevoMontoActual = Number(meta.monto_actual) + Number(monto);
            supabase.from('metas').update({ monto_actual: nuevoMontoActual }).eq('id', meta.id).then(() => { });
            setMetas(prev => prev.map(m => m.id === meta.id ? { ...m, monto_actual: nuevoMontoActual } : m));
        }

        onClose();
    }

    return (
        <div className="formulario-transferencia">
            <div className="formulario-header">
                <h2>Nueva Transferencia</h2>
                <button className="btn-cerrar-modal" onClick={onClose}>✕</button>
            </div>

            <label>Desde la cuenta</label>
            <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
                <option value="">Seleccionar cuenta de origen</option>
                {cuentas.map((c, i) => (
                    <option key={i} value={c.nombre}>{c.nombre} (${Number(c.saldo).toLocaleString('es-CO')})</option>
                ))}
            </select>

            <label>Hacia</label>
            <select value={tipoDestino} onChange={(e) => { setTipoDestino(e.target.value); setDestino(''); }}>
                <option value="cuenta">Otra cuenta</option>
                <option value="meta">Una meta de ahorro</option>
            </select>

            <label>Destino</label>
            <select value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Seleccionar destino</option>
                {tipoDestino === 'cuenta'
                    ? cuentas.filter(c => c.nombre !== origen).map((c, i) => (
                        <option key={i} value={c.nombre}>{c.nombre}</option>
                    ))
                    : metas.map((m, i) => (
                        <option key={i} value={m.nombre_meta}>{m.nombre_meta}</option>
                    ))
                }
            </select>

            <label>Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />

            <button onClick={transferir}>Transferir</button>
        </div>
    );
}

export default FormularioTransferencia;