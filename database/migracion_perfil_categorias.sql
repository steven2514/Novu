-- ============================================================
-- Migración: perfil + categorías personalizadas
-- Fecha: 2026-07-28
-- Ejecutar en el Editor SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 1. Agregar columnas faltantes a la tabla perfiles
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS nombre TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'COP',
ADD COLUMN IF NOT EXISTS notif_recordatorios BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_semanal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS zona_horaria TEXT DEFAULT 'America/Bogota';

-- 2. Crear tabla de categorías personalizadas
CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso')),
  color TEXT DEFAULT '#6C63FF',
  icono TEXT DEFAULT 'target',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);

-- 4. RLS: perfiles
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfiles_select_own ON perfiles;
CREATE POLICY perfiles_select_own ON perfiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS perfiles_insert_own ON perfiles;
CREATE POLICY perfiles_insert_own ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS perfiles_update_own ON perfiles;
CREATE POLICY perfiles_update_own ON perfiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS: categorías
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categorias_select_own ON categorias;
CREATE POLICY categorias_select_own ON categorias
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS categorias_insert_own ON categorias;
CREATE POLICY categorias_insert_own ON categorias
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS categorias_update_own ON categorias;
CREATE POLICY categorias_update_own ON categorias
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS categorias_delete_own ON categorias;
CREATE POLICY categorias_delete_own ON categorias
  FOR DELETE USING (auth.uid() = user_id);
