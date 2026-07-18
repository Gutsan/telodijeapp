-- ===========================================
-- TELODIJE - SofaScore Integration Tables
-- ===========================================

-- ===========================================
-- TOURNAMENTS TABLE (catálogo de torneos a sincronizar)
-- ===========================================
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  sofascore_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  category_name VARCHAR(255),
  category_id INTEGER,
  country_flag VARCHAR(50),
  sport_id INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_sofascore_id ON tournaments(sofascore_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_is_active ON tournaments(is_active);

-- ===========================================
-- SYNC_LOGS TABLE (registro de sincronizaciones)
-- ===========================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- ===========================================
-- RLS POLICIES
-- ===========================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can read active tournaments
CREATE POLICY "Anyone can view active tournaments" ON tournaments
  FOR SELECT USING (is_active = true);

-- Only admins can manage tournaments
CREATE POLICY "Admins can manage tournaments" ON tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

-- Anyone can view sync logs
CREATE POLICY "Anyone can view sync logs" ON sync_logs
  FOR SELECT USING (true);

-- Only admins can create sync logs
CREATE POLICY "Admins can manage sync logs" ON sync_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

-- Admins can update sync logs (for completion status)
CREATE POLICY "Admins can update sync logs" ON sync_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

-- ===========================================
-- SEED: Top Torneos Importantes (pre-activados)
-- ===========================================
INSERT INTO tournaments (sofascore_id, name, slug, category_name, category_id, country_flag, priority, is_active) VALUES
  (17, 'LaLiga', 'laliga', 'Spain', 7, 'spain', 100, true),
  (17, 'Premier League', 'premier-league', 'England', 1, 'england', 100, true),
  (7, 'UEFA Champions League', 'uefa-champions-league', 'Europe', 1465, 'europe', 95, true),
  (679, 'Copa Libertadores', 'copa-libertadores', 'South America', 20, 'south-america', 85, true),
  (23, 'Serie A', 'serie-a', 'Italy', 8, 'italy', 90, true),
  (34, 'Bundesliga', 'bundesliga', 'Germany', 3, 'germany', 88, true),
  (35, 'Ligue 1', 'ligue-1', 'France', 7, 'france', 85, true),
  (281, 'Liga MX', 'liga-mx', 'Mexico', 26, 'mexico', 80, true),
  (123, 'Brasileirão', 'brasileirao', 'Brazil', 30, 'brazil', 80, true),
  (123, 'Argentina Liga', 'argentina-liga', 'Argentina', 28, 'argentina', 75, true)
ON CONFLICT (sofascore_id) DO NOTHING;
