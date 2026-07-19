import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Badge, Avatar, Loading, EmptyState } from '../../components/ui';
import { matchService } from '../../services/match.service';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();
  const { quinielas, loading: quinielasLoading, fetchQuinielas } = useQuinielas();
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (user) {
      await fetchQuinielas(user.id);
      const matches = await matchService.getUpcoming(5);
      setUpcomingMatches(matches);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (quinielasLoading && !refreshing) {
    return <Loading fullScreen text="Cargando..." />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Welcome Section */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Avatar name={user?.full_name || ''} size="lg" />
            <View className="ml-4 flex-1">
              <Text className="text-gray-500">Bienvenido</Text>
              <Text className="text-xl font-bold text-gray-900">
                {user?.full_name || 'Usuario'}
              </Text>
            </View>
            <Badge 
              label={user?.plan_type === 'premium' ? 'Premium' : 'Free'} 
              variant={user?.plan_type === 'premium' ? 'success' : 'default'} 
            />
          </View>
        </Card>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Acciones Rápidas
        </Text>
        
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity 
            className="flex-1 mr-2"
            onPress={() => router.push('/quiniela/general')}
          >
            <Card>
              <View className="items-center py-3">
                <Text className="text-3xl mb-2">⚽</Text>
                <Text className="text-sm font-medium text-gray-700">Apuesta General</Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 ml-2"
            onPress={() => router.push('/quiniela/create')}
          >
            <Card>
              <View className="items-center py-3">
                <Text className="text-3xl mb-2">➕</Text>
                <Text className="text-sm font-medium text-gray-700">Crear Privada</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-6">
          <TouchableOpacity 
            className="flex-1 mr-2"
            onPress={() => router.push('/quiniela/join')}
          >
            <Card>
              <View className="items-center py-3">
                <Text className="text-3xl mb-2">🔗</Text>
                <Text className="text-sm font-medium text-gray-700">Unirse con Código</Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 ml-2"
            onPress={() => router.push('/(tabs)/rankings')}
          >
            <Card>
              <View className="items-center py-3">
                <Text className="text-3xl mb-2">🏆</Text>
                <Text className="text-sm font-medium text-gray-700">Ver Rankings</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Upcoming Matches */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Próximos Partidos
        </Text>
        
        {upcomingMatches.length > 0 ? (
          upcomingMatches.slice(0, 3).map((match) => (
            <Card key={match.id} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">
                    {match.league || 'Fútbol'}
                  </Text>
                  <Text className="font-semibold text-gray-900">
                    {match.home_team} vs {match.away_team}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {new Date(match.match_date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Badge label="Programado" variant="default" />
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <Text className="text-center text-gray-500 py-4">
              No hay partidos programados
            </Text>
          </Card>
        )}

        {/* Active Quinielas */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-900">
            Mis Apuestas
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/quinielas')}>
            <Text className="text-primary-500 font-medium">Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        {quinielas.length > 0 ? (
          quinielas.slice(0, 3).map((quiniela) => (
            <TouchableOpacity
              key={quiniela.id}
              onPress={() => router.push(`/quiniela/${quiniela.id}`)}
            >
              <Card className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">
                      {quiniela.is_private ? '🔒' : '🌍'}
                    </Text>
                    <View>
                      <Text className="font-semibold text-gray-900">
                        {quiniela.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {quiniela.player_count || 0} participantes
                      </Text>
                    </View>
                  </View>
                  <Badge 
                    label={quiniela.is_private ? 'Privada' : 'Pública'} 
                    variant={quiniela.is_private ? 'primary' : 'success'} 
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="📭"
            title="Sin apuestas"
            description="Únete a una apuesta o crea una nueva para empezar a competir"
          />
        )}

        {/* Sign Out Button */}
        <TouchableOpacity 
          className="mt-6 mb-8"
          onPress={handleSignOut}
        >
          <Card>
            <View className="flex-row items-center justify-center">
              <Text className="text-red-500 font-medium">Cerrar Sesión</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
