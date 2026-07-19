-- ===========================================
-- FIX: Allow invite code lookup for all authenticated users
-- Without this, users cannot join private quinielas
-- because RLS blocks SELECT on private quinielas
-- for non-members.
-- ===========================================

CREATE POLICY "Authenticated users can lookup quiniela by invite code" ON quinielas
  FOR SELECT USING (
    invite_code IS NOT NULL
  );
