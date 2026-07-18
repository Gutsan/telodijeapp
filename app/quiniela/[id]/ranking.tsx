import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { Card, Button, Badge, Loading, EmptyState } from '../../../components/ui';
import { supabase } from '../../../lib/supabase';

export default function QuinielaRankingScreen() {
  const { id: quinielaId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [rankings, setRankings] = useState<any[]>([]);
  const [quiniela, setQuiniela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (quinielaId) loadData();
  }, [quinielaId]);

  const loadData = async () => {
    if (!quinielaId) return;
    setLoading(true);

    const { data: q } = await supabase.from('quinielas').select('name').eq('id', quinielaId).single();
    setQuiniela(q);

    const { data: r } = await supabase
      .from('rankings')
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq('quiniela_id', quinielaId)
      .order('total_points', { ascending: false });

    setRankings(r || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPositionEmoji = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}°`;
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando ranking..." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Back button */}
        <Button title="← Volver" onPress={() => router.back()} variant="ghost" size="sm" />

        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">🏆 Ranking</Text>
              <Text className="text-gray-500">{quiniela?.name || 'Quiniela'}</Text>
            </View>
            <Badge label={`${rankings.length} jugadores`} variant="primary" />
          </View>
        </Card>

        {/* Podium */}
        {rankings.length >= 3 && (
          <Card className="mb-4">
            <Text className="font-semibold text-gray-900 mb-4 text-center">Podio</Text>
            <View className="flex-row justify-center items-end">
              {/* 2nd */}
              <View className="items-center mx-2">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-2xl">🥈</Text>
                </View>
                <Text className="font-semibold text-gray-900 text-center text-xs" numberOfLines={1}>
                  {rankings[1]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-xs text-gray-500">{rankings[1]?.total_points || 0} pts</Text>
              </View>
              {/* 1st */}
              <View className="items-center mx-2">
                <View className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-3xl">🥇</Text>
                </View>
                <Text className="font-bold text-gray-900 text-center text-xs" numberOfLines={1}>
                  {rankings[0]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-xs text-primary-600 font-semibold">{rankings[0]?.total_points || 0} pts</Text>
              </View>
              {/* 3rd */}
              <View className="items-center mx-2">
                <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-2xl">🥉</Text>
                </View>
                <Text className="font-semibold text-gray-900 text-center text-xs" numberOfLines={1}>
                  {rankings[2]?.user?.full_name || 'Jugador'}
                </Text>
                <Text className="text-xs text-gray-500">{rankings[2]?.total_points || 0} pts</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Full Ranking */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">Clasificación Completa</Text>

        {rankings.length > 0 ? (
          rankings.map((ranking, index) => {
            const isCurrentUser = ranking.user_id === user?.id;
            return (
              <Card
                key={ranking.id}
                className={`mb-2 ${isCurrentUser ? 'border-2 border-primary-500' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                      <Text className="font-bold text-gray-700 text-sm">
                        {getPositionEmoji(ranking.position || index + 1)}
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
                    <Text className="text-lg font-bold text-primary-600">{ranking.total_points}</Text>
                    <Text className="text-xs text-gray-500">puntos</Text>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <EmptyState icon="🏆" title="Sin clasificación" description="Aún no hay resultados para mostrar" />
        )}
      </View>
    </ScrollView>
  );
}
