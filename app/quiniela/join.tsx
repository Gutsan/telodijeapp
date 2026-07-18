import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleJoin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!inviteCode.trim()) {
      setErrorMessage('Por favor ingresa un código de invitación');
      return;
    }

    if (!validateInviteCode(inviteCode.trim())) {
      setErrorMessage('El código debe tener 6 caracteres (letras y números)');
      return;
    }

    if (!user) {
      setErrorMessage('Debes estar autenticado para unirte a una quiniela');
      return;
    }

    setLoading(true);
    try {
      const { error } = await joinQuiniela(inviteCode.trim().toUpperCase(), user.id);
      if (error) {
        setErrorMessage(error);
        return;
      }
      setSuccessMessage('Te has unido a la quiniela correctamente');
      setTimeout(() => router.push('/(tabs)/quinielas'), 1500);
    } catch (error) {
      setErrorMessage('Ocurrió un error al unirse a la quiniela');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">🔗</Text>
            <View>
              <Text className="text-xl font-bold text-gray-900">Unirse con Código</Text>
              <Text className="text-gray-500">Ingresa el código de invitación</Text>
            </View>
          </View>
        </Card>

        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm text-center">{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <Text className="text-green-600 text-sm text-center">{successMessage}</Text>
          </View>
        ) : null}

        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Código de Invitación</Text>
          <Input
            placeholder="Ej: ABC123"
            value={inviteCode}
            onChangeText={(text) => { setInviteCode(text.toUpperCase()); setErrorMessage(''); }}
            type="text"
            leftIcon={<Text>🔑</Text>}
          />
          <Text className="text-sm text-gray-500 mt-2">El código tiene 6 caracteres (letras y números)</Text>
        </Card>

        <Button title="Unirse a la Quiniela" onPress={handleJoin} loading={loading} fullWidth />
        <View className="mt-3">
          <Button title="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </View>
    </ScrollView>
  );
}
