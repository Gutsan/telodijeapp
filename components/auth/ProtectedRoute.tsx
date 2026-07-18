import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore();
  const segments = useSegments();

  // Show loading while checking auth
  if (loading || !initialized) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Check if user is authenticated
  if (!user) {
    // Redirect to login
    router.replace('/(auth)/login');
    return null;
  }

  // Check role if required
  if (requiredRole === 'admin' && user.plan_type !== 'premium') {
    // Redirect to home if not admin
    router.replace('/(tabs)');
    return null;
  }

  return <>{children}</>;
}
