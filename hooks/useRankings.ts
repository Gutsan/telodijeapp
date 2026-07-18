import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RankingWithUser } from '../types';

export function useRankings(quinielaId: string) {
  const [rankings, setRankings] = useState<RankingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRankings() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('rankings')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('quiniela_id', quinielaId)
        .order('total_points', { ascending: false });

      if (error) throw error;
      setRankings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching rankings');
    } finally {
      setLoading(false);
    }
  }

  const getUserPosition = useCallback((userId: string) => {
    const ranking = rankings.find(r => r.user_id === userId);
    return ranking?.position || rankings.findIndex(r => r.user_id === userId) + 1;
  }, [rankings]);

  const getUserStats = useCallback((userId: string) => {
    const ranking = rankings.find(r => r.user_id === userId);
    return ranking ? {
      total_points: ranking.total_points,
      correct_predictions: ranking.correct_predictions,
      exact_predictions: ranking.exact_predictions,
    } : null;
  }, [rankings]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!quinielaId) return;

    const channel = supabase
      .channel('rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rankings',
          filter: `quiniela_id=eq.${quinielaId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRankings(prev => {
              const existing = prev.find(r => r.user_id === payload.new.user_id);
              if (existing) {
                return prev.map(r =>
                  r.user_id === payload.new.user_id ? { ...r, ...payload.new } : r
                );
              }
              return [...prev, payload.new as RankingWithUser];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quinielaId]);

  useEffect(() => {
    if (quinielaId) {
      fetchRankings();
    }
  }, [quinielaId]);

  return {
    rankings,
    loading,
    error,
    getUserPosition,
    getUserStats,
    refreshRankings: fetchRankings,
  };
}
