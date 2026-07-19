import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Loading } from '../components/ui';

export default function JoinRedirectScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    if (code) {
      // Redirect to quiniela/join with the invite code
      router.replace(`/quiniela/join?code=${code}`);
    } else {
      // No code provided, go to join screen empty
      router.replace('/quiniela/join');
    }
  }, [code]);

  return (
    <Loading fullScreen text="Redirigiendo..." />
  );
}
