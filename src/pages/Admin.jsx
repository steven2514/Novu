import { useState, useEffect } from 'react';
import './Admin.css';
import { supabase } from '../supabase';
import { useToast } from '../Context/ToastContext';
import { Icon } from '../components/Icon';

const EDGE_FUNCTION_URL = 'https://grdjvpjlmsahzpitttfx.supabase.co/functions/v1/eliminar-usuario';

function Admin({ sesion }) {
  const { mostrarToast } = useToast();
  const [esAdmin, setEsAdmin] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);

  useEffect(() => {
    if (!sesion) return;
    supabase.from('perfiles').select('rol').eq('user_id', sesion.user.id).single()
      .then(({ data }) => {
        setEsAdmin(data?.rol === 'admin');
      });
  }, [sesion]);

  useEffect(() => {
    if (esAdmin !== true) return;
    setCargando(true);
    supabase.from('perfiles').select('*').order('nombre').then(({ data }) => {
      if (data) setUsuarios(data);
      setCargando(false);
    });
  }, [esAdmin]);

  async function eliminarUsuario(userId) {
    setEliminando(userId);
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error || 'Error al eliminar', 'error');
      } else {
        mostrarToast('Usuario eliminado', 'exito');
        setUsuarios(prev => prev.filter(u => u.user_id !== userId));
        setConfirmarId(null);
      }
    } catch {
      mostrarToast('Error de conexión con el servidor', 'error');
    } finally {
      setEliminando(null);
    }
  }

  if (esAdmin === null) {
    return <div className="admin-page"><div className="admin-loading">Verificando acceso...</div></div>;
  }

  if (esAdmin === false) {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <Icon name="shield" size={48} />
          <h2>Acceso denegado</h2>
          <p>No tienes permisos de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
      </div>

      {cargando ? (
        <div className="admin-loading">Cargando usuarios...</div>
      ) : (
        <div className="admin-tabla">
          <div className="admin-tabla-header">
            <span>Usuario</span>
            <span>Moneda</span>
            <span>Rol</span>
            <span>Registro</span>
            <span></span>
          </div>
          {usuarios.map(u => (
            <div key={u.user_id} className="admin-tabla-fila">
              <div className="admin-usuario-info">
                <div className="admin-avatar">{ (u.nombre || u.user_id).charAt(0).toUpperCase() }</div>
                <div>
                  <p className="admin-usuario-nombre">{u.nombre || 'Sin nombre'}</p>
                  <p className="admin-usuario-email">{u.user_id}</p>
                </div>
              </div>
              <span className="admin-celda">{u.moneda || 'COP'}</span>
              <span className={`admin-celda admin-rol-${u.rol}`}>{u.rol}</span>
              <span className="admin-celda admin-fecha">
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
              </span>
              <span className="admin-celda admin-acciones">
                {confirmarId === u.user_id ? (
                  <div className="admin-confirmar">
                    <span className="admin-confirmar-texto">¿Eliminar?</span>
                    <button className="admin-btn admin-btn-confirmar" onClick={() => eliminarUsuario(u.user_id)} disabled={eliminando === u.user_id}>
                      {eliminando === u.user_id ? '...' : 'Sí'}
                    </button>
                    <button className="admin-btn admin-btn-cancelar" onClick={() => setConfirmarId(null)}>No</button>
                  </div>
                ) : (
                  <button className="admin-btn admin-btn-eliminar" onClick={() => setConfirmarId(u.user_id)} title="Eliminar usuario">
                    <Icon name="trash-2" size={14} />
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;
