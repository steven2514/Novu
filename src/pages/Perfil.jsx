import { useState, useEffect } from "react";
import './Perfil.css';
import { supabase } from '../supabase';
import { useToast } from '../Context/ToastContext';
import { Icon } from '../components/Icon';

const COLORES_ACENTO = [
  { name: 'Amarillo', hex: '#E8CB3D', oscuro: '#B89A1E', gradienteFin: '#A9C95A' },
  { name: 'Verde', hex: '#00EFA4', oscuro: '#059B6C', gradienteFin: '#21B3CC' },
  { name: 'Azul', hex: '#1BC3F3', oscuro: '#108CAF', gradienteFin: '#3B6BD1' },
  { name: 'Morado', hex: '#B688FE', oscuro: '#8740F7', gradienteFin: '#E097ED' },
  { name: 'Coral', hex: '#FF8064', oscuro: '#F7441D', gradienteFin: '#E9C078' },
];

const ICONOS_DISPONIBLES = [
  'credit-card', 'tv', 'music', 'cloud', 'gamepad-2', 'smartphone',
  'laptop', 'clapperboard', 'monitor', 'dumbbell', 'target', 'plane',
  'home', 'car', 'calculator', 'graduation-cap', 'wallet', 'gift',
  'ribbon', 'puzzle', 'bell', 'circle', 'pizza',
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
  const [temaOscuro, setTemaOscuro] = useState(() => localStorage.getItem('tema') === 'oscuro');
  const [colorAcento, setColorAcento] = useState(() => localStorage.getItem('color-acento') || '#E8CB3D');

  // ─── Cambiar contraseña ───
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [passError, setPassError] = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);

  // ─── Categorías ───
  const [categorias, setCategorias] = useState([]);
  const [cargandoCats, setCargandoCats] = useState(true);
  const [editandoCat, setEditandoCat] = useState(null);
  const [catNombre, setCatNombre] = useState('');
  const [catTipo, setCatTipo] = useState('gasto');
  const [catColor, setCatColor] = useState('#E8CB3D');
  const [catIcono, setCatIcono] = useState('target');
  const [guardandoCat, setGuardandoCat] = useState(false);

  // ─── Notificaciones ───
  const [notifRecordatorios, setNotifRecordatorios] = useState(true);
  const [notifSemanal, setNotifSemanal] = useState(false);
  const [zonaHoraria, setZonaHoraria] = useState('America/Bogota');

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
        setNotifRecordatorios(p.notif_recordatorios ?? true);
        setNotifSemanal(p.notif_semanal ?? false);
        setZonaHoraria(p.zona_horaria || 'America/Bogota');
      }
    });
  }, [sesion]);

  // ─── Cargar categorías ───
  function cargarCategorias() {
    if (!sesion) return;
    setCargandoCats(true);
    supabase.from('categorias').select('*').eq('user_id', sesion.user.id).order('nombre').then(({ data }) => {
      setCargandoCats(false);
      if (data) setCategorias(data);
    });
  }

  useEffect(() => {
    cargarCategorias();
  }, [sesion]);

  // ─── Aplicar tema oscuro ───
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', temaOscuro ? 'dark' : 'light');
    localStorage.setItem('tema', temaOscuro ? 'oscuro' : 'claro');
  }, [temaOscuro]);

  function aplicarColor(hex) {
    setColorAcento(hex);
    const obj = COLORES_ACENTO.find(c => c.hex === hex);
    document.documentElement.style.setProperty('--principal', hex);
    document.documentElement.style.setProperty('--principal-oscuro', obj?.oscuro || '#B89A1E');
    document.documentElement.style.setProperty('--principal-claro', hex + '22');
    document.documentElement.style.setProperty('--principal-muy-claro', hex + '11');
    document.documentElement.style.setProperty('--gradiente-balance', `linear-gradient(135deg, ${hex} 0%, ${obj?.gradienteFin || '#A9C95A'} 100%)`);
    localStorage.setItem('color-acento', hex);
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

  // ─── Guardar preferencias de notificaciones ───
  async function guardarNotificaciones() {
    const { error } = await supabase.from('perfiles').update({
      notif_recordatorios: notifRecordatorios,
      notif_semanal: notifSemanal,
      zona_horaria: zonaHoraria,
    }).eq('user_id', sesion.user.id);
    if (error) {
      mostrarToast('Error al guardar preferencias', 'error');
    } else {
      mostrarToast('Preferencias guardadas', 'exito');
    }
  }

  // ─── CRUD de categorías ───
  async function guardarCategoria() {
    if (!catNombre.trim()) {
      mostrarToast('El nombre es obligatorio', 'error');
      return;
    }
    setGuardandoCat(true);
    if (editandoCat) {
      const { error } = await supabase.from('categorias').update({
        nombre: catNombre.trim(),
        tipo: catTipo,
        color: catColor,
        icono: catIcono,
      }).eq('id', editandoCat.id);
      if (error) { mostrarToast('Error al actualizar', 'error'); setGuardandoCat(false); return; }
      mostrarToast('Categoría actualizada', 'exito');
    } else {
      const { error } = await supabase.from('categorias').insert([{
        user_id: sesion.user.id,
        nombre: catNombre.trim(),
        tipo: catTipo,
        color: catColor,
        icono: catIcono,
      }]);
      if (error) { mostrarToast('Error al crear', 'error'); setGuardandoCat(false); return; }
      mostrarToast('Categoría creada', 'exito');
    }
    setGuardandoCat(false);
    cancelarEdicionCat();
    cargarCategorias();
  }

  function editarCategoria(cat) {
    setEditandoCat(cat);
    setCatNombre(cat.nombre);
    setCatTipo(cat.tipo);
    setCatColor(cat.color || '#E8CB3D');
    setCatIcono(cat.icono || 'target');
  }

  function cancelarEdicionCat() {
    setEditandoCat(null);
    setCatNombre('');
    setCatTipo('gasto');
    setCatColor('#E8CB3D');
    setCatIcono('target');
  }

  async function eliminarCategoria(id) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      mostrarToast('Error al eliminar', 'error');
    } else {
      mostrarToast('Categoría eliminada', 'exito');
      cargarCategorias();
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
      <div className="perfil-header">
        <div>
          <h1>Mi Perfil</h1>
          <p>Administra tu cuenta, categorías y preferencias</p>
        </div>
      </div>

      <div className="perfil-grid">

        {/* ─── Sección: Información general ─── */}
        <section className="perfil-card">
          <h2 className="perfil-card-titulo">
            <Icon name="circle" size={18} /> Información general
          </h2>
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

            <button className="perfil-btn primario" onClick={guardarPerfil}>Guardar cambios</button>
          </div>
        </section>

        {/* ─── Sección: Apariencia ─── */}
        <section className="perfil-card">
          <h2 className="perfil-card-titulo">
            <Icon name="sun" size={18} /> Apariencia
          </h2>
          <div className="perfil-card-body">
            <label>Tema</label>
            <div className="perfil-toggle-row">
              <button className={`perfil-toggle-btn ${!temaOscuro ? 'activo' : ''}`} onClick={() => setTemaOscuro(false)}>
                <Icon name="sun" size={14} /> Claro
              </button>
              <button className={`perfil-toggle-btn ${temaOscuro ? 'activo' : ''}`} onClick={() => setTemaOscuro(true)}>
                <Icon name="moon" size={14} /> Oscuro
              </button>
            </div>

            <label>Color de acento</label>
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
          </div>
        </section>

        {/* ─── Sección: Notificaciones ─── */}
        <section className="perfil-card">
          <h2 className="perfil-card-titulo">
            <Icon name="bell" size={18} /> Notificaciones
          </h2>
          <div className="perfil-card-body">
            <div className="perfil-switch-row">
              <div>
                <p className="perfil-switch-label">Recordatorios de hábitos</p>
                <p className="perfil-switch-desc">Recibe recordatorios para cumplir tus hábitos diarios</p>
              </div>
              <label className="perfil-switch">
                <input type="checkbox" checked={notifRecordatorios} onChange={(e) => setNotifRecordatorios(e.target.checked)} />
                <span className="perfil-switch-slider"></span>
              </label>
            </div>

            <div className="perfil-switch-row">
              <div>
                <p className="perfil-switch-label">Resumen semanal</p>
                <p className="perfil-switch-desc">Recibe un resumen de tus finanzas cada semana</p>
              </div>
              <label className="perfil-switch">
                <input type="checkbox" checked={notifSemanal} onChange={(e) => setNotifSemanal(e.target.checked)} />
                <span className="perfil-switch-slider"></span>
              </label>
            </div>

            <label>Zona horaria</label>
            <select value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)}>
              <option value="America/Bogota">América/Bogotá (UTC-5)</option>
              <option value="America/Mexico_City">América/Ciudad de México (UTC-6)</option>
              <option value="America/Argentina/Buenos_Aires">América/Buenos Aires (UTC-3)</option>
              <option value="America/Santiago">América/Santiago (UTC-4)</option>
              <option value="America/Lima">América/Lima (UTC-5)</option>
              <option value="America/Caracas">América/Caracas (UTC-4)</option>
              <option value="America/Panama">América/Panamá (UTC-5)</option>
            </select>

            <button className="perfil-btn primario" onClick={guardarNotificaciones}>Guardar preferencias</button>
          </div>
        </section>

        {/* ─── Sección: Mis categorías ─── */}
        <section className="perfil-card">
          <h2 className="perfil-card-titulo">
            <Icon name="puzzle" size={18} /> Mis categorías
          </h2>
          <div className="perfil-card-body">
            {cargandoCats ? (
              <p className="perfil-cargando">Cargando categorías...</p>
            ) : (
              <>
                <div className="perfil-cat-form">
                  <input
                    type="text"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                  />
                  <select value={catTipo} onChange={(e) => setCatTipo(e.target.value)}>
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                  <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="perfil-color-input" title="Color" />
                  <select value={catIcono} onChange={(e) => setCatIcono(e.target.value)}>
                    {ICONOS_DISPONIBLES.map((ico) => (
                      <option key={ico} value={ico}>{ico}</option>
                    ))}
                  </select>
                  <div className="perfil-cat-form-botones">
                    {editandoCat && (
                      <button className="perfil-btn secundario" onClick={cancelarEdicionCat}>Cancelar</button>
                    )}
                    <button className="perfil-btn primario" onClick={guardarCategoria} disabled={guardandoCat}>
                      {guardandoCat ? 'Guardando...' : editandoCat ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </div>

                {categorias.length === 0 ? (
                  <p className="perfil-vacio">No tienes categorías personalizadas. Crea una arriba.</p>
                ) : (
                  <div className="perfil-cat-lista">
                    {categorias.map((cat) => (
                      <div key={cat.id} className="perfil-cat-item">
                        <span className="perfil-cat-icono" style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                          <Icon name={cat.icono || 'target'} size={16} />
                        </span>
                        <div className="perfil-cat-info">
                          <p className="perfil-cat-nombre">{cat.nombre}</p>
                          <p className="perfil-cat-tipo">{cat.tipo}</p>
                        </div>
                        <span className="perfil-cat-color-muestra" style={{ backgroundColor: cat.color }} />
                        <button className="perfil-cat-accion" onClick={() => editarCategoria(cat)} title="Editar">
                          <Icon name="pencil" size={14} />
                        </button>
                        <button className="perfil-cat-accion eliminar" onClick={() => eliminarCategoria(cat.id)} title="Eliminar">
                          <Icon name="trash-2" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─── Sección: Seguridad ─── */}
        <section className="perfil-card">
          <h2 className="perfil-card-titulo">
            <Icon name="shield" size={18} /> Seguridad
          </h2>
          <div className="perfil-card-body">
            <label>Cambiar contraseña</label>
            <input type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} placeholder="Nueva contraseña" />
            <input type="password" value={passConfirmar} onChange={(e) => setPassConfirmar(e.target.value)} placeholder="Confirmar contraseña" />
            {passError && <p className="perfil-error">{passError}</p>}
            <button className="perfil-btn primario" onClick={cambiarPassword} disabled={guardandoPass}>
              {guardandoPass ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </section>

        {/* ─── Sección: Cerrar sesión ─── */}
        <section className="perfil-card perfil-card-peligro">
          <h2 className="perfil-card-titulo">
            <Icon name="log-out" size={18} /> Sesión
          </h2>
          <div className="perfil-card-body">
            <p className="perfil-card-desc">Cierra tu sesión en este dispositivo</p>
            <button className="perfil-btn peligro" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Perfil;