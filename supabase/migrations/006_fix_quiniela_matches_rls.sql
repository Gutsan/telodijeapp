-- ===========================================
-- FIX: quiniela_matches INSERT/DELETE policies
-- ===========================================
-- La tabla quiniela_matches tenía RLS habilitado pero sin políticas
-- INSERT/DELETE, causando errores al vincular partidos a quinielas.

-- Owner puede vincular matches a su quiniela
DROP POLICY IF EXISTS "Owners can link matches to quinielas" ON quiniela_matches;
CREATE POLICY "Owners can link matches to quinielas" ON quiniela_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quinielas
      WHERE quinielas.id = quiniela_id
      AND quinielas.created_by = auth.uid()
    )
  );

-- Player puede vincular matches a quinielas donde es miembro
DROP POLICY IF EXISTS "Players can link matches to their quinielas" ON quiniela_matches;
CREATE POLICY "Players can link matches to their quinielas" ON quiniela_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiniela_players
      WHERE quiniela_players.quiniela_id = quiniela_id
      AND quiniela_players.user_id = auth.uid()
    )
  );

-- Owner puede desvincular matches de su quiniela
DROP POLICY IF EXISTS "Owners can unlink matches from quinielas" ON quiniela_matches;
CREATE POLICY "Owners can unlink matches from quinielas" ON quiniela_matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quinielas
      WHERE quinielas.id = quiniela_id
      AND quinielas.created_by = auth.uid()
    )
  );

-- Player puede desvincular matches de quinielas donde es miembro
DROP POLICY IF EXISTS "Players can unlink matches from their quinielas" ON quiniela_matches;
CREATE POLICY "Players can unlink matches from their quinielas" ON quiniela_matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quiniela_players
      WHERE quiniela_players.quiniela_id = quiniela_id
      AND quiniela_players.user_id = auth.uid()
    )
  );
