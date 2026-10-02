-- ═══════════════════════════════════════════════════════════════════════════
-- Migración v4: moneda por cuenta
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cada cuenta puede estar en pesos (COP), dólares (USD) o euros (EUR) y su
-- saldo se guarda en esa moneda (ej: una cuenta en dólares con saldo 120.50).
-- Los movimientos, metas, suscripciones y presupuestos siguen en pesos; la app
-- convierte con la tasa del día al sumar o restar de una cuenta en otra moneda.
--
-- Es segura de ejecutar más de una vez. Las cuentas que ya existen quedan en
-- COP, así que nada cambia hasta que elijas otra moneda para una cuenta.
--
-- Cómo ejecutarla: Supabase → SQL Editor → pegar todo → Run.

BEGIN;

-- 1. Moneda de la cuenta (por defecto pesos)
ALTER TABLE public.cuentas
  ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'COP';

ALTER TABLE public.cuentas
  DROP CONSTRAINT IF EXISTS cuentas_moneda_valida;
ALTER TABLE public.cuentas
  ADD CONSTRAINT cuentas_moneda_valida CHECK (moneda IN ('COP', 'USD', 'EUR'));

-- 2. Saldos con centavos (US$120.50). Si la columna ya era numeric no cambia nada.
ALTER TABLE public.cuentas
  ALTER COLUMN saldo TYPE numeric USING saldo::numeric;

COMMIT;
