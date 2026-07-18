import { supabase } from '../lib/supabase';
import type { Quiniela, QuinielaInsert, QuinielaPlayer } from '../types';

export const quinielaService = {
  async getById(quinielaId: string): Promise<Quiniela | null> {
    const { data, error } = await supabase
      .from('quinielas')
      .select('*')
      .eq('id', quinielaId)
      .single();

    if (error) {
      console.error('Error fetching quiniela:', error);
      return null;
    }

    return data;
  },

  async getByInviteCode(inviteCode: string): Promise<Quiniela | null> {
    const { data, error } = await supabase
      .from('quinielas')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error) {
      console.error('Error fetching quiniela by code:', error);
      return null;
    }

    return data;
  },

  async create(quiniela: QuinielaInsert): Promise<Quiniela | null> {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('quinielas')
      .insert({ ...quiniela, invite_code: inviteCode })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiniela:', error);
      return null;
    }

    return data;
  },

  async join(quinielaId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quiniela_players')
      .insert({
        quiniela_id: quinielaId,
        user_id: userId,
        role: 'player',
      });

    if (error) {
      console.error('Error joining quiniela:', error);
      return false;
    }

    return true;
  },

  async getPlayers(quinielaId: string): Promise<QuinielaPlayer[]> {
    const { data, error } = await supabase
      .from('quiniela_players')
      .select('*')
      .eq('quiniela_id', quinielaId);

    if (error) {
      console.error('Error fetching players:', error);
      return [];
    }

    return data || [];
  },

  async isPlayer(quinielaId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('quiniela_players')
      .select('id')
      .eq('quiniela_id', quinielaId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  },
};
