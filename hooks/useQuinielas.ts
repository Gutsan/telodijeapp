import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Quiniela, QuinielaWithPlayers, QuinielaPlayer } from '../types';
import { quinielaService } from '../services/quiniela.service';

interface CreateQuinielaResult {
  data: Quiniela | null;
  error: string | null;
}

interface JoinQuinielaResult {
  error: string | null;
}

export function useQuinielas() {
  const [quinielas, setQuinielas] = useState<QuinielaWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchQuinielas(userId: string) {
    try {
      setLoading(true);
      setError(null);
      
      // Get quinielas where user is a player
      const { data: playerQuinielas, error: playerError } = await supabase
        .from('quiniela_players')
        .select('quiniela_id')
        .eq('user_id', userId);

      if (playerError) throw playerError;

      const quinielaIds = playerQuinielas?.map(p => p.quiniela_id) || [];
      
      if (quinielaIds.length === 0) {
        setQuinielas([]);
        return;
      }

      // Get quinielas details
      const { data, error } = await supabase
        .from('quinielas')
        .select(`
          *,
          quiniela_players(
            id,
            user_id,
            role,
            joined_at
          )
        `)
        .in('id', quinielaIds);

      if (error) throw error;

      // Transform data to include player count
      const quinielasWithCount = (data || []).map(q => ({
        ...q,
        player_count: q.quiniela_players?.length || 0,
        match_count: 0, // Will be loaded separately if needed
      }));

      setQuinielas(quinielasWithCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching quinielas');
    } finally {
      setLoading(false);
    }
  }

  async function createQuiniela(quiniela: Omit<Quiniela, 'id' | 'created_at' | 'updated_at'>): Promise<CreateQuinielaResult> {
    try {
      setError(null);
      
      // Generate invite code if not provided
      const inviteCode = quiniela.invite_code || 
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('quinielas')
        .insert({
          ...quiniela,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      const { error: ownerError } = await supabase
        .from('quiniela_players')
        .insert({
          quiniela_id: data.id,
          user_id: quiniela.created_by,
          role: 'owner',
        });

      if (ownerError) throw ownerError;

      // Update local state
      setQuinielas(prev => [
        ...prev, 
        { 
          ...data, 
          quiniela_players: [{ 
            id: '', 
            quiniela_id: data.id, 
            user_id: quiniela.created_by, 
            role: 'owner', 
            joined_at: new Date().toISOString() 
          }],
          player_count: 1,
          match_count: 0,
        }
      ]);

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating quiniela';
      setError(message);
      return { data: null, error: message };
    }
  }

  async function joinQuiniela(inviteCode: string, userId: string): Promise<JoinQuinielaResult> {
    try {
      setError(null);

      // Find quiniela by invite code
      const { data: quiniela, error: findError } = await supabase
        .from('quinielas')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (findError || !quiniela) {
        throw new Error('Código de invitación inválido');
      }

      // Check if user is already a player
      const { data: existingPlayer } = await supabase
        .from('quiniela_players')
        .select('id')
        .eq('quiniela_id', quiniela.id)
        .eq('user_id', userId)
        .single();

      if (existingPlayer) {
        throw new Error('Ya eres miembro de esta quiniela');
      }

      // Check player limit
      const { count } = await supabase
        .from('quiniela_players')
        .select('id', { count: 'exact', head: true })
        .eq('quiniela_id', quiniela.id);

      if (count && count >= quiniela.max_players) {
        throw new Error('Esta quiniela está llena');
      }

      // Join quiniela
      const { error: joinError } = await supabase
        .from('quiniela_players')
        .insert({
          quiniela_id: quiniela.id,
          user_id: userId,
          role: 'player',
        });

      if (joinError) throw joinError;

      // Update local state
      setQuinielas(prev => [
        ...prev,
        {
          ...quiniela,
          quiniela_players: [{
            id: '',
            quiniela_id: quiniela.id,
            user_id: userId,
            role: 'player',
            joined_at: new Date().toISOString(),
          }],
          player_count: (count || 0) + 1,
          match_count: 0,
        }
      ]);

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error joining quiniela';
      setError(message);
      return { error: message };
    }
  }

  async function leaveQuiniela(quinielaId: string, userId: string) {
    try {
      setError(null);

      const { error } = await supabase
        .from('quiniela_players')
        .delete()
        .eq('quiniela_id', quinielaId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setQuinielas(prev => prev.filter(q => q.id !== quinielaId));

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error leaving quiniela';
      setError(message);
      return { error: message };
    }
  }

  async function deleteQuiniela(quinielaId: string) {
    try {
      setError(null);

      const { error } = await supabase
        .from('quinielas')
        .delete()
        .eq('id', quinielaId);

      if (error) throw error;

      // Update local state
      setQuinielas(prev => prev.filter(q => q.id !== quinielaId));

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting quiniela';
      setError(message);
      return { error: message };
    }
  }

  const getQuinielaById = useCallback((id: string) => {
    return quinielas.find(q => q.id === id);
  }, [quinielas]);

  const isPlayer = useCallback(async (quinielaId: string, userId: string) => {
    const { data } = await supabase
      .from('quiniela_players')
      .select('id')
      .eq('quiniela_id', quinielaId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }, []);

  return {
    quinielas,
    loading,
    error,
    fetchQuinielas,
    createQuiniela,
    joinQuiniela,
    leaveQuiniela,
    deleteQuiniela,
    getQuinielaById,
    isPlayer,
  };
}
