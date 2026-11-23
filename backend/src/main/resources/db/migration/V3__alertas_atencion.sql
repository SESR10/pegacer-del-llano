-- Fase 13: quién atendió cada alerta y cuándo (las que se cierran solas quedan sin usuario).
ALTER TABLE alerts ADD COLUMN resolved_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN resolved_by BIGINT REFERENCES users(id);
UPDATE alerts SET resolved_at = created_at WHERE resolved AND resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_at ON alerts (resolved_at DESC);
