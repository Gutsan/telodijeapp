// Prediction types
export interface Prediction {
  id: string;
  user_id: string;
  quiniela_id: string;
  match_id: string;
  home_score_prediction: number;
  away_score_prediction: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export type PredictionInsert = Omit<Prediction, 'id' | 'created_at' | 'updated_at' | 'points_earned'>;
export type PredictionUpdate = Partial<Omit<Prediction, 'id' | 'created_at'>>;

// Prediction with match info
export interface PredictionWithMatch extends Prediction {
  match: {
    home_team: string;
    away_team: string;
    match_date: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
  };
}
