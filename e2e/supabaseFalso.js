// Supabase simulado para las pruebas de pantalla.
//
// Intercepta en el navegador las llamadas a Supabase y responde con datos en
// memoria, así las pruebas no tocan la base de datos real ni necesitan una
// cuenta. Imita lo justo de PostgREST (select / insert / update / delete con
// filtros "eq") y las funciones ajustar_saldo / ajustar_meta.

const PROYECTO = 'grdjvpjlmsahzpitttfx';
export const USUARIO = { id: 'usuario-prueba', email: 'prueba@novu.app', user_metadata: { nombre: 'Prueba' } };

function hoy(dias = 0) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function datosIniciales() {
    const u = USUARIO.id;
    return {
        perfiles: [{ id: 1, user_id: u, nombre: 'Prueba', moneda: 'COP', rol: 'usuario', habilitado: true, tours_vistos: 'dashboard,transacciones,cuentas,suscripciones,metas,calendario,aprendizaje' }],
        cuentas: [
            { id: 1, user_id: u, nombre: 'Nequi', tipo: 'debito', saldo: 300000, banco: 'Nequi', color: '#5B4FD6' },
            { id: 2, user_id: u, nombre: 'Nu', tipo: 'debito', saldo: 50000, banco: 'Nu', color: '#0B5E66' },
        ],
        transacciones: [
            { id: 100, user_id: u, descripcion: 'Salario', monto: 2000000, tipo: 'ingreso', categoria: 'salario', cuenta: 'Nequi', fecha: hoy(-1), fuente: '' },
        ],
        metas: [{ id: 9, user_id: u, nombre_meta: 'Viaje', monto_objetivo: 1000000, monto_actual: 100000, fecha_objetivo: hoy(90), icono: 'plane', color: '#E39A2D' }],
        suscripciones: [{ id: 's1', user_id: u, nombre: 'Netflix', monto: 26900, cuenta: 'Nu', frecuencia: 'mensual', fecha_renovacion: hoy(3), icono: 'tv', color: '#E50914' }],
        tareas: [],
        presupuestos: [],
        transferencias: [],
    };
}

function sesionFalsa() {
    const ahora = Math.floor(Date.now() / 1000);
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USUARIO.id, role: 'authenticated', exp: ahora + 3600 })}.firma`;
    return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: ahora + 3600, refresh_token: 'refresco', user: { ...USUARIO, aud: 'authenticated', role: 'authenticated' } };
}

// "user_id=eq.usuario-prueba&id=eq.3" → filas que cumplen
function filtrar(filas, params) {
    const filtros = [...params.entries()].filter(([, v]) => v.startsWith('eq.'));
    return filas.filter(f => filtros.every(([campo, v]) => String(f[campo]) === v.slice(3)));
}

/**
 * Prepara la página: Supabase falso y, salvo conSesion: false, sesión iniciada.
 * Devuelve { db, llamadas } para revisar lo que la app guardó.
 */
export async function prepararApp(page, { moneda, conSesion = true } = {}) {
    const db = datosIniciales();
    // La moneda la decide el perfil (como en la app real)
    if (moneda) db.perfiles[0].moneda = moneda;
    const llamadas = [];
    let siguienteId = 1000;

    await page.addInitScript(({ clave, sesion, moneda }) => {
        if (sesion) localStorage.setItem(clave, JSON.stringify(sesion));
        localStorage.setItem('idioma', 'es');
        if (moneda) localStorage.setItem('moneda', moneda);
    }, { clave: `sb-${PROYECTO}-auth-token`, sesion: conSesion ? sesionFalsa() : null, moneda });

    // Tasas de cambio fijas: 1 COP = 0.00025 USD (US$1 = $4.000)
    await page.route('https://open.er-api.com/**', (ruta) => ruta.fulfill({
        json: { result: 'success', rates: { COP: 1, USD: 0.00025, EUR: 0.0002 } },
    }));

    await page.route(`https://${PROYECTO}.supabase.co/**`, async (ruta) => {
        const pedido = ruta.request();
        const url = new URL(pedido.url());
        const metodo = pedido.method();
        const cuerpo = pedido.postDataJSON?.() ?? null;
        const unObjeto = (pedido.headers().accept || '').includes('vnd.pgrst.object');

        if (url.pathname.startsWith('/auth/v1/user')) return ruta.fulfill({ json: sesionFalsa().user });
        // Iniciar sesión con correo y contraseña
        if (url.pathname.startsWith('/auth/v1/token')) {
            llamadas.push({ tipo: 'login', datos: cuerpo });
            return ruta.fulfill({ json: sesionFalsa() });
        }
        if (url.pathname.startsWith('/auth/v1/')) return ruta.fulfill({ json: {} });

        // Funciones SQL: suman dentro de la "base de datos"
        const rpc = url.pathname.match(/\/rest\/v1\/rpc\/(\w+)/);
        if (rpc) {
            llamadas.push({ tipo: 'rpc', funcion: rpc[1], datos: cuerpo });
            if (rpc[1] === 'ajustar_saldo') {
                const cuenta = db.cuentas.find(c => String(c.id) === cuerpo.p_cuenta_id);
                cuenta.saldo += cuerpo.p_delta;
                return ruta.fulfill({ json: cuenta.saldo });
            }
            if (rpc[1] === 'ajustar_meta') {
                const meta = db.metas.find(m => String(m.id) === cuerpo.p_meta_id);
                meta.monto_actual += cuerpo.p_delta;
                return ruta.fulfill({ json: meta.monto_actual });
            }
            return ruta.fulfill({ json: null });
        }

        const tabla = url.pathname.match(/\/rest\/v1\/(\w+)/)?.[1];
        if (!tabla || !db[tabla]) return ruta.fulfill({ json: [] });
        const elegidas = filtrar(db[tabla], url.searchParams);
        const responder = (filas) => ruta.fulfill({ json: unObjeto ? (filas[0] ?? null) : filas });

        if (metodo === 'GET') return responder(elegidas);
        if (metodo === 'POST') {
            const nuevas = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]).map(f => ({ id: siguienteId++, ...f }));
            db[tabla].push(...nuevas);
            llamadas.push({ tipo: 'insert', tabla, datos: nuevas });
            return responder(nuevas);
        }
        if (metodo === 'PATCH') {
            elegidas.forEach(f => Object.assign(f, cuerpo));
            llamadas.push({ tipo: 'update', tabla, datos: cuerpo });
            return responder(elegidas);
        }
        if (metodo === 'DELETE') {
            db[tabla] = db[tabla].filter(f => !elegidas.includes(f));
            llamadas.push({ tipo: 'delete', tabla });
            return responder(elegidas);
        }
        return ruta.fulfill({ json: [] });
    });

    return { db, llamadas };
}
