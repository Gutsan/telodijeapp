// Ranking types
export interface Ranking {
  id: string;
  user_id: string;
  quiniela_id: string;
  total_points: number;
  correct_predictions: number;
  exact_predictions: number;
  position: number | null;
  calculated_at: string;
}

export type RankingInsert = Omit<Ranking, 'id' | 'calculated_at'>;
export type RankingUpdate = Partial<Omit<Ranking, 'id' | 'calculated_at'>>;

// Ranking with user info
export interface RankingWithUser extends Ranking {
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
