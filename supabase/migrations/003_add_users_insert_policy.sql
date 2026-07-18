-- ===========================================
-- FIX: Add INSERT policy for users table
-- The trigger handles profile creation server-side,
-- but the client also needs to create profiles
-- as a fallback when the trigger hasn't fired yet.
-- ===========================================

CREATE POLICY "Authenticated users can create own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
