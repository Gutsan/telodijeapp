import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Prediction, PredictionWithMatch } from '../types';

interface SaveResult {
  success: boolean;
  message: string;
}

export function usePredictions(quinielaId: string, userId: string) {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchPredictions() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          match:matches(home_team, away_team, match_date, status, home_score, away_score)
        `)
        .eq('quiniela_id', quinielaId)
        .eq('user_id', userId);

      if (error) throw error;
      setPredictions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching predictions');
    } finally {
      setLoading(false);
    }
  }

  async function savePrediction(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<SaveResult> {
    try {
      setSaving(true);
      setError(null);

      // Validate scores
      if (homeScore < 0 || awayScore < 0) {
        return { success: false, message: 'Los goles no pueden ser negativos' };
      }

      if (homeScore > 99 || awayScore > 99) {
        return { success: false, message: 'Los goles no pueden ser mayor a 99' };
      }

      // Check if match is still available for prediction
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('status, match_date')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return { success: false, message: 'Partido no encontrado' };
      }

      if (match.status !== 'scheduled') {
        return { success: false, message: 'Este partido ya comenzó o finalizó' };
      }

      // Check deadline (5 minutes before)
      const matchTime = new Date(match.match_date).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (matchTime - now <= fiveMinutes) {
        return { success: false, message: 'Las predicciones se cerraron 5 minutos antes del partido' };
      }

      // Check if prediction already exists
      const existing = predictions.find(p => p.match_id === matchId);
      
      if (existing) {
        // Update existing prediction
        const { data, error } = await supabase
          .from('predictions')
          .update({
            home_score_prediction: homeScore,
            away_score_prediction: awayScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        
        setPredictions(prev =>
          prev.map(p => (p.id === data.id ? { ...p, ...data } : p))
        );
        
        return { success: true, message: 'Pronóstico actualizado correctamente' };
      } else {
        // Create new prediction
        const { data, error } = await supabase
          .from('predictions')
          .insert({
            user_id: userId,
            quiniela_id: quinielaId,
            match_id: matchId,
            home_score_prediction: homeScore,
            away_score_prediction: awayScore,
          })
          .select()
          .single();

        if (error) throw error;
        
        setPredictions(prev => [...prev, { ...data, match: null } as PredictionWithMatch]);
        
        return { success: true, message: 'Pronóstico guardado correctamente' };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar pronóstico';
      setError(message);
      return { success: false, message };
    } finally {
      setSaving(false);
    }
  }

  async function saveAllPredictions(
    matchPredictions: Array<{ matchId: string; homeScore: number; awayScore: number }>
  ): Promise<SaveResult> {
    try {
      setSaving(true);
      setError(null);

      let savedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const prediction of matchPredictions) {
        const result = await savePrediction(
          prediction.matchId,
          prediction.homeScore,
          prediction.awayScore
        );

        if (result.success) {
          if (result.message.includes('actualizado')) {
            updatedCount++;
          } else {
            savedCount++;
          }
        } else {
          errorCount++;
        }
      }

      const totalSaved = savedCount + updatedCount;
      let message = '';
      
      if (savedCount > 0) {
        message += `${savedCount} pronósticos guardados`;
      }
      if (updatedCount > 0) {
        message += `${message ? ', ' : ''}${updatedCount} pronósticos actualizados`;
      }
      if (errorCount > 0) {
        message += `${message ? '. ' : ''}${errorCount} errores`;
      }

      return { 
        success: errorCount === 0, 
        message: message || 'No hay pronósticos para guardar'
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar pronósticos';
      setError(message);
      return { success: false, message };
    } finally {
      setSaving(false);
    }
  }

  const getPredictionForMatch = useCallback((matchId: string) => {
    return predictions.find(p => p.match_id === matchId);
  }, [predictions]);

  const hasChanges = useCallback((matchPredictions: Record<string, { home: number; away: number }>) => {
    return Object.entries(matchPredictions).some(([matchId, scores]) => {
      const existing = getPredictionForMatch(matchId);
      if (!existing) return true;
      return existing.home_score_prediction !== scores.home || 
             existing.away_score_prediction !== scores.away;
    });
  }, [getPredictionForMatch]);

  useEffect(() => {
    if (quinielaId && userId) {
      fetchPredictions();
    }
  }, [quinielaId, userId]);

  return {
    predictions,
    loading,
    error,
    saving,
    savePrediction,
    saveAllPredictions,
    getPredictionForMatch,
    hasChanges,
    refreshPredictions: fetchPredictions,
  };
}
