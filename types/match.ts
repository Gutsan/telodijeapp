// Match types
export interface Match {
  id: string;
  external_id: string | null;
  home_team: string;
  away_team: string;
  league: string | null;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
  created_at: string;
}

export type MatchInsert = Omit<Match, 'id' | 'created_at'>;
export type MatchUpdate = Partial<Omit<Match, 'id' | 'created_at'>>;
