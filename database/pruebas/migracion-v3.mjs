// Prueba de la migración v3 (npm run test:db).
//
// Ejecuta database/migracion_v3_saldos_y_seguridad.sql en un Postgres de verdad
// que corre dentro de Node (PGlite), sobre un esquema que imita al de Supabase
// (auth.users, auth.uid(), roles anon/authenticated). La corre dos veces para
// comprobar que se puede repetir, y después actúa como dos usuarios y como
// administrador para verificar RLS, saldos atómicos, renombrado de cuentas y
// las funciones de administración. No toca la base de datos real.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const migracion = readFileSync(new URL('../migracion_v3_saldos_y_seguridad.sql', import.meta.url), 'utf8');
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
let fallos = 0;

function ok(cond, texto) { console.log((cond ? '  ✔ ' : '  ✘ ') + texto); if (!cond) fallos++; }
async function como(uid, fn) {
    await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    if (uid) await db.exec('SET ROLE authenticated;');
    try { return await fn(); } finally { await db.exec('RESET ROLE;'); }
}
async function error(fn) { try { await fn(); return null; } catch (e) { return e; } }

// ── Esquema parecido al de Supabase ──
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, created_at timestamptz DEFAULT now(), last_sign_in_at timestamptz);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
  GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;

  CREATE TABLE perfiles (id bigint GENERATED ALWAYS AS IDENTITY, user_id uuid, nombre text, tours_vistos text);
  CREATE TABLE cuentas (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, nombre text, saldo numeric, tipo text);
  CREATE TABLE transacciones (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, cuenta text, monto numeric, tipo text, fecha timestamptz);
  CREATE TABLE metas (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, nombre_meta text, monto_actual numeric);
  CREATE TABLE suscripciones (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, cuenta text, monto numeric);
  CREATE TABLE tareas (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, titulo text);
  CREATE TABLE transferencias (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, origen text, destino text, monto numeric, tipo_destino text);
  CREATE TABLE presupuestos (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid, categoria text, monto numeric);
  GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

  -- Una política vieja demasiado permisiva: la migración debe quitarla.
  ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
  CREATE POLICY todo_abierto ON cuentas USING (true);

  INSERT INTO auth.users (id, email, last_sign_in_at) VALUES ('${A}', 'ana@x.com', now()), ('${B}', 'beto@x.com', now() - interval '60 days');
  INSERT INTO perfiles (user_id, nombre) VALUES ('${A}', 'Ana'), ('${B}', 'Beto');
  INSERT INTO cuentas (user_id, nombre, saldo) VALUES ('${A}', 'Banco', 1000), ('${A}', 'Efectivo', 50), ('${B}', 'Banco', 777);
  INSERT INTO transacciones (user_id, cuenta, monto, tipo, fecha) VALUES ('${A}', 'Banco', 10, 'gasto', now()), ('${B}', 'Banco', 5, 'gasto', now());
  INSERT INTO suscripciones (user_id, cuenta, monto) VALUES ('${A}', 'Banco', 30);
  INSERT INTO transferencias (user_id, origen, destino, monto, tipo_destino) VALUES ('${A}', 'Banco', 'Efectivo', 5, 'cuenta'), ('${A}', 'Efectivo', 'Banco', 1, 'cuenta');
  INSERT INTO metas (user_id, nombre_meta, monto_actual) VALUES ('${A}', 'Viaje', NULL);
`);

console.log('Migración (1.ª vez)');
await db.exec(migracion);
console.log('  ✔ se ejecutó sin errores');
console.log('Migración (2.ª vez, idempotencia)');
await db.exec(migracion);
console.log('  ✔ se volvió a ejecutar sin errores');

const idBancoA = (await db.query(`SELECT id FROM cuentas WHERE user_id='${A}' AND nombre='Banco'`)).rows[0].id;
const idBancoB = (await db.query(`SELECT id FROM cuentas WHERE user_id='${B}'`)).rows[0].id;
const idMeta = (await db.query(`SELECT id FROM metas`)).rows[0].id;

console.log('RLS');
await como(A, async () => {
    const r = await db.query('SELECT nombre FROM cuentas');
    ok(r.rows.length === 2, `Ana ve sólo sus 2 cuentas (ve ${r.rows.length}); la política "todo_abierto" ya no aplica`);
    const t = await db.query('SELECT count(*)::int n FROM transacciones');
    ok(t.rows[0].n === 1, 'Ana ve sólo sus movimientos');
    const e = await error(() => db.query(`INSERT INTO cuentas (user_id, nombre, saldo) VALUES ('${B}', 'Robada', 0)`));
    ok(e !== null, 'Ana no puede crear una cuenta a nombre de Beto');
});

console.log('Saldos atómicos');
await como(A, async () => {
    const r = await db.query(`SELECT ajustar_saldo($1, 250) AS s`, [String(idBancoA)]);
    ok(Number(r.rows[0].s) === 1250, `ajustar_saldo suma dentro de la base (1000 + 250 = ${r.rows[0].s})`);
    const r2 = await db.query(`SELECT ajustar_saldo($1, -300) AS s`, [String(idBancoA)]);
    ok(Number(r2.rows[0].s) === 950, 'y resta');
    const e = await error(() => db.query(`SELECT ajustar_saldo($1, 1)`, [String(idBancoB)]));
    ok(e && /no encontrada/.test(e.message), 'Ana no puede tocar el saldo de Beto');
    const m = await db.query(`SELECT ajustar_meta($1, 40) AS m`, [String(idMeta)]);
    ok(Number(m.rows[0].m) === 40, 'ajustar_meta parte de 0 cuando monto_actual es NULL');
});
ok(Number((await db.query(`SELECT saldo FROM cuentas WHERE id=$1`, [idBancoB])).rows[0].saldo) === 777, 'el saldo de Beto sigue intacto');

console.log('Renombrar cuenta');
await como(A, async () => {
    const e = await error(() => db.query(`SELECT renombrar_cuenta($1, 'efectivo')`, [String(idBancoA)]));
    ok(e && e.code === '23505', 'rechaza un nombre que ya usa otra cuenta (sin importar mayúsculas)');
    await db.query(`SELECT renombrar_cuenta($1, '  Bancolombia ')`, [String(idBancoA)]);
    const c = await db.query(`SELECT nombre FROM cuentas WHERE id=$1`, [idBancoA]);
    ok(c.rows[0].nombre === 'Bancolombia', 'renombra la cuenta (y quita espacios)');
    const t = await db.query(`SELECT cuenta FROM transacciones`);
    ok(t.rows.every(x => x.cuenta === 'Bancolombia'), 'y sus movimientos');
    const s = await db.query(`SELECT cuenta FROM suscripciones`);
    ok(s.rows[0].cuenta === 'Bancolombia', 'y sus suscripciones');
    const tr = await db.query(`SELECT origen, destino FROM transferencias ORDER BY id`);
    ok(tr.rows[0].origen === 'Bancolombia' && tr.rows[1].destino === 'Bancolombia', 'y sus transferencias (origen y destino)');
});
ok((await db.query(`SELECT cuenta FROM transacciones WHERE user_id='${B}'`)).rows[0].cuenta === 'Banco', 'el "Banco" de Beto no se tocó');

console.log('Protección de rol y estado');
await como(A, async () => {
    await db.query(`UPDATE perfiles SET rol = 'admin', habilitado = false, nombre = 'Ana M.' WHERE user_id = '${A}'`);
});
const pA = (await db.query(`SELECT rol, habilitado, nombre FROM perfiles WHERE user_id='${A}'`)).rows[0];
ok(pA.rol === 'usuario' && pA.habilitado === true, 'un usuario no puede hacerse admin ni cambiar su estado');
ok(pA.nombre === 'Ana M.', 'pero sí editar el resto de su perfil');
await como(A, async () => {
    const e = await error(() => db.query('SELECT admin_resumen()'));
    ok(e && e.code === '42501', 'un usuario normal no puede usar las funciones admin');
});

console.log('Administrador');
await como(null, () => db.query(`UPDATE perfiles SET rol = 'admin' WHERE user_id = '${A}'`)); // SQL Editor
ok((await db.query(`SELECT rol FROM perfiles WHERE user_id='${A}'`)).rows[0].rol === 'admin', 'desde el SQL Editor se nombra al primer admin');
await como(A, async () => {
    const r = (await db.query('SELECT admin_resumen() AS r')).rows[0].r;
    ok(r.usuarios === 2 && r.activos30 === 1 && r.administradores === 1, `admin_resumen: ${JSON.stringify({ usuarios: r.usuarios, activos30: r.activos30, admins: r.administradores, movimientos: r.movimientos })}`);
    const l = await db.query(`SELECT * FROM admin_listar_usuarios('beto', 10, 0)`);
    ok(l.rows.length === 1 && l.rows[0].email === 'beto@x.com' && Number(l.rows[0].total) === 1, 'admin_listar_usuarios busca por correo');
    const e = await error(() => db.query(`SELECT admin_cambiar_estado('${A}', false)`));
    ok(e !== null, 'el admin no puede deshabilitarse a sí mismo');
    const e2 = await error(() => db.query(`SELECT admin_cambiar_rol('${A}', 'usuario')`));
    ok(e2 !== null, 'ni quitarse el rol de admin');
    await db.query(`SELECT admin_cambiar_estado('${B}', false)`);
});
await como(B, async () => {
    const r = await db.query('SELECT count(*)::int n FROM cuentas');
    ok(r.rows[0].n === 0, 'Beto deshabilitado ya no ve sus cuentas');
    const e = await error(() => db.query(`INSERT INTO tareas (user_id, titulo) VALUES ('${B}', 'x')`));
    ok(e !== null, 'ni puede crear datos');
    const p = await db.query(`SELECT habilitado FROM perfiles WHERE user_id='${B}'`);
    ok(p.rows[0]?.habilitado === false, 'pero sí puede leer su perfil (así la app le explica por qué)');
});
await como(A, () => db.query(`SELECT admin_cambiar_estado('${B}', true)`));
await como(B, async () => {
    ok((await db.query('SELECT count(*)::int n FROM cuentas')).rows[0].n === 1, 'al rehabilitarlo recupera sus datos');
});

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`);
process.exit(fallos ? 1 : 0);
