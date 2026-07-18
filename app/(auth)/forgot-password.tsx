import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Input, Card } from '../../components/ui';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:8081/reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setSent(true);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al enviar el email');
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
            Recupera tu contraseña
          </Text>
        </View>

        {/* Form */}
        <Card className="mb-6">
          {sent ? (
            <View className="items-center py-4">
              <Text className="text-6xl mb-4">✉️</Text>
              <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                Email enviado
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.
              </Text>
              <Button
                title="Volver al login"
                onPress={() => router.replace('/(auth)/login')}
                variant="outline"
              />
            </View>
          ) : (
            <>
              <Text className="text-xl font-semibold text-gray-900 mb-4">
                ¿Olvidaste tu contraseña?
              </Text>
              <Text className="text-gray-500 mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </Text>

              <Input
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                type="email"
                leftIcon={<Text>📧</Text>}
              />

              <Button
                title="Enviar enlace"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
              />
            </>
          )}
        </Card>

        {/* Back to Login */}
        <View className="flex-row justify-center">
          <Text className="text-gray-500">
            ¿Recordaste tu contraseña?{' '}
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
