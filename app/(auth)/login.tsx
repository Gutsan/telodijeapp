import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card } from '../../components/ui';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      // Navigate to home
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
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
            Gamifica las quinielas de fútbol entre amigos
          </Text>
        </View>

        {/* Login Form */}
        <Card className="mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-6">
            Iniciar Sesión
          </Text>

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            type="email"
            leftIcon={<Text>📧</Text>}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            type="password"
            leftIcon={<Text>🔒</Text>}
          />

          <TouchableOpacity className="self-end mb-4">
            <Link href="/(auth)/forgot-password" asChild>
              <Text className="text-primary-500 text-sm">
                ¿Olvidaste tu contraseña?
              </Text>
            </Link>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
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

        {/* Register Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">
            ¿No tienes cuenta?{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-primary-500 font-semibold">
                Regístrate
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
