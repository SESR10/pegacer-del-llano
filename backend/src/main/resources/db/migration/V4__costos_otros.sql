-- Fase 14: otros costos por cochada (energía, mano de obra, etc.). 0 = no se suman otros costos.
INSERT INTO settings (key, value, description) VALUES
 ('costo.otros_por_cochada', '0', 'Otros costos por cochada en pesos (energía, mano de obra, transporte). 0 si no aplica.')
ON CONFLICT (key) DO NOTHING;
