import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';

interface GoogleSignInButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, disabled }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      onPress?.();

      const redirectUrl = makeRedirectUri({
        scheme: 'telodije',
        path: 'callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Open browser for authentication
      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectUrl
      );

      if (res.type === 'success') {
        // The authentication was successful
        // The session will be handled by Supabase
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar sesión con Google. Intenta de nuevo.'
      );
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
          <View className="w-5 h-5 mr-3">
            <Text className="text-lg">G</Text>
          </View>
          <Text className="text-gray-700 font-medium">
            Continuar con Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
