import { supabase } from '../lib/supabase';
import type { Match } from '../types';

export const matchService = {
  async getById(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) {
      console.error('Error fetching match:', error);
      return null;
    }

    return data;
  },

  async getUpcoming(limit: number = 10): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }

    return data || [];
  },

  async getByQuiniela(quinielaId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        quiniela_matches!inner(quiniela_id)
      `)
      .eq('quiniela_matches.quiniela_id', quinielaId)
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching matches by quiniela:', error);
      return [];
    }

    return data || [];
  },

  async getWeekly(): Promise<Match[]> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .gte('match_date', startOfWeek.toISOString())
      .lte('match_date', endOfWeek.toISOString())
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly matches:', error);
      return [];
    }

    return data || [];
  },
};
