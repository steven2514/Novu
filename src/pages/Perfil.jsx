import { useState, useEffect, useId } from "react";
import './Perfil.css';
import { supabase } from '../supabase';
import { useToast } from '../Context/toast';
import { Icon } from '../components/Icon';
import { PALETAS, aplicarPaleta, paletaGuardada, aplicarTema, temaGuardado } from '../utils/tema';
import { useIdioma } from '../i18n/idioma';
import { usePreferencias } from '../Context/preferencias';

const IDIOMAS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
];

function Perfil({ sesion, setSesion }) {
    // Ids para conectar cada etiqueta con su campo (accesibilidad)
    const idForm = useId();

  const { mostrarToast } = useToast();
  const { t, idioma, cambiarIdioma } = useIdioma();
  const email = sesion?.user?.email || '';

  // ─── Datos del perfil ───
  const [nombre, setNombre] = useState('');
  const { cambiarMoneda, saldosOcultos, cambiarSaldosOcultos } = usePreferencias();
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
  // cargandoPerfil ya arranca en true, así que aquí sólo se apaga al responder.
  useEffect(() => {
    if (!sesion) return;
    let vigente = true; // si se sale de la página antes de la respuesta, se ignora
    supabase.from('perfiles').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
      if (!vigente) return;
      setCargandoPerfil(false);
      if (data && data.length > 0) {
        const p = data[0];
        setNombre(p.nombre || '');
        setMoneda(p.moneda || 'COP');
      }
    });
    return () => { vigente = false; };
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
      cambiarMoneda(moneda);
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
                <p className="etiqueta-campo">{t('ajustes.tema')}</p>
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
                <p className="etiqueta-campo">{t('ajustes.idioma')}</p>
                <div className="perfil-toggle-grande">
                  {IDIOMAS.map((opcion) => (
                    <button key={opcion.codigo} className={idioma === opcion.codigo ? 'activo' : ''} onClick={() => cambiarIdioma(opcion.codigo)}>
                      {opcion.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="etiqueta-campo">{t('ajustes.paleta')}</p>
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
              <label htmlFor={`${idForm}-1`}>{t('ajustes.nombre')}</label>
              <input id={`${idForm}-1`} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('ajustes.tuNombre')} />

              <label htmlFor={`${idForm}-2`}>{t('ajustes.correo')}</label>
              <input id={`${idForm}-2`} type="email" value={email} disabled className="perfil-input-disabled" />

              <label htmlFor={`${idForm}-3`}>{t('ajustes.moneda')}</label>
              <select id={`${idForm}-3`} value={moneda} onChange={(e) => setMoneda(e.target.value)}>
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
              <label htmlFor={`${idForm}-4`}>{t('ajustes.nuevaContrasena')}</label>
              <input id={`${idForm}-4`} type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} placeholder={t('ajustes.nuevaContrasena')} />
              <input type="password" value={passConfirmar} onChange={(e) => setPassConfirmar(e.target.value)} placeholder={t('ajustes.confirmarContrasena')} aria-label={t('ajustes.confirmarContrasena')} />
              {passError && <p className="perfil-error">{passError}</p>}
              <button className="btn-pildora-acento" onClick={cambiarPassword} disabled={guardandoPass}>
                {guardandoPass ? t('comun.guardando') : t('ajustes.cambiarContrasena')}
              </button>

              <div className="perfil-switch-row">
                <div>
                  <p className="perfil-switch-label" id={`${idForm}-ocultar`}>{t('ajustes.ocultarSaldos')}</p>
                  <p className="perfil-switch-desc">{t('ajustes.ocultarSaldosTexto')}</p>
                </div>
                <label className="perfil-switch">
                  <input
                    type="checkbox"
                    checked={saldosOcultos}
                    onChange={(e) => cambiarSaldosOcultos(e.target.checked)}
                    aria-labelledby={`${idForm}-ocultar`}
                  />
                  <span className="perfil-switch-slider"></span>
                </label>
              </div>
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
