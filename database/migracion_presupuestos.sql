-- ============================================================
-- Migración: presupuestos mensuales por categoría
-- Fecha: 2026-09-24
-- Ejecutar en el Editor SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 1. Tabla: un límite de gasto mensual por categoría y usuario
CREATE TABLE IF NOT EXISTS presupuestos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, categoria)
);

-- 2. Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON presupuestos(user_id);

-- 3. RLS: cada usuario solo ve y modifica sus propios presupuestos
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presupuestos_select_own ON presupuestos;
CREATE POLICY presupuestos_select_own ON presupuestos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS presupuestos_insert_own ON presupuestos;
CREATE POLICY presupuestos_insert_own ON presupuestos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS presupuestos_update_own ON presupuestos;
CREATE POLICY presupuestos_update_own ON presupuestos
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS presupuestos_delete_own ON presupuestos;
CREATE POLICY presupuestos_delete_own ON presupuestos
  FOR DELETE USING (auth.uid() = user_id);
