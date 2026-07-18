import { supabase } from '../lib/supabase';
import type { Prediction, PredictionInsert } from '../types';

export const predictionService = {
  async getByQuinielaAndUser(
    quinielaId: string,
    userId: string
  ): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('quiniela_id', quinielaId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }

    return data || [];
  },

  async save(prediction: PredictionInsert): Promise<Prediction | null> {
    // Check if prediction already exists
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', prediction.user_id)
      .eq('match_id', prediction.match_id)
      .eq('quiniela_id', prediction.quiniela_id)
      .single();

    if (existing) {
      // Update existing prediction
      const { data, error } = await supabase
        .from('predictions')
        .update({
          home_score_prediction: prediction.home_score_prediction,
          away_score_prediction: prediction.away_score_prediction,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prediction:', error);
        return null;
      }

      return data;
    } else {
      // Create new prediction
      const { data, error } = await supabase
        .from('predictions')
        .insert(prediction)
        .select()
        .single();

      if (error) {
        console.error('Error creating prediction:', error);
        return null;
      }

      return data;
    }
  },

  async canPredict(matchId: string): Promise<boolean> {
    const { data: match, error } = await supabase
      .from('matches')
      .select('match_date, status')
      .eq('id', matchId)
      .single();

    if (error || !match) return false;

    // Can't predict if match has started or is finished
    if (match.status !== 'scheduled') return false;

    // Can't predict if match is less than 5 minutes away
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return matchTime - now > fiveMinutes;
  },
};
