import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Badge, Button, Loading, EmptyState } from '../../components/ui';

type FilterType = 'all' | 'public' | 'private';

export default function QuinielasScreen() {
  const { user } = useAuthStore();
  const { quinielas, loading, fetchQuinielas } = useQuinielas();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuinielas(user.id);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await fetchQuinielas(user.id);
    }
    setRefreshing(false);
  };

  const filteredQuinielas = quinielas.filter((q) => {
    if (filter === 'public') return !q.is_private;
    if (filter === 'private') return q.is_private;
    return true;
  });

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando quinielas..." />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Filter Tabs */}
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              filter === 'all' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setFilter('all')}
          >
            <Text className={`text-center font-medium ${
              filter === 'all' ? 'text-primary-600' : 'text-gray-500'
            }`}>
              Todas ({quinielas.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              filter === 'public' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setFilter('public')}
          >
            <Text className={`text-center font-medium ${
              filter === 'public' ? 'text-primary-600' : 'text-gray-500'
            }`}>
              Públicas ({quinielas.filter(q => !q.is_private).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              filter === 'private' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setFilter('private')}
          >
            <Text className={`text-center font-medium ${
              filter === 'private' ? 'text-primary-600' : 'text-gray-500'
            }`}>
              Privadas ({quinielas.filter(q => q.is_private).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-4">
          <Button
            title="Crear Quiniela"
            onPress={() => router.push('/quiniela/create')}
            variant="primary"
            icon={<Text>➕</Text>}
          />
          <Button
            title="Unirse con Código"
            onPress={() => router.push('/quiniela/join')}
            variant="outline"
            icon={<Text>🔗</Text>}
          />
        </View>

        {/* Quinielas List */}
        {filteredQuinielas.length > 0 ? (
          filteredQuinielas.map((quiniela) => (
            <TouchableOpacity
              key={quiniela.id}
              onPress={() => router.push(`/quiniela/${quiniela.id}`)}
            >
              <Card className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">
                      {quiniela.is_private ? '🔒' : '🌍'}
                    </Text>
                    <View>
                      <Text className="font-semibold text-gray-900 text-lg">
                        {quiniela.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {quiniela.description || 'Sin descripción'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500 mr-4">
                      👥 {quiniela.player_count || 0}/{quiniela.max_players} jugadores
                    </Text>
                    <Text className="text-sm text-gray-500">
                      ⚽ {quiniela.match_count || 0} partidos
                    </Text>
                  </View>
                  
                  <Badge 
                    label={quiniela.is_private ? 'Privada' : 'Pública'} 
                    variant={quiniela.is_private ? 'primary' : 'success'} 
                  />
                </View>

                {quiniela.invite_code && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-xs text-gray-400">
                      Código: <Text className="font-mono text-gray-600">{quiniela.invite_code}</Text>
                    </Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="📭"
            title="No hay quinielas"
            description={
              filter === 'all'
                ? 'Crea una quiniela o únete con un código para empezar'
                : filter === 'public'
                ? 'No hay quinielas públicas disponibles'
                : 'No tienes quinielas privadas aún'
            }
            action={
              <Button
                title="Crear Quiniela"
                onPress={() => router.push('/quiniela/create')}
              />
            }
          />
        )}
      </View>
    </ScrollView>
  );
}
