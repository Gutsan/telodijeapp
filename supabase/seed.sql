-- ===========================================
-- TELODIJE - SEED DATA
-- ===========================================

-- ===========================================
-- SAMPLE USERS
-- ===========================================
INSERT INTO users (id, email, full_name, avatar_url, provider, plan_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@telodije.com', 'Super Admin', NULL, 'email', 'premium'),
  ('550e8400-e29b-41d4-a716-446655440002', 'juan@example.com', 'Juan Pérez', NULL, 'email', 'free'),
  ('550e8400-e29b-41d4-a716-446655440003', 'maria@example.com', 'María García', NULL, 'google', 'free'),
  ('550e8400-e29b-41d4-a716-446655440004', 'carlos@example.com', 'Carlos López', NULL, 'email', 'premium'),
  ('550e8400-e29b-41d4-a716-446655440005', 'ana@example.com', 'Ana Martínez', NULL, 'google', 'free');

-- ===========================================
-- SAMPLE MATCHES
-- ===========================================
INSERT INTO matches (id, external_id, home_team, away_team, league, match_date, status, home_score, away_score) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'ext-001', 'Real Madrid', 'FC Barcelona', 'La Liga', NOW() + INTERVAL '2 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440002', 'ext-002', 'Manchester City', 'Liverpool FC', 'Premier League', NOW() + INTERVAL '3 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440003', 'ext-003', 'Bayern Munich', 'Borussia Dortmund', 'Bundesliga', NOW() + INTERVAL '4 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440004', 'ext-004', 'PSG', 'Olympique Marsella', 'Ligue 1', NOW() + INTERVAL '5 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440005', 'ext-005', 'Juventus', 'AC Milan', 'Serie A', NOW() + INTERVAL '6 days', 'scheduled', NULL, NULL);

-- ===========================================
-- SAMPLE QUINIELAS
-- ===========================================
INSERT INTO quinielas (id, name, description, created_by, is_private, max_players, invite_code) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Quiniela General Semanal', 'Quiniela oficial de la semana con los 10 partidos más importantes', '550e8400-e29b-41d4-a716-446655440001', false, 100, 'GENERAL'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Amigos del Fútbol', 'Competición entre amigos de la universidad', '550e8400-e29b-41d4-a716-446655440002', true, 10, 'AMIGOS'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Oficina Telodije', 'Quiniela del trabajo', '550e8400-e29b-41d4-a716-446655440003', true, 8, 'OFicina');

-- ===========================================
-- SAMPLE QUINIELA PLAYERS
-- ===========================================
INSERT INTO quiniela_players (quiniela_id, user_id, role) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'player'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'player'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'owner'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'player'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'player');

-- ===========================================
-- SAMPLE QUINIELA MATCHES
-- ===========================================
INSERT INTO quiniela_matches (quiniela_id, match_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002');

-- ===========================================
-- SAMPLE PREDICTIONS
-- ===========================================
INSERT INTO predictions (user_id, quiniela_id, match_id, home_score_prediction, away_score_prediction, points_earned) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 2, 1, 0),
  ('550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1, 1, 0),
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 3, 2, 0),
  ('550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 2, 2, 0);

-- ===========================================
-- SAMPLE RANKINGS
-- ===========================================
INSERT INTO rankings (user_id, quiniela_id, total_points, correct_predictions, exact_predictions, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 4, 1, 0, 1),
  ('550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 2, 0, 0, 2);
