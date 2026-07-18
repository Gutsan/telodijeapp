import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export function useProtectedRoute() {
  const { user, loading, initialized } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User authenticated, redirect to home
      router.replace('/(tabs)');
    }
  }, [user, loading, initialized, segments]);
}
