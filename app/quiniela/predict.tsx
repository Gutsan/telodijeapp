import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { usePredictions } from '../../hooks/usePredictions';
import { CardPartido } from '../../components/quiniela/CardPartido';
import { Card, Button, Badge, Loading, EmptyState } from '../../components/ui';
import { matchService } from '../../services/match.service';
import { quinielaService } from '../../services/quiniela.service';

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

export default function PredictionsScreen() {
  const { id: quinielaId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { predictions, loading: predictionsLoading, savePrediction } = usePredictions(
    quinielaId || '',
    user?.id || ''
  );
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [quiniela, setQuiniela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quinielaId) {
      loadData();
    }
  }, [quinielaId, predictions]);

  const loadData = async () => {
    if (!quinielaId) return;

    setLoading(true);
    
    // Load quiniela
    const quinielaData = await quinielaService.getById(quinielaId);
    setQuiniela(quinielaData);

    // Load matches for this quiniela
    const matchesData = await matchService.getByQuiniela(quinielaId);
    
    // Merge predictions with matches
    const matchesWithPredictions = matchesData.map((match) => {
      const prediction = predictions.find((p) => p.match_id === match.id);
      return {
        ...match,
        prediction: prediction
          ? {
              home_score_prediction: prediction.home_score_prediction,
              away_score_prediction: prediction.away_score_prediction,
            }
          : undefined,
      };
    });
    
    setMatches(matchesWithPredictions);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
    if (!user || !quinielaId) return;

    setSaving(true);
    try {
      let savedCount = 0;
      for (const match of matches) {
        if (match.prediction && match.status === 'scheduled') {
          await savePrediction(
            match.id,
            match.prediction.home_score_prediction,
            match.prediction.away_score_prediction
          );
          savedCount++;
        }
      }
      
      if (savedCount > 0) {
        Alert.alert('Éxito', `${savedCount} pronósticos guardados correctamente`);
      } else {
        Alert.alert('Info', 'No hay pronósticos nuevos para guardar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los pronósticos');
    } finally {
      setSaving(false);
    }
  };

  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');
  const finishedMatches = matches.filter((m) => m.status === 'finished');
  const liveMatches = matches.filter((m) => m.status === 'live');

  const canSave = scheduledMatches.some((m) => m.prediction);

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando pronósticos..." />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">
                {quiniela?.name || 'Pronósticos'}
              </Text>
              <Text className="text-gray-500">
                {matches.length} partidos · {predictions.length} pronósticos
              </Text>
            </View>
            <Badge label={`${scheduledMatches.length} pendientes`} variant="warning" />
          </View>
        </Card>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              🔴 En Vivo
            </Text>
            {liveMatches.map((match) => (
              <CardPartido
                key={match.id}
                match={match}
                prediction={match.prediction}
                onPredictionChange={handlePredictionChange}
                showInputs={false}
              />
            ))}
          </>
        )}

        {/* Scheduled Matches */}
        {scheduledMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              ⚽ Pronosticar
            </Text>
            {scheduledMatches.map((match) => (
              <CardPartido
                key={match.id}
                match={match}
                prediction={match.prediction}
                onPredictionChange={handlePredictionChange}
                showInputs={true}
              />
            ))}
          </>
        )}

        {/* Finished Matches */}
        {finishedMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              ✅ Finalizados
            </Text>
            {finishedMatches.map((match) => (
              <CardPartido
                key={match.id}
                match={match}
                prediction={match.prediction}
                showInputs={false}
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <EmptyState
            icon="⚽"
            title="No hay partidos"
            description="Aún no se han programado partidos para esta quiniela"
          />
        )}

        {/* Save Button */}
        {canSave && (
          <View className="mt-4 mb-8">
            <Button
              title="Guardar Pronósticos"
              onPress={handleSavePredictions}
              loading={saving}
              fullWidth
              icon={<Text>💾</Text>}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
