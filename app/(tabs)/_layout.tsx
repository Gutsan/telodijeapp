import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

function HomeIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 24 }}>🏠</Text>;
}

function QuinielasIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 24 }}>⚽</Text>;
}

function RankingsIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 24 }}>🏆</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={{ color, fontSize: 24 }}>👤</Text>;
}

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            headerTitle: 'Telodije',
            tabBarIcon: HomeIcon,
          }}
        />
        <Tabs.Screen
          name="quinielas"
          options={{
            title: 'Apuestas',
            headerTitle: 'Mis Apuestas',
            tabBarIcon: QuinielasIcon,
          }}
        />
        <Tabs.Screen
          name="rankings"
          options={{
            title: 'Rankings',
            headerTitle: 'Clasificación',
            tabBarIcon: RankingsIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            headerTitle: 'Mi Perfil',
            tabBarIcon: ProfileIcon,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
