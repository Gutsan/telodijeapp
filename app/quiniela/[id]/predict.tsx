import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { usePredictions } from '../../../hooks/usePredictions';
import { CardPartido } from '../../../components/quiniela/CardPartido';
import { PrelistaSection } from '../../../components/quiniela/PrelistaSection';
import { Card, Button, Badge, Loading, EmptyState } from '../../../components/ui';
import { matchService } from '../../../services/match.service';
import { quinielaService } from '../../../services/quiniela.service';

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
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    if (quinielaId) loadData();
  }, [quinielaId, predictions]);

  const loadData = async () => {
    if (!quinielaId) return;
    setLoading(true);

    const quinielaData = await quinielaService.getById(quinielaId);
    setQuiniela(quinielaData);

    const matchesData = await matchService.getByQuiniela(quinielaId);

    const matchesWithPredictions = matchesData.map((match) => {
      const prediction = predictions.find((p) => p.match_id === match.id);
      return {
        ...match,
        prediction: prediction
          ? { home_score_prediction: prediction.home_score_prediction, away_score_prediction: prediction.away_score_prediction }
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
    setFeedbackMessage('');

    try {
      let savedCount = 0;
      for (const match of matches) {
        if (match.prediction && match.status === 'scheduled') {
          const result = await savePrediction(
            match.id,
            match.prediction.home_score_prediction,
            match.prediction.away_score_prediction
          );
          if (result.success) savedCount++;
        }
      }

      if (savedCount > 0) {
        setFeedbackMessage(`${savedCount} pronósticos guardados correctamente`);
        setFeedbackType('success');
      } else {
        setFeedbackMessage('No hay pronósticos nuevos para guardar');
        setFeedbackType('error');
      }
    } catch (error) {
      setFeedbackMessage('No se pudieron guardar los pronósticos');
      setFeedbackType('error');
    } finally {
      setSaving(false);
      setTimeout(() => { setFeedbackMessage(''); setFeedbackType(''); }, 3000);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Back button */}
        <Button title="← Volver" onPress={() => router.back()} variant="ghost" size="sm" />

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
              <Text className="text-xl font-bold text-gray-900">{quiniela?.name || 'Pronósticos'}</Text>
              <Text className="text-gray-500">{matches.length} partidos · {predictions.length} pronósticos</Text>
            </View>
            <Badge label={`${scheduledMatches.length} pendientes`} variant="warning" />
          </View>
        </Card>

        {/* Pre-lista: Partidos destacados de la semana */}
        <PrelistaSection
          title="🎯 Partidos Destacados de la Semana"
          subtitle="Los más relevantes para predecir"
          onMatchPress={(matchId) => {
            // Opcional: navegar al detalle del partido
            console.log('Match pressed:', matchId);
          }}
        />

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="px-3 text-sm text-gray-500">Tu Quiniela</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">🔴 En Vivo</Text>
            {liveMatches.map((match) => (
              <CardPartido key={match.id} match={match} prediction={match.prediction} onPredictionChange={handlePredictionChange} showInputs={false} />
            ))}
          </>
        )}

        {/* Scheduled Matches */}
        {scheduledMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">⚽ Pronosticar</Text>
            {scheduledMatches.map((match) => (
              <CardPartido key={match.id} match={match} prediction={match.prediction} onPredictionChange={handlePredictionChange} showInputs={true} />
            ))}
          </>
        )}

        {/* Finished Matches */}
        {finishedMatches.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">✅ Finalizados</Text>
            {finishedMatches.map((match) => (
              <CardPartido key={match.id} match={match} prediction={match.prediction} showInputs={false} />
            ))}
          </>
        )}

        {matches.length === 0 && (
          <EmptyState icon="⚽" title="No hay partidos" description="No se han programado partidos para esta quiniela aún" />
        )}

        {canSave && (
          <View className="mt-4 mb-8">
            <Button title="💾 Guardar Pronósticos" onPress={handleSavePredictions} loading={saving} fullWidth />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
