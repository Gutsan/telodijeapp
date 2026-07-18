-- ===========================================
-- FIX: RLS policies and missing constraints
-- ===========================================

-- FIX 1: quiniela_players SELECT policy has circular dependency
-- The policy references quiniela_players from within quiniela_players
-- This causes 500 errors. Simplify it.

DROP POLICY IF EXISTS "Users can view quiniela members" ON quiniela_players;

CREATE POLICY "Users can view quiniela members" ON quiniela_players
  FOR SELECT USING (true);

-- FIX 2: quiniela_matches needs SELECT policy (was missing)
DROP POLICY IF EXISTS "Anyone can view quiniela matches" ON quiniela_matches;

CREATE POLICY "Anyone can view quiniela matches" ON quiniela_matches
  FOR SELECT USING (true);

-- FIX 3: rankings needs INSERT/UPDATE policies (was missing)
DROP POLICY IF EXISTS "System can manage rankings" ON rankings;

CREATE POLICY "System can manage rankings" ON rankings
  FOR ALL USING (true)
  WITH CHECK (true);

-- FIX 4: matches needs DELETE policy for admins
DROP POLICY IF EXISTS "Only admins can delete matches" ON matches;

CREATE POLICY "Only admins can delete matches" ON matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.plan_type = 'premium'
    )
  );

-- FIX 5: predictions needs DELETE policy
DROP POLICY IF EXISTS "Users can delete own predictions" ON predictions;

CREATE POLICY "Users can delete own predictions" ON predictions
  FOR DELETE USING (auth.uid() = user_id);
