-- ═══════════════════════════════════════════════════════════════════════════
-- Migración v5: tiempo y repetición en las tareas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Agrega a cada tarea:
--   creada_en           cuándo se creó (para "terminada en 2 días")
--   completada_en       cuándo se marcó como terminada
--   minutos_estimados   cuánto crees que te va a tomar (opcional)
--   segundos_trabajados tiempo acumulado con el cronómetro
--   cronometro_desde    si el cronómetro está corriendo, desde cuándo
--   repetir             nunca / diaria / semanal / mensual
--
-- Es segura de ejecutar más de una vez. Las tareas que ya existen no cambian:
-- quedan sin repetición y con el tiempo en cero.
--
-- Cómo ejecutarla: Supabase → SQL Editor → pegar todo → Run.

BEGIN;

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS creada_en           timestamptz,
  ADD COLUMN IF NOT EXISTS completada_en       timestamptz,
  ADD COLUMN IF NOT EXISTS minutos_estimados   integer,
  ADD COLUMN IF NOT EXISTS segundos_trabajados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cronometro_desde    timestamptz,
  ADD COLUMN IF NOT EXISTS repetir             text NOT NULL DEFAULT 'nunca';

-- Las tareas viejas toman su fecha de creación de created_at, si la tabla la
-- tiene. Si no, quedan sin fecha y la app simplemente no muestra "terminada en".
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'tareas' AND column_name = 'created_at') THEN
    EXECUTE 'UPDATE public.tareas SET creada_en = created_at WHERE creada_en IS NULL';
  END IF;
END $$;

-- Las tareas nuevas guardan la hora de creación solas
ALTER TABLE public.tareas
  ALTER COLUMN creada_en SET DEFAULT now();

ALTER TABLE public.tareas DROP CONSTRAINT IF EXISTS tareas_repetir_valido;
ALTER TABLE public.tareas
  ADD CONSTRAINT tareas_repetir_valido CHECK (repetir IN ('nunca', 'diaria', 'semanal', 'mensual'));

ALTER TABLE public.tareas DROP CONSTRAINT IF EXISTS tareas_tiempos_validos;
ALTER TABLE public.tareas
  ADD CONSTRAINT tareas_tiempos_validos CHECK (
    segundos_trabajados >= 0 AND (minutos_estimados IS NULL OR minutos_estimados > 0)
  );

COMMIT;
