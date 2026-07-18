import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card } from '../../components/ui';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signUpWithEmail } = useAuthStore();

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUpWithEmail(email, password);

      if (error) {
        setErrorMessage(error);
        return;
      }

      setSuccessMessage('Cuenta creada correctamente. Redirigiendo al login...');
      setTimeout(() => {
        const { router } = require('expo-router');
        router.replace('/(auth)/login');
      }, 2000);
    } catch (error) {
      setErrorMessage('Ocurrió un error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12 pb-8">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-primary-500 mb-2">
            Telodije
          </Text>
          <Text className="text-gray-500 text-center">
            Crea tu cuenta y empieza a competir
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm text-center">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Success Message */}
        {successMessage ? (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <Text className="text-green-600 text-sm text-center">{successMessage}</Text>
          </View>
        ) : null}

        {/* Register Form */}
        <Card className="mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-6">
            Crear Cuenta
          </Text>

          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={fullName}
            onChangeText={(text) => { setFullName(text); setErrorMessage(''); }}
            leftIcon={<Text>👤</Text>}
          />

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
            type="email"
            leftIcon={<Text>📧</Text>}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
            type="password"
            leftIcon={<Text>🔒</Text>}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(''); }}
            type="password"
            leftIcon={<Text>🔒</Text>}
          />

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={loading}
            fullWidth
          />
        </Card>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-gray-400">o</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google Sign In */}
        <GoogleSignInButton />

        {/* Login Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">
            ¿Ya tienes cuenta?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary-500 font-semibold">
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
