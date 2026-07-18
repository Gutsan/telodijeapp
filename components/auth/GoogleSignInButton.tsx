import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

interface GoogleSignInButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, disabled }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      onPress?.();

      const { error } = await signInWithGoogle();

      if (error) {
        console.error('Google sign-in error:', error);
      }
      // On web: the page will redirect to Google and back automatically.
      // onAuthStateChange will handle the session.
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleSignIn}
      disabled={disabled || loading}
      className={`
        flex-row items-center justify-center
        bg-white border border-gray-300
        rounded-lg px-4 py-3
        ${disabled || loading ? 'opacity-50' : ''}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#6b7280" />
      ) : (
        <>
          <View className="w-5 h-5 mr-3 items-center justify-center">
            <Text className="text-lg font-bold text-blue-600">G</Text>
          </View>
          <Text className="text-gray-700 font-medium">
            Continuar con Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
