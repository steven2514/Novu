-- ============================================================================
-- Migración v3: saldos atómicos, renombrado de cuentas y seguridad (RLS)
-- Fecha: 2026-09-28
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run.
--
-- Se puede ejecutar más de una vez sin romper nada. La app funciona igual
-- antes de ejecutarla (usa el método anterior); después, pasa sola a usar las
-- funciones de aquí.
--
-- QUÉ HACE
--   1. ajustar_saldo / ajustar_meta: suman DENTRO de la base de datos
--      (saldo = saldo + delta). Antes la app calculaba el saldo nuevo en el
--      navegador con el valor que tenía cargado: con dos dispositivos
--      abiertos, uno pisaba el movimiento del otro.
--   2. renombrar_cuenta: cambia el nombre de una cuenta y el de todos sus
--      movimientos, suscripciones y transferencias en una sola operación.
--      Antes renombrar una cuenta dejaba sus movimientos huérfanos.
--   3. Índice único: una persona no puede tener dos cuentas con el mismo nombre.
--   4. RLS en todas las tablas: cada usuario sólo ve y toca sus propias filas.
--
-- AVISO SOBRE RLS: en las tablas de la lista (paso 4) se BORRAN las políticas
-- existentes y se crean las cuatro de "sólo el dueño". Es a propósito: una
-- política antigua demasiado permisiva (p. ej. USING (true)) anularía las
-- nuevas, porque Postgres combina las políticas con OR. La tabla perfiles NO
-- se toca: tiene reglas propias para administradores (migración v2).
-- ============================================================================


-- ── 1. Ajustes atómicos ─────────────────────────────────────────────────────
-- Los ids se reciben como texto y se comparan con id::text para que sirvan
-- igual si la columna es bigint o uuid. SECURITY INVOKER: la función corre con
-- los permisos de quien la llama, así que RLS sigue aplicando.

CREATE OR REPLACE FUNCTION public.ajustar_saldo(p_cuenta_id text, p_delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_saldo numeric;
BEGIN
  UPDATE public.cuentas
     SET saldo = COALESCE(saldo, 0) + p_delta
   WHERE id::text = p_cuenta_id
     AND user_id::text = auth.uid()::text
  RETURNING saldo INTO v_saldo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta % no encontrada', p_cuenta_id USING ERRCODE = 'P0002';
  END IF;
  RETURN v_saldo;
END;
$$;

CREATE OR REPLACE FUNCTION public.ajustar_meta(p_meta_id text, p_delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_monto numeric;
BEGIN
  UPDATE public.metas
     SET monto_actual = COALESCE(monto_actual, 0) + p_delta
   WHERE id::text = p_meta_id
     AND user_id::text = auth.uid()::text
  RETURNING monto_actual INTO v_monto;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meta % no encontrada', p_meta_id USING ERRCODE = 'P0002';
  END IF;
  RETURN v_monto;
END;
$$;


-- ── 2. Renombrar una cuenta en cascada ──────────────────────────────────────
-- Todo ocurre en una sola transacción: o se renombra en todas partes o en
-- ninguna. Los movimientos guardan el NOMBRE de la cuenta (no su id), por eso
-- hay que actualizarlos a la vez.

CREATE OR REPLACE FUNCTION public.renombrar_cuenta(p_cuenta_id text, p_nombre text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anterior text;
  v_nuevo text := btrim(p_nombre);
BEGIN
  IF v_nuevo IS NULL OR v_nuevo = '' THEN
    RAISE EXCEPTION 'El nombre no puede estar vacío' USING ERRCODE = '22023';
  END IF;

  SELECT nombre INTO v_anterior
    FROM public.cuentas
   WHERE id::text = p_cuenta_id AND user_id::text = auth.uid()::text
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta % no encontrada', p_cuenta_id USING ERRCODE = 'P0002';
  END IF;
  IF v_anterior = v_nuevo THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.cuentas
              WHERE user_id::text = auth.uid()::text
                AND lower(nombre) = lower(v_nuevo)
                AND id::text <> p_cuenta_id) THEN
    RAISE EXCEPTION 'Ya tienes una cuenta llamada %', v_nuevo USING ERRCODE = '23505';
  END IF;

  UPDATE public.cuentas SET nombre = v_nuevo
   WHERE id::text = p_cuenta_id AND user_id::text = auth.uid()::text;

  UPDATE public.transacciones SET cuenta = v_nuevo
   WHERE user_id::text = auth.uid()::text AND cuenta = v_anterior;

  UPDATE public.suscripciones SET cuenta = v_nuevo
   WHERE user_id::text = auth.uid()::text AND cuenta = v_anterior;

  UPDATE public.transferencias SET origen = v_nuevo
   WHERE user_id::text = auth.uid()::text AND origen = v_anterior;

  UPDATE public.transferencias SET destino = v_nuevo
   WHERE user_id::text = auth.uid()::text AND destino = v_anterior
     AND COALESCE(tipo_destino, 'cuenta') = 'cuenta';
END;
$$;

-- Sólo usuarios con sesión pueden llamar a estas funciones.
REVOKE ALL ON FUNCTION public.ajustar_saldo(text, numeric)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ajustar_meta(text, numeric)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.renombrar_cuenta(text, text)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ajustar_saldo(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ajustar_meta(text, numeric)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.renombrar_cuenta(text, text) TO authenticated;


-- ── 3. Nombres de cuenta únicos por usuario ─────────────────────────────────
-- Si ya existen duplicados no se crea el índice (fallaría); se avisa para que
-- se renombren desde la app y se vuelva a ejecutar este archivo.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.cuentas
              GROUP BY user_id, lower(nombre) HAVING count(*) > 1) THEN
    RAISE NOTICE 'Hay cuentas con el mismo nombre para un mismo usuario: renómbralas y vuelve a ejecutar esta migración para crear el índice único.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS cuentas_usuario_nombre_unico
      ON public.cuentas (user_id, lower(nombre));
  END IF;
END;
$$;


-- ── 4. Administración: roles y cuentas deshabilitadas ──────────────────────
-- Un administrador puede habilitar o deshabilitar cuentas y nombrar a otros
-- administradores. Ve cifras globales, NO los movimientos de cada persona.

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'usuario',
  ADD COLUMN IF NOT EXISTS habilitado BOOLEAN NOT NULL DEFAULT TRUE;

-- Igual que en la migración v2; se repite por si ésta no se ejecutó.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.perfiles WHERE user_id = auth.uid() AND rol = 'admin');
$$;

-- true salvo que un administrador haya deshabilitado la cuenta. Las políticas
-- RLS del paso 5 la usan: una cuenta deshabilitada no lee ni escribe nada,
-- aunque manipule la app desde el navegador.
CREATE OR REPLACE FUNCTION public.cuenta_activa()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT habilitado FROM public.perfiles WHERE user_id = auth.uid()), TRUE);
$$;

-- Un usuario puede editar su perfil (nombre, moneda, tema…) pero NO su rol ni
-- su estado: sin esto, alguien deshabilitado se habilitaría a sí mismo.
CREATE OR REPLACE FUNCTION public.proteger_campos_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- auth.uid() es nulo en el SQL Editor y con la clave de servicio: ahí se
  -- confía (así se nombra al primer administrador). Con sesión de usuario,
  -- sólo un administrador puede tocar estos dos campos.
  IF auth.uid() IS NOT NULL AND NOT public.es_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.rol := 'usuario';
      NEW.habilitado := TRUE;
    ELSE
      NEW.rol := OLD.rol;
      NEW.habilitado := OLD.habilitado;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfiles_proteger_campos_admin ON public.perfiles;
CREATE TRIGGER perfiles_proteger_campos_admin
  BEFORE INSERT OR UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_admin();

-- Cifras globales para el panel.
CREATE OR REPLACE FUNCTION public.admin_resumen()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_resultado json;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Sólo para administradores' USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'usuarios',          (SELECT count(*) FROM auth.users),
    'nuevosMes',         (SELECT count(*) FROM auth.users WHERE created_at >= date_trunc('month', now())),
    'activos30',         (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '30 days'),
    'deshabilitados',    (SELECT count(*) FROM public.perfiles WHERE habilitado = FALSE),
    'administradores',   (SELECT count(*) FROM public.perfiles WHERE rol = 'admin'),
    'movimientos',       (SELECT count(*) FROM public.transacciones),
    -- left(…, 10)::date sirve tanto si fecha es date, timestamp o texto ISO.
    'movimientosMes',    (SELECT count(*) FROM public.transacciones
                           WHERE left(fecha::text, 10)::date >= date_trunc('month', now())::date),
    'cuentas',           (SELECT count(*) FROM public.cuentas),
    'metas',             (SELECT count(*) FROM public.metas),
    'registrosPorMes',   (SELECT COALESCE(json_agg(json_build_object('mes', to_char(m.mes, 'YYYY-MM'), 'usuarios', m.n) ORDER BY m.mes), '[]'::json)
                            FROM (SELECT date_trunc('month', created_at) AS mes, count(*) AS n
                                    FROM auth.users
                                   WHERE created_at >= date_trunc('month', now()) - interval '5 months'
                                   GROUP BY 1) m)
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;

-- Lista de usuarios con búsqueda por correo o nombre y paginación.
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios(p_busqueda text DEFAULT '', p_limite int DEFAULT 10, p_desde int DEFAULT 0)
RETURNS TABLE (user_id uuid, email text, nombre text, rol text, habilitado boolean,
               creado timestamptz, ultimo_acceso timestamptz, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Sólo para administradores' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, COALESCE(p.nombre, '')::text,
         COALESCE(p.rol, 'usuario')::text, COALESCE(p.habilitado, TRUE),
         u.created_at, u.last_sign_in_at,
         count(*) OVER ()
    FROM auth.users u
    LEFT JOIN public.perfiles p ON p.user_id = u.id
   WHERE COALESCE(p_busqueda, '') = ''
      OR u.email ILIKE '%' || p_busqueda || '%'
      OR COALESCE(p.nombre, '') ILIKE '%' || p_busqueda || '%'
   ORDER BY u.created_at DESC
   LIMIT LEAST(GREATEST(p_limite, 1), 100)
  OFFSET GREATEST(p_desde, 0);
END;
$$;

-- Habilitar / deshabilitar una cuenta. Nadie puede deshabilitarse a sí mismo.
CREATE OR REPLACE FUNCTION public.admin_cambiar_estado(p_user_id uuid, p_habilitado boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Sólo para administradores' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = auth.uid() AND NOT p_habilitado THEN
    RAISE EXCEPTION 'No puedes deshabilitar tu propia cuenta' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.perfiles (user_id, habilitado) VALUES (p_user_id, p_habilitado)
  ON CONFLICT (user_id) DO UPDATE SET habilitado = EXCLUDED.habilitado;
END;
$$;

-- Nombrar o quitar administradores. Nadie puede quitarse el rol a sí mismo
-- (así nunca se queda la app sin ningún administrador por accidente).
CREATE OR REPLACE FUNCTION public.admin_cambiar_rol(p_user_id uuid, p_rol text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Sólo para administradores' USING ERRCODE = '42501';
  END IF;
  IF p_rol NOT IN ('usuario', 'admin') THEN
    RAISE EXCEPTION 'Rol no válido: %', p_rol USING ERRCODE = '22023';
  END IF;
  IF p_user_id = auth.uid() AND p_rol <> 'admin' THEN
    RAISE EXCEPTION 'No puedes quitarte el rol de administrador' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.perfiles (user_id, rol) VALUES (p_user_id, p_rol)
  ON CONFLICT (user_id) DO UPDATE SET rol = EXCLUDED.rol;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_resumen()                         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_listar_usuarios(text, int, int)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_cambiar_estado(uuid, boolean)     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_cambiar_rol(uuid, text)           FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resumen()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cambiar_estado(uuid, boolean)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cambiar_rol(uuid, text)         TO authenticated;

-- Las funciones admin hacen ON CONFLICT (user_id): hace falta que sea único.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'perfiles'
       AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%(user_id)%'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.perfiles GROUP BY user_id HAVING count(*) > 1) THEN
      RAISE NOTICE 'perfiles tiene user_id repetidos: elimina los duplicados y vuelve a ejecutar la migración.';
    ELSE
      CREATE UNIQUE INDEX perfiles_user_id_unico ON public.perfiles (user_id);
    END IF;
  END IF;
END;
$$;

-- PARA NOMBRAR AL PRIMER ADMINISTRADOR (cambia el correo y ejecútalo aparte):
--
--   UPDATE public.perfiles SET rol = 'admin'
--    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-correo@gmail.com');


-- ── 5. RLS: cada usuario sólo ve y modifica lo suyo ─────────────────────────

DO $$
DECLARE
  v_tabla text;
  v_tipo text;
  v_condicion text;
  v_politica record;
BEGIN
  FOREACH v_tabla IN ARRAY ARRAY[
    'cuentas', 'transacciones', 'metas', 'suscripciones',
    'tareas', 'transferencias', 'presupuestos', 'categorias'
  ] LOOP
    -- Tablas que todavía no existen en este proyecto se saltan.
    SELECT data_type INTO v_tipo
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = v_tabla AND column_name = 'user_id';
    IF NOT FOUND THEN
      RAISE NOTICE 'Tabla % sin columna user_id (o inexistente): se omite.', v_tabla;
      CONTINUE;
    END IF;

    -- Con user_id uuid se compara directo (usa el índice); si fuera texto, como
    -- texto. Además la cuenta tiene que estar habilitada (paso 4).
    v_condicion := CASE WHEN v_tipo = 'uuid'
                        THEN 'user_id = auth.uid()'
                        ELSE 'user_id::text = auth.uid()::text' END
                   || ' AND public.cuenta_activa()';

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabla);

    FOR v_politica IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = v_tabla
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', v_politica.policyname, v_tabla);
    END LOOP;

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
                   v_tabla || '_select_propio', v_tabla, v_condicion);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
                   v_tabla || '_insert_propio', v_tabla, v_condicion);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
                   v_tabla || '_update_propio', v_tabla, v_condicion, v_condicion);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
                   v_tabla || '_delete_propio', v_tabla, v_condicion);

    RAISE NOTICE 'RLS aplicada en %.', v_tabla;
  END LOOP;
END;
$$;


-- ── Comprobación (opcional) ─────────────────────────────────────────────────
-- Debe listar 4 políticas "_propio" por tabla y rowsecurity = true:
--
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname = 'public' ORDER BY tablename, cmd;
