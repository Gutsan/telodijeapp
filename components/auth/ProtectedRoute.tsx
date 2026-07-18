import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth is initialized and not loading
    if (loading || !initialized) return;

    // Not authenticated → redirect to login
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    // Authenticated but needs admin role
    if (requiredRole === 'admin' && user.plan_type !== 'premium') {
      router.replace('/(tabs)');
      return;
    }
  }, [user, loading, initialized, requiredRole, router]);

  // Show loading while checking auth
  if (loading || !initialized) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Not authenticated yet — wait for useEffect redirect
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Admin check — wait for useEffect redirect
  if (requiredRole === 'admin' && user.plan_type !== 'premium') {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return <>{children}</>;
}
