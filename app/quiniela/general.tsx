import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { usePredictions } from '../../hooks/usePredictions';
import { Card, Button, Badge, Loading, EmptyState, Input } from '../../components/ui';
import { PrelistaSection } from '../../components/quiniela/PrelistaSection';
import { matchService } from '../../services/match.service';
import { predictionService } from '../../services/prediction.service';

// General Quiniela ID (hardcoded for now)
const GENERAL_QUINIELA_ID = '770e8400-e29b-41d4-a716-446655440001';

interface MatchWithPrediction {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  prediction?: {
    home_score_prediction: number;
    away_score_prediction: number;
  };
}

export default function QuinielaGeneralScreen() {
  const { user } = useAuthStore();
  const { predictions, loading: predictionsLoading, savePrediction } = usePredictions(
    GENERAL_QUINIELA_ID,
    user?.id || ''
  );
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    loadMatches();
  }, [predictions]);

  const loadMatches = async () => {
    setLoading(true);
    
    // Auto-sync: verificar si necesitamos sincronizar partidos
    // Si el sync falla (ej: API bloqueada), continuamos con datos existentes
    try {
      await matchService.checkAndSyncIfNeeded();
    } catch (syncError) {
      console.warn('Auto-sync failed, using existing data:', syncError);
    }
    
    const weeklyMatches = await matchService.getWeekly();
    
    // Merge predictions with matches
    const matchesWithPredictions = weeklyMatches.map((match) => {
      const prediction = predictions.find((p) => p.match_id === match.id);
      return {
        ...match,
        prediction: prediction ? {
          home_score_prediction: prediction.home_score_prediction,
          away_score_prediction: prediction.away_score_prediction,
        } : undefined,
      };
    });
    
    setMatches(matchesWithPredictions);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handlePredictionChange = (matchId: string, field: 'home' | 'away', value: string) => {
    const numValue = parseInt(value) || 0;
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        
        const prediction = m.prediction || { home_score_prediction: 0, away_score_prediction: 0 };
        return {
          ...m,
          prediction: {
            ...prediction,
            [field === 'home' ? 'home_score_prediction' : 'away_score_prediction']: numValue,
          },
        };
      })
    );
  };

  const handleSavePredictions = async () => {
    if (!user) return;

    setSaving(true);
    try {
      for (const match of matches) {
        if (match.prediction && match.status === 'scheduled') {
          await savePrediction(
            match.id,
            match.prediction.home_score_prediction,
            match.prediction.away_score_prediction
          );
        }
      }
      setFeedbackMessage('Pronósticos guardados correctamente');
      setFeedbackType('success');
      setTimeout(() => { setFeedbackMessage(''); setFeedbackType(''); }, 3000);
    } catch (error) {
      setFeedbackMessage('No se pudieron guardar los pronósticos');
      setFeedbackType('error');
      setTimeout(() => { setFeedbackMessage(''); setFeedbackType(''); }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const canSave = matches.some(
    (m) => m.prediction && m.status === 'scheduled'
  );

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando partidos..." />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Feedback */}
        {feedbackMessage ? (
          <View className={`rounded-lg p-3 mb-4 ${feedbackType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <Text className={`text-sm text-center ${feedbackType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {feedbackMessage}
            </Text>
          </View>
        ) : null}

        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Quiniela General
              </Text>
              <Text className="text-gray-500">
                Semana del {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <Badge label="10 partidos" variant="primary" />
          </View>
        </Card>

        {/* Pre-lista: Partidos destacados de la semana */}
        <PrelistaSection
          title="🎯 Partidos Destacados"
          subtitle="Los más relevantes para predecir"
          onMatchPress={(matchId) => {
            // Auto-seleccionar partido para la quiniela
            Alert.alert(
              'Agregar partido',
              '¿Deseas agregar este partido a tu pronóstico?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Agregar', onPress: () => console.log('Add match:', matchId) },
              ]
            );
          }}
        />

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="px-3 text-sm text-gray-500">Todos los partidos</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Matches List */}
        {matches.length > 0 ? (
          <>
            {matches.map((match) => {
              const isFinished = match.status === 'finished';
              const isLive = match.status === 'live';
              const isScheduled = match.status === 'scheduled';
              const isPast = isFinished || isLive;

              return (
                <Card key={match.id} className="mb-3">
                  {/* Match Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs text-gray-500">
                      {match.league || 'Fútbol'}
                    </Text>
                    <Badge
                      label={isFinished ? 'Finalizado' : isLive ? 'En Vivo' : 'Programado'}
                      variant={isFinished ? 'default' : isLive ? 'error' : 'success'}
                    />
                  </View>

                  {/* Teams */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1 items-center">
                      <Text className="font-semibold text-gray-900 text-center">
                        {match.home_team}
                      </Text>
                      {isFinished && (
                        <Text className="text-2xl font-bold text-primary-600 mt-1">
                          {match.home_score}
                        </Text>
                      )}
                    </View>
                    
                    <View className="px-4">
                      <Text className="text-gray-400 font-bold">VS</Text>
                    </View>
                    
                    <View className="flex-1 items-center">
                      <Text className="font-semibold text-gray-900 text-center">
                        {match.away_team}
                      </Text>
                      {isFinished && (
                        <Text className="text-2xl font-bold text-primary-600 mt-1">
                          {match.away_score}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Prediction Input */}
                  {isScheduled && (
                    <View className="flex-row items-center justify-center pt-3 border-t border-gray-100">
                      <View className="flex-1 items-center">
                        <Text className="text-xs text-gray-500 mb-1">Local</Text>
                        <Input
                          value={match.prediction?.home_score_prediction?.toString() || '0'}
                          onChangeText={(v) => handlePredictionChange(match.id, 'home', v)}
                          type="number"
                        />
                      </View>
                      
                      <View className="px-4">
                        <Text className="text-gray-400 font-bold">-</Text>
                      </View>
                      
                      <View className="flex-1 items-center">
                        <Text className="text-xs text-gray-500 mb-1">Visitante</Text>
                        <Input
                          value={match.prediction?.away_score_prediction?.toString() || '0'}
                          onChangeText={(v) => handlePredictionChange(match.id, 'away', v)}
                          type="number"
                        />
                      </View>
                    </View>
                  )}

                  {/* Show prediction if finished */}
                  {isFinished && match.prediction && (
                    <View className="pt-3 border-t border-gray-100">
                      <Text className="text-xs text-gray-500 text-center">
                        Tu pronóstico: {match.prediction.home_score_prediction} - {match.prediction.away_score_prediction}
                      </Text>
                    </View>
                  )}
                </Card>
              );
            })}

            {/* Save Button */}
            {canSave && (
              <Button
                title="Guardar Pronósticos"
                onPress={handleSavePredictions}
                loading={saving}
                fullWidth
                icon={<Text>💾</Text>}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="⚽"
            title="No hay partidos"
            description="Aún no se han programado partidos para esta semana"
          />
        )}
      </View>
    </ScrollView>
  );
}
