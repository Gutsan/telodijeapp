import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Button, Input } from '../../components/ui';
import { validateInviteCode } from '../../utils/quiniela';

export default function JoinQuinielaScreen() {
  const { user } = useAuthStore();
  const { joinQuiniela } = useQuinielas();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código de invitación');
      return;
    }

    if (!validateInviteCode(inviteCode.trim())) {
      Alert.alert('Error', 'El código debe tener 6 caracteres (letras y números)');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para unirte a una quiniela');
      return;
    }

    setLoading(true);
    try {
      const { error } = await joinQuiniela(inviteCode.trim().toUpperCase(), user.id);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Éxito',
        'Te has unido a la quiniela correctamente',
        [
          {
            text: 'Ver quiniela',
            onPress: () => router.push('/(tabs)/quinielas'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al unirse a la quiniela');
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
            <Text className="text-3xl mr-3">🔗</Text>
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Unirse con Código
              </Text>
              <Text className="text-gray-500">
                Ingresa el código de invitación
              </Text>
            </View>
          </View>
        </Card>

        {/* Form */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-4">
            Código de Invitación
          </Text>

          <Input
            placeholder="Ej: ABC123"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            type="text"
            leftIcon={<Text>🔑</Text>}
          />

          <Text className="text-sm text-gray-500 mt-2">
            El código tiene 6 caracteres (letras y números)
          </Text>
        </Card>

        {/* Info Card */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">
            ℹ️ ¿Cómo obtener un código?
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-600">
              • Pide el código al creador de la quiniela
            </Text>
            <Text className="text-sm text-gray-600">
              • El código se comparte por WhatsApp, mensaje, etc.
          </Text>
            <Text className="text-sm text-gray-600">
              • También puedes usar un enlace de invitación
            </Text>
          </View>
        </Card>

        {/* Join Button */}
        <Button
          title="Unirse a la Quiniela"
          onPress={handleJoin}
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
