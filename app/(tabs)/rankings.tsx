import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useRankings } from '../../hooks/useRankings';
import { Card, Badge, Loading, EmptyState } from '../../components/ui';
import { quinielaService } from '../../services/quiniela.service';

// General Quiniela ID (hardcoded for now)
const GENERAL_QUINIELA_ID = '770e8400-e29b-41d4-a716-446655440001';

export default function RankingsScreen() {
  const { user } = useAuthStore();
  const { rankings, loading, refreshRankings } = useRankings(GENERAL_QUINIELA_ID);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuiniela, setSelectedQuiniela] = useState(GENERAL_QUINIELA_ID);

  useEffect(() => {
    loadRankings();
  }, [selectedQuiniela]);

  const loadRankings = async () => {
    await refreshRankings();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRankings();
    setRefreshing(false);
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return { label: '🥇 1°', variant: 'success' as const };
    if (position === 2) return { label: '🥈 2°', variant: 'primary' as const };
    if (position === 3) return { label: '🥉 3°', variant: 'secondary' as const };
    return { label: `${position}°`, variant: 'default' as const };
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando rankings..." />;
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
                Clasificación
              </Text>
              <Text className="text-gray-500">
                Quiniela General - Semana actual
              </Text>
            </View>
            <Badge label={`${rankings.length} jugadores`} variant="primary" />
          </View>
        </Card>

        {/* Podium (Top 3) */}
        {rankings.length >= 3 && (
          <Card className="mb-4">
            <Text className="font-semibold text-gray-900 mb-4 text-center">
              🏆 Podio
            </Text>
            <View className="flex-row justify-center items-end">
              {/* 2nd Place */}
              <View className="items-center mx-2">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-2xl">🥈</Text>
                </View>
                <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
                  {rankings[1]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-sm text-gray-500">
                  {rankings[1]?.total_points || 0} pts
                </Text>
              </View>
              
              {/* 1st Place */}
              <View className="items-center mx-2">
                <View className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-3xl">🥇</Text>
                </View>
                <Text className="font-bold text-gray-900 text-center" numberOfLines={1}>
                  {rankings[0]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-sm text-primary-600 font-semibold">
                  {rankings[0]?.total_points || 0} pts
                </Text>
              </View>
              
              {/* 3rd Place */}
              <View className="items-center mx-2">
                <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-2xl">🥉</Text>
                </View>
                <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
                  {rankings[2]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-sm text-gray-500">
                  {rankings[2]?.total_points || 0} pts
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Full Ranking */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Clasificación Completa
        </Text>

        {rankings.length > 0 ? (
          rankings.map((ranking, index) => {
            const positionBadge = getPositionBadge(ranking.position || index + 1);
            const isCurrentUser = ranking.user_id === user?.id;

            return (
              <Card 
                key={ranking.id} 
                className={`mb-2 ${isCurrentUser ? 'border-2 border-primary-500' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                      <Text className="font-bold text-gray-700">
                        {ranking.position || index + 1}
                      </Text>
                    </View>
                    <View>
                      <Text className={`font-semibold ${isCurrentUser ? 'text-primary-600' : 'text-gray-900'}`}>
                        {ranking.user?.full_name || 'Jugador'}
                        {isCurrentUser && ' (Tú)'}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {ranking.exact_predictions} exactos · {ranking.correct_predictions} tendencia
                      </Text>
                    </View>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-lg font-bold text-primary-600">
                      {ranking.total_points}
                    </Text>
                    <Text className="text-xs text-gray-500">puntos</Text>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon="🏆"
            title="Sin clasificación"
            description="Aún no hay resultados para mostrar"
          />
        )}

        {/* Stats Summary */}
        {rankings.length > 0 && (
          <Card className="mt-4">
            <Text className="font-semibold text-gray-900 mb-3">
              📊 Estadísticas
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary-600">
                  {rankings.reduce((sum, r) => sum + r.total_points, 0)}
                </Text>
                <Text className="text-xs text-gray-500">Puntos totales</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-secondary-600">
                  {rankings.reduce((sum, r) => sum + r.exact_predictions, 0)}
                </Text>
                <Text className="text-xs text-gray-500">Aciertos exactos</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-accent-600">
                  {rankings.reduce((sum, r) => sum + r.correct_predictions, 0)}
                </Text>
                <Text className="text-xs text-gray-500">Aciertos tendencia</Text>
              </View>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
