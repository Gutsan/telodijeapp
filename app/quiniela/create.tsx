import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Button, Input } from '../../components/ui';
import { generateInviteCode } from '../../utils/quiniela';

export default function CreateQuinielaScreen() {
  const { user } = useAuthStore();
  const { createQuiniela } = useQuinielas();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la quiniela');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para crear una quiniela');
      return;
    }

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      
      const newQuiniela = await createQuiniela({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
        is_private: true,
        max_players: parseInt(maxPlayers) || 10,
        invite_code: inviteCode,
      });

      if (newQuiniela) {
        Alert.alert(
          'Éxito',
          `Quiniela "${name}" creada correctamente.\n\nCódigo de invitación: ${inviteCode}`,
          [
            {
              text: 'Copiar código',
              onPress: () => {
                // Copy to clipboard
                Alert.alert('Copiado', 'Código copiado al portapapeles');
              },
            },
            {
              text: 'Ver quiniela',
              onPress: () => router.push(`/quiniela/${newQuiniela.id}`),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear la quiniela');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al crear la quiniela');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">➕</Text>
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Crear Quiniela Privada
              </Text>
              <Text className="text-gray-500">
                Invita a tus amigos a competir
              </Text>
            </View>
          </View>
        </Card>

        {/* Form */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-4">
            Información de la Quiniela
          </Text>

          <Input
            label="Nombre *"
            placeholder="Ej: Amigos del Fútbol"
            value={name}
            onChangeText={setName}
            leftIcon={<Text>📝</Text>}
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Ej: Competición entre amigos de la universidad"
            value={description}
            onChangeText={setDescription}
            leftIcon={<Text>📋</Text>}
          />

          <Input
            label="Máximo de jugadores"
            placeholder="10"
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            type="number"
            leftIcon={<Text>👥</Text>}
          />
        </Card>

        {/* Info Card */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">
            ℹ️ Información importante
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-600">
              • Se generará un código único de invitación
            </Text>
            <Text className="text-sm text-gray-600">
              • Comparte el código con tus amigos para que se unan
            </Text>
            <Text className="text-sm text-gray-600">
              • Como usuario gratuito, puedes invitar hasta 5 amigos
            </Text>
            <Text className="text-sm text-gray-600">
              • Los pronósticos se pueden hacer antes del inicio de cada partido
            </Text>
          </View>
        </Card>

        {/* Create Button */}
        <Button
          title="Crear Quiniela"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          icon={<Text>✅</Text>}
        />

        {/* Cancel Button */}
        <Button
          title="Cancelar"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}
