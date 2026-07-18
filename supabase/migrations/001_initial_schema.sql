-- ===========================================
-- TELODIJE - INITIAL SCHEMA
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- ===========================================
-- MATCHES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(100) UNIQUE,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  league VARCHAR(255),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for matches
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);

-- ===========================================
-- QUINIELAS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS quinielas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT true,
  max_players INTEGER DEFAULT 10,
  invite_code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quinielas
CREATE INDEX IF NOT EXISTS idx_quinielas_created_by ON quinielas(created_by);
CREATE INDEX IF NOT EXISTS idx_quinielas_invite_code ON quinielas(invite_code);

-- ===========================================
-- QUINIELA_PLAYERS TABLE (Many-to-Many)
-- ===========================================
CREATE TABLE IF NOT EXISTS quiniela_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('owner', 'admin', 'player')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiniela_id, user_id)
);

-- Index for quiniela_players
CREATE INDEX IF NOT EXISTS idx_qp_quiniela_id ON quiniela_players(quiniela_id);
CREATE INDEX IF NOT EXISTS idx_qp_user_id ON quiniela_players(user_id);

-- ===========================================
-- QUINIELA_MATCHES TABLE (Many-to-Many)
-- ===========================================
CREATE TABLE IF NOT EXISTS quiniela_matches (
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  PRIMARY KEY (quiniela_id, match_id)
);

-- Index for quiniela_matches
CREATE INDEX IF NOT EXISTS idx_qm_quiniela_id ON quiniela_matches(quiniela_id);
CREATE INDEX IF NOT EXISTS idx_qm_match_id ON quiniela_matches(match_id);

-- ===========================================
-- PREDICTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  home_score_prediction INTEGER NOT NULL CHECK (home_score_prediction >= 0),
  away_score_prediction INTEGER NOT NULL CHECK (away_score_prediction >= 0),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiniela_id, match_id)
);

-- Index for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_user_quiniela ON predictions(user_id, quiniela_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- ===========================================
-- RANKINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  exact_predictions INTEGER DEFAULT 0,
  position INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiniela_id)
);

-- Index for rankings
CREATE INDEX IF NOT EXISTS idx_rankings_quiniela ON rankings(quiniela_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quinielas_updated_at
  BEFORE UPDATE ON quinielas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE quinielas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Matches policies (public read)
CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

CREATE POLICY "Only admins can update matches" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

-- Quinielas policies
CREATE POLICY "Users can view public quinielas" ON quinielas
  FOR SELECT USING (
    is_private = false
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM quiniela_players
      WHERE quiniela_players.quiniela_id = quinielas.id
      AND quiniela_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create quinielas" ON quinielas
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their quinielas" ON quinielas
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their quinielas" ON quinielas
  FOR DELETE USING (created_by = auth.uid());

-- Quiniela players policies
CREATE POLICY "Users can view quiniela members" ON quiniela_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiniela_players qp
      WHERE qp.quiniela_id = quiniela_players.quiniela_id
      AND qp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join quinielas" ON quiniela_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave quinielas" ON quiniela_players
  FOR DELETE USING (auth.uid() = user_id);

-- Predictions policies
CREATE POLICY "Users can view own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Rankings policies (viewable by quiniela members)
CREATE POLICY "Users can view quiniela rankings" ON rankings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiniela_players
      WHERE quiniela_players.quiniela_id = rankings.quiniela_id
      AND quiniela_players.user_id = auth.uid()
    )
  );
