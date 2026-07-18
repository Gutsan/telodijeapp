import { supabase } from '../lib/supabase';
import type { RankingWithUser } from '../types';

export const rankingService = {
  async getByQuiniela(quinielaId: string): Promise<RankingWithUser[]> {
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq('quiniela_id', quinielaId)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }

    return data || [];
  },

  async getUserPosition(
    quinielaId: string,
    userId: string
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from('rankings')
      .select('position')
      .eq('quiniela_id', quinielaId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return data.position;
  },

  async getUserStats(
    quinielaId: string,
    userId: string
  ): Promise<{
    total_points: number;
    correct_predictions: number;
    exact_predictions: number;
  } | null> {
    const { data, error } = await supabase
      .from('rankings')
      .select('total_points, correct_predictions, exact_predictions')
      .eq('quiniela_id', quinielaId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      total_points: data.total_points,
      correct_predictions: data.correct_predictions,
      exact_predictions: data.exact_predictions,
    };
  },
};
