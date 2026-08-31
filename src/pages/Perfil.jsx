import { useState, useEffect } from "react";
import './Perfil.css';
import { supabase } from '../supabase';
import { useToast } from '../Context/ToastContext';
import { Icon } from '../components/Icon';

const COLORES_ACENTO = [
  { name: 'Verde', hex: '#00EFA4', oscuro: '#059B6C', gradienteFin: '#21B3CC' },
  { name: 'Azul', hex: '#1BC3F3', oscuro: '#108CAF', gradienteFin: '#3B6BD1' },
  { name: 'Morado', hex: '#B688FE', oscuro: '#8740F7', gradienteFin: '#E097ED' },
  { name: 'Coral', hex: '#FF8064', oscuro: '#F7441D', gradienteFin: '#E9C078' },
  { name: 'Amarillo', hex: '#E8CB3D', oscuro: '#B89A1E', gradienteFin: '#A9C95A' },
];

const CONEXIONES_DISPONIBLES = [
  { nombre: 'Nequi', icono: 'smartphone' },
  { nombre: 'Bancolombia', icono: 'landmark' },
  { nombre: 'Daviplata', icono: 'wallet' },
  { nombre: 'Nu', icono: 'circle' },
  { nombre: 'Davivienda', icono: 'landmark' },
  { nombre: 'Banco de Bogotá', icono: 'landmark' },
];

function Perfil({ sesion, setSesion }) {

  const { mostrarToast } = useToast();
  const email = sesion?.user?.email || '';

  // ─── Datos del perfil ───
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  // ─── Apariencia ───
  const [colorAcento, setColorAcento] = useState(() => localStorage.getItem('color-acento') || '#E8CB3D');
  // Nota: el idioma es solo un interruptor visual guardado en localStorage.
  // La app todavía no tiene sistema de traducción (i18n) real implementado.
  const [idioma, setIdioma] = useState(() => localStorage.getItem('idioma') || 'es');

  // ─── Cambiar contraseña ───
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [passError, setPassError] = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);

  // ─── Cargar perfil desde Supabase ───
  useEffect(() => {
    if (!sesion) return;
    setCargandoPerfil(true);
    supabase.from('perfiles').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
      setCargandoPerfil(false);
      if (data && data.length > 0) {
        const p = data[0];
        setPerfil(p);
        setNombre(p.nombre || '');
        setMoneda(p.moneda || 'COP');
      }
    });
  }, [sesion]);

  function aplicarColor(hex) {
    setColorAcento(hex);
    const obj = COLORES_ACENTO.find(c => c.hex === hex);
    document.documentElement.style.setProperty('--principal', hex);
    document.documentElement.style.setProperty('--principal-oscuro', obj?.oscuro || '#B89A1E');
    document.documentElement.style.setProperty('--principal-claro', hex + '22');
    document.documentElement.style.setProperty('--principal-muy-claro', hex + '11');
    document.documentElement.style.setProperty('--gradiente-balance', `linear-gradient(135deg, ${hex} 0%, ${obj?.gradienteFin || '#A9C95A'} 100%)`);
    document.documentElement.style.setProperty('--acento', hex);
    document.documentElement.style.setProperty('--acento-oscuro', obj?.oscuro || '#B89A1E');
    document.documentElement.style.setProperty('--acento-texto', '#ffffff');
    document.documentElement.style.setProperty('--banner-inicio', hex);
    document.documentElement.style.setProperty('--banner-fin', obj?.gradienteFin || '#A9C95A');
    localStorage.setItem('color-acento', hex);
    localStorage.setItem('color-acento-oscuro', obj?.oscuro || '#B89A1E');
    localStorage.setItem('color-acento-fin', obj?.gradienteFin || '#A9C95A');
  }

  function cambiarIdioma(valor) {
    setIdioma(valor);
    localStorage.setItem('idioma', valor);
  }

  // ─── Guardar datos generales ───
  async function guardarPerfil() {
    if (!nombre.trim()) {
      mostrarToast('El nombre no puede estar vacío', 'error');
      return;
    }
    const datos = { nombre: nombre.trim(), moneda };
    const { error } = await supabase.from('perfiles').update(datos).eq('user_id', sesion.user.id);
    if (error) {
      mostrarToast('Error al guardar perfil', 'error');
    } else {
      mostrarToast('Perfil actualizado', 'exito');
    }
  }

  // ─── Cambiar contraseña ───
  async function cambiarPassword() {
    setPassError('');
    if (!passNueva || passNueva.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passNueva !== passConfirmar) {
      setPassError('Las contraseñas no coinciden');
      return;
    }
    setGuardandoPass(true);
    const { error: err } = await supabase.auth.updateUser({ password: passNueva });
    setGuardandoPass(false);
    if (err) {
      setPassError(err.message);
    } else {
      mostrarToast('Contraseña actualizada', 'exito');
      setPassNueva('');
      setPassConfirmar('');
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setSesion(null);
  }

  if (cargandoPerfil) {
    return (
      <div className="perfil-page">
        <div className="perfil-loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <div className="contenido-pagina">

        <div className="perfil-header">
          <div>
            <h1>Ajustes</h1>
            <p>Administra tu cuenta y preferencias</p>
          </div>
        </div>

        <div className="perfil-grid">

          {/* ─── Apariencia ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo">Apariencia</h2>
            <div className="perfil-card-body">
              <label>Color de la app</label>
              <div className="perfil-colores">
                {COLORES_ACENTO.map((c) => (
                  <button
                    key={c.hex}
                    className={`perfil-color-btn ${colorAcento === c.hex ? 'perfil-color-activo' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => aplicarColor(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="perfil-toggle-grande">
                <button className={idioma === 'es' ? 'activo' : ''} onClick={() => cambiarIdioma('es')}>
                  Español
                </button>
                <button className={idioma === 'en' ? 'activo' : ''} onClick={() => cambiarIdioma('en')}>
                  English
                </button>
              </div>
            </div>
          </section>

          {/* ─── Perfil (información general) ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo">Perfil</h2>
            <div className="perfil-card-body">
              <label>Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />

              <label>Correo electrónico</label>
              <input type="email" value={email} disabled className="perfil-input-disabled" />

              <label>Moneda</label>
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="COP">COP $ — Peso colombiano</option>
                <option value="USD">USD $ — Dólar estadounidense</option>
                <option value="EUR">EUR € — Euro</option>
              </select>

              <button className="btn-pildora-acento btn-ancho-completo" onClick={guardarPerfil}>Guardar</button>
            </div>
          </section>

          {/* ─── Seguridad ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo">Seguridad</h2>
            <div className="perfil-card-body">
              <label>Nueva contraseña</label>
              <input type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} placeholder="Nueva contraseña" />
              <input type="password" value={passConfirmar} onChange={(e) => setPassConfirmar(e.target.value)} placeholder="Confirmar contraseña" />
              {passError && <p className="perfil-error">{passError}</p>}
              <button className="btn-pildora-acento" onClick={cambiarPassword} disabled={guardandoPass}>
                {guardandoPass ? 'Guardando...' : 'Cambiar contraseña'}
              </button>

              <div className="perfil-switch-row">
                <div>
                  <p className="perfil-switch-label">Autenticación en dos pasos</p>
                  <p className="perfil-switch-desc">Pide un código extra al iniciar sesión desde un dispositivo nuevo.</p>
                </div>
                <label className="perfil-switch">
                  <input type="checkbox" disabled />
                  <span className="perfil-switch-slider"></span>
                </label>
              </div>

              <div className="perfil-switch-row">
                <div>
                  <p className="perfil-switch-label">Bloqueo con biometría</p>
                  <p className="perfil-switch-desc">Usa huella o rostro para abrir la app en tu teléfono.</p>
                </div>
                <label className="perfil-switch">
                  <input type="checkbox" disabled />
                  <span className="perfil-switch-slider"></span>
                </label>
              </div>

              <div className="perfil-switch-row">
                <div>
                  <p className="perfil-switch-label">Ocultar saldos</p>
                  <p className="perfil-switch-desc">Oculta las cantidades cuando alguien mira tu pantalla.</p>
                </div>
                <label className="perfil-switch">
                  <input type="checkbox" disabled />
                  <span className="perfil-switch-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* ─── Conexiones (placeholder visual, sin lógica todavía) ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo">Conexiones</h2>
            <div className="perfil-card-body">
              <p className="perfil-card-desc perfil-conexiones-desc">Sincroniza tus cuentas con otras apps de finanzas.</p>
              {CONEXIONES_DISPONIBLES.map((con) => (
                <div key={con.nombre} className="fila-item">
                  <span className="icono-circulo icono-circulo-neutro"><Icon name={con.icono} size={18} /></span>
                  <div className="perfil-cat-info">
                    <p className="perfil-cat-nombre">{con.nombre}</p>
                    <p className="perfil-conexion-estado">Sin conectar</p>
                  </div>
                  <button className="btn-conectar" disabled title="Próximamente">Conectar</button>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Cerrar sesión ─── */}
          <section className="tarjeta-lista perfil-card-peligro">
            <h2 className="perfil-card-titulo">Sesión</h2>
            <div className="perfil-card-body">
              <p className="perfil-card-desc">Cierra tu sesión en este dispositivo</p>
              <button className="perfil-btn peligro" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Perfil