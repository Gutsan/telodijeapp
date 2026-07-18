import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Card, Button, Input, Avatar, Badge, Modal } from '../../components/ui';
import { userService } from '../../services/user.service';

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile(user.id, {
        full_name: fullName.trim(),
      });

      if (updated) {
        await refreshUser();
        setIsEditing(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Profile Header */}
        <Card className="mb-4">
          <View className="items-center">
            <Avatar name={user.full_name || ''} size="xl" />
            <Text className="text-xl font-bold text-gray-900 mt-4">
              {user.full_name}
            </Text>
            <Text className="text-gray-500">{user.email}</Text>
            <View className="mt-2">
              <Badge
                label={user.plan_type === 'premium' ? 'Premium' : 'Free'}
                variant={user.plan_type === 'premium' ? 'success' : 'default'}
              />
            </View>
          </View>
        </Card>

        {/* Edit Profile */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-semibold text-gray-900">
              Información Personal
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text className="text-primary-500 font-medium">
                {isEditing ? 'Cancelar' : 'Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <Input
                label="Nombre completo"
                value={fullName}
                onChangeText={setFullName}
                leftIcon={<Text>👤</Text>}
              />
              <Button
                title="Guardar cambios"
                onPress={handleSave}
                loading={loading}
                fullWidth
              />
            </>
          ) : (
            <View className="space-y-3">
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">Nombre</Text>
                <Text className="font-medium text-gray-900">
                  {user.full_name || 'No especificado'}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">Email</Text>
                <Text className="font-medium text-gray-900">{user.email}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">Proveedor</Text>
                <Text className="font-medium text-gray-900 capitalize">
                  {user.provider || 'Email'}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-500">Membresía</Text>
                <Text className="font-medium text-gray-900 capitalize">
                  {user.plan_type}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Stats */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">
            📊 Estadísticas
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary-600">0</Text>
              <Text className="text-xs text-gray-500">Quinielas</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-secondary-600">0</Text>
              <Text className="text-xs text-gray-500">Pronósticos</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-accent-600">0</Text>
              <Text className="text-xs text-gray-500">Puntos</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">
            ⚙️ Configuración
          </Text>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-700">Notificaciones</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-700">Privacidad</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-700">Ayuda</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <Text className="text-gray-700">Acerca de</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </Card>

        {/* Upgrade to Premium */}
        {user.plan_type === 'free' && (
          <Card className="mb-4">
            <View className="items-center">
              <Text className="text-3xl mb-2">⭐</Text>
              <Text className="font-semibold text-gray-900 mb-2">
                Upgrade a Premium
              </Text>
              <Text className="text-gray-500 text-center mb-4">
                Desbloquea funciones ilimitadas y elimina anuncios
              </Text>
              <Button
                title="Upgrade ahora"
                onPress={() => {}}
                variant="primary"
              />
            </View>
          </Card>
        )}

        {/* Sign Out */}
        <Button
          title="Cerrar Sesión"
          onPress={handleSignOut}
          variant="outline"
          fullWidth
        />

        {/* App Version */}
        <Text className="text-center text-gray-400 text-sm mt-4 mb-8">
          Telodije v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
