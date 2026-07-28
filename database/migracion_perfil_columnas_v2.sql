-- ============================================================
-- Migración v2: rol admin + policies corregidas
-- Fecha: 2026-07-28
-- Ejecutar en el Editor SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 1. Agregar columna rol (se pega a las columnas v2 ya existentes)
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS ingreso_mensual NUMERIC,
  ADD COLUMN IF NOT EXISTS meta_ahorro_descripcion TEXT,
  ADD COLUMN IF NOT EXISTS meta_ahorro_monto NUMERIC,
  ADD COLUMN IF NOT EXISTS notif_alertas_gasto BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'claro',
  ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin'));

-- 2. Función helper es_admin() con SECURITY DEFINER para bypassear RLS
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE user_id = auth.uid() AND rol = 'admin'
  );
$$;

-- 3. Reemplazar policies de perfiles (DROP + CREATE para ser re-ejecutable)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfiles_select_own ON perfiles;
DROP POLICY IF EXISTS perfiles_insert_own ON perfiles;
DROP POLICY IF EXISTS perfiles_update_own ON perfiles;
DROP POLICY IF EXISTS "usuarios solo ven sus datos" ON perfiles;

CREATE POLICY perfiles_select ON perfiles
  FOR SELECT USING (auth.uid() = user_id OR es_admin());

CREATE POLICY perfiles_insert ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND rol = 'usuario');

CREATE POLICY perfiles_update ON perfiles
  FOR UPDATE
  USING (auth.uid() = user_id OR es_admin())
  WITH CHECK (
    es_admin()
    OR (auth.uid() = user_id AND rol = 'usuario')
  );
