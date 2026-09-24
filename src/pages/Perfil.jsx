import { useState, useEffect } from "react";
import './Perfil.css';
import { supabase } from '../supabase';
import { useToast } from '../Context/ToastContext';
import { Icon } from '../components/Icon';
import { PALETAS, aplicarPaleta, paletaGuardada, aplicarTema, temaGuardado } from '../utils/tema';
import { useIdioma } from '../i18n/idioma';

const CONEXIONES_DISPONIBLES = [
  { nombre: 'Nequi', icono: 'smartphone' },
  { nombre: 'Bancolombia', icono: 'landmark' },
  { nombre: 'Daviplata', icono: 'wallet' },
  { nombre: 'Nu', icono: 'circle' },
  { nombre: 'Davivienda', icono: 'landmark' },
  { nombre: 'Banco de Bogotá', icono: 'landmark' },
];

const IDIOMAS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
];

function Perfil({ sesion, setSesion }) {

  const { mostrarToast } = useToast();
  const { t, idioma, cambiarIdioma } = useIdioma();
  const email = sesion?.user?.email || '';

  // ─── Datos del perfil ───
  const [nombre, setNombre] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  // ─── Apariencia ───
  const [paleta, setPaleta] = useState(paletaGuardada);
  const [tema, setTema] = useState(temaGuardado);

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
        setNombre(p.nombre || '');
        setMoneda(p.moneda || 'COP');
      }
    });
  }, [sesion]);

  function elegirPaleta(id) {
    setPaleta(id);
    aplicarPaleta(id);
  }

  function cambiarTema(nuevoTema) {
    setTema(nuevoTema);
    aplicarTema(nuevoTema);
  }

  // ─── Guardar datos generales ───
  async function guardarPerfil() {
    if (!nombre.trim()) {
      mostrarToast(t('ajustes.nombreVacio'), 'error');
      return;
    }
    const datos = { nombre: nombre.trim(), moneda };
    const { error } = await supabase.from('perfiles').update(datos).eq('user_id', sesion.user.id);
    if (error) {
      mostrarToast(t('ajustes.errorGuardar'), 'error');
    } else {
      mostrarToast(t('ajustes.perfilActualizado'), 'exito');
    }
  }

  // ─── Cambiar contraseña ───
  async function cambiarPassword() {
    setPassError('');
    if (!passNueva || passNueva.length < 6) {
      setPassError(t('ajustes.passCorta'));
      return;
    }
    if (passNueva !== passConfirmar) {
      setPassError(t('ajustes.passNoCoinciden'));
      return;
    }
    setGuardandoPass(true);
    const { error: err } = await supabase.auth.updateUser({ password: passNueva });
    setGuardandoPass(false);
    if (err) {
      setPassError(err.message);
    } else {
      mostrarToast(t('ajustes.passActualizada'), 'exito');
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
        <div className="perfil-loading">{t('ajustes.cargando')}</div>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <div className="contenido-pagina">

        <div className="perfil-header">
          <div>
            <p className="overline">{t('ajustes.overline')}</p>
            <h1>{t('ajustes.titulo')}</h1>
            <p>{t('ajustes.subtitulo')}</p>
          </div>
        </div>

        {/* ─── Apariencia (ancho completo: tema, idioma y paletas) ─── */}
        <section className="tarjeta-lista perfil-apariencia">
          <h2 className="perfil-card-titulo"><Icon name="palette" size={18} /> {t('ajustes.apariencia')}</h2>
          <div className="perfil-card-body">
            <div className="perfil-apariencia-fila">
              <div>
                <label>{t('ajustes.tema')}</label>
                <div className="perfil-toggle-grande">
                  <button className={tema === 'claro' ? 'activo' : ''} onClick={() => cambiarTema('claro')}>
                    <Icon name="sun" size={16} /> {t('ajustes.claro')}
                  </button>
                  <button className={tema === 'oscuro' ? 'activo' : ''} onClick={() => cambiarTema('oscuro')}>
                    <Icon name="moon" size={16} /> {t('ajustes.oscuro')}
                  </button>
                </div>
              </div>
              <div>
                <label>{t('ajustes.idioma')}</label>
                <div className="perfil-toggle-grande">
                  {IDIOMAS.map((opcion) => (
                    <button key={opcion.codigo} className={idioma === opcion.codigo ? 'activo' : ''} onClick={() => cambiarIdioma(opcion.codigo)}>
                      {opcion.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label>{t('ajustes.paleta')}</label>
            <div className="perfil-paletas">
              {PALETAS.map((p) => {
                const [sidebar, principal, acento, fondo] = p.muestra;
                return (
                  <button
                    key={p.id}
                    className={`perfil-paleta ${paleta === p.id ? 'perfil-paleta-activa' : ''}`}
                    onClick={() => elegirPaleta(p.id)}
                    aria-pressed={paleta === p.id}
                  >
                    {/* Miniatura de la app con los colores de la paleta */}
                    <span className="perfil-paleta-vista" style={{ background: fondo }} aria-hidden="true">
                      <span className="perfil-paleta-sidebar" style={{ background: sidebar }}>
                        <i style={{ background: acento }} />
                      </span>
                      <span className="perfil-paleta-contenido">
                        <span className="perfil-paleta-tarjeta" style={{ background: principal }} />
                        <span className="perfil-paleta-lineas"><i /><i /></span>
                        <span className="perfil-paleta-boton" style={{ background: acento }} />
                      </span>
                    </span>
                    <span className="perfil-paleta-nombre">
                      {t(`ajustes.paletas.${p.id}`)}
                      {paleta === p.id && <Icon name="check" size={14} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="perfil-grid">

          {/* ─── Perfil (información general) ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo"><Icon name="user" size={18} /> {t('ajustes.perfil')}</h2>
            <div className="perfil-card-body">
              <label>{t('ajustes.nombre')}</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('ajustes.tuNombre')} />

              <label>{t('ajustes.correo')}</label>
              <input type="email" value={email} disabled className="perfil-input-disabled" />

              <label>{t('ajustes.moneda')}</label>
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="COP">{t('ajustes.monedas.COP')}</option>
                <option value="USD">{t('ajustes.monedas.USD')}</option>
                <option value="EUR">{t('ajustes.monedas.EUR')}</option>
              </select>

              <button className="btn-pildora-acento btn-ancho-completo" onClick={guardarPerfil}>{t('comun.guardar')}</button>
            </div>
          </section>

          {/* ─── Seguridad ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo"><Icon name="shield-check" size={18} /> {t('ajustes.seguridad')}</h2>
            <div className="perfil-card-body">
              <label>{t('ajustes.nuevaContrasena')}</label>
              <input type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} placeholder={t('ajustes.nuevaContrasena')} />
              <input type="password" value={passConfirmar} onChange={(e) => setPassConfirmar(e.target.value)} placeholder={t('ajustes.confirmarContrasena')} />
              {passError && <p className="perfil-error">{passError}</p>}
              <button className="btn-pildora-acento" onClick={cambiarPassword} disabled={guardandoPass}>
                {guardandoPass ? t('comun.guardando') : t('ajustes.cambiarContrasena')}
              </button>

              {[
                ['dosPasos', 'dosPasosTexto'],
                ['biometria', 'biometriaTexto'],
                ['ocultarSaldos', 'ocultarSaldosTexto'],
              ].map(([titulo, texto]) => (
                <div key={titulo} className="perfil-switch-row">
                  <div>
                    <p className="perfil-switch-label">{t(`ajustes.${titulo}`)}</p>
                    <p className="perfil-switch-desc">{t(`ajustes.${texto}`)}</p>
                  </div>
                  <label className="perfil-switch" title={t('ajustes.proximamente')}>
                    <input type="checkbox" disabled />
                    <span className="perfil-switch-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Conexiones (placeholder visual, sin lógica todavía) ─── */}
          <section className="tarjeta-lista">
            <h2 className="perfil-card-titulo"><Icon name="link" size={18} /> {t('ajustes.conexiones')}</h2>
            <div className="perfil-card-body">
              <p className="perfil-card-desc perfil-conexiones-desc">{t('ajustes.conexionesTexto')}</p>
              {CONEXIONES_DISPONIBLES.map((con) => (
                <div key={con.nombre} className="fila-item">
                  <span className="icono-circulo icono-circulo-neutro"><Icon name={con.icono} size={18} /></span>
                  <div className="perfil-cat-info">
                    <p className="perfil-cat-nombre">{con.nombre}</p>
                    <p className="perfil-conexion-estado">{t('ajustes.sinConectar')}</p>
                  </div>
                  <button className="btn-conectar" disabled title={t('ajustes.proximamente')}>{t('ajustes.conectar')}</button>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Cerrar sesión ─── */}
          <section className="tarjeta-lista perfil-card-peligro">
            <h2 className="perfil-card-titulo"><Icon name="log-out" size={18} /> {t('ajustes.sesion')}</h2>
            <div className="perfil-card-body">
              <p className="perfil-card-desc">{t('ajustes.sesionTexto')}</p>
              <button className="perfil-btn peligro" onClick={cerrarSesion}>
                {t('ajustes.cerrarSesion')}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Perfil
