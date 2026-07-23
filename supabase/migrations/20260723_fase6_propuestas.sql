-- ============================================================
-- Migración Fase 6: Plantillas de Propuestas
-- GN Studio OS v2.6 — 2026-07-23
-- ============================================================

-- Tabla principal de plantillas
CREATE TABLE IF NOT EXISTS propuestas_plantillas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  categoria    TEXT DEFAULT 'general',
  secciones    JSONB DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_propuestas_plantillas_user
  ON propuestas_plantillas (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_propuestas_plantillas_cat
  ON propuestas_plantillas (categoria);

-- RLS
ALTER TABLE propuestas_plantillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sus plantillas" ON propuestas_plantillas
  FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_propuestas_plantillas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propuestas_plantillas_updated
  BEFORE UPDATE ON propuestas_plantillas
  FOR EACH ROW EXECUTE FUNCTION update_propuestas_plantillas_updated_at();
