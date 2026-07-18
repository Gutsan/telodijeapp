import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, Badge } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();

  // Check if user is admin
  if (user?.plan_type !== 'premium') {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-6xl mb-4">🔒</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Acceso Restringido
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Solo los administradores pueden acceder a esta sección
        </Text>
        <Button
          title="Volver al Inicio"
          onPress={() => router.push('/(tabs)')}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Panel de Administración
              </Text>
              <Text className="text-gray-500">
                Gestiona partidos y marcadores
              </Text>
            </View>
            <Badge label="Admin" variant="primary" />
          </View>
        </Card>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Gestión
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/admin/matches')}
        >
          <Card className="mb-3">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">⚽</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">
                  Gestionar Partidos
                </Text>
                <Text className="text-sm text-gray-500">
                  Crear, editar y actualizar marcadores
                </Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/admin/users')}
        >
          <Card className="mb-3">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">👥</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">
                  Gestionar Usuarios
                </Text>
                <Text className="text-sm text-gray-500">
                  Ver y administrar usuarios registrados
                </Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/admin/quinielas')}
        >
          <Card className="mb-3">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">🏆</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">
                  Gestionar Quinielas
                </Text>
                <Text className="text-sm text-gray-500">
                  Ver y administrar quinielas activas
                </Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Stats */}
        <Text className="text-lg font-semibold text-gray-900 mb-3 mt-4">
          Estadísticas Rápidas
        </Text>

        <View className="flex-row justify-between mb-4">
          <Card className="flex-1 mr-2">
            <View className="items-center py-2">
              <Text className="text-2xl font-bold text-primary-600">--</Text>
              <Text className="text-xs text-gray-500">Usuarios</Text>
            </View>
          </Card>
          <Card className="flex-1 mx-2">
            <View className="items-center py-2">
              <Text className="text-2xl font-bold text-secondary-600">--</Text>
              <Text className="text-xs text-gray-500">Quinielas</Text>
            </View>
          </Card>
          <Card className="flex-1 ml-2">
            <View className="items-center py-2">
              <Text className="text-2xl font-bold text-accent-600">--</Text>
              <Text className="text-xs text-gray-500">Partidos</Text>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
