-- ===========================================
-- FIX: Allow invite code lookup + join requests
-- ===========================================

-- 1. Fix RLS: Allow invite code lookup for authenticated users
CREATE POLICY "Authenticated users can lookup quiniela by invite code" ON quinielas
  FOR SELECT USING (
    invite_code IS NOT NULL AND auth.uid() IS NOT NULL
  );

-- 2. New table: join_requests
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiniela_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_jr_quiniela_id ON join_requests(quiniela_id);
CREATE INDEX IF NOT EXISTS idx_jr_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_jr_status ON join_requests(status);

-- 3. RLS for join_requests
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON join_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Quiniela owners can view requests for their quinielas
CREATE POLICY "Owners can view quiniela requests" ON join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quinielas
      WHERE quinielas.id = join_requests.quiniela_id
      AND quinielas.created_by = auth.uid()
    )
  );

-- Users can create their own join requests
CREATE POLICY "Users can create join requests" ON join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owners can update requests (approve/reject)
CREATE POLICY "Owners can update requests" ON join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quinielas
      WHERE quinielas.id = join_requests.quiniela_id
      AND quinielas.created_by = auth.uid()
    )
  );

-- 4. Ensure creator profiles exist for existing quinielas
-- (Run once to fix missing profiles)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT q.created_by
    FROM quinielas q
    LEFT JOIN users u ON u.id = q.created_by
    WHERE u.id IS NULL
  LOOP
    INSERT INTO users (id, email, full_name, plan_type)
    VALUES (r.created_by, r.created_by || '@telodije.app', 'Jugador', 'free')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
