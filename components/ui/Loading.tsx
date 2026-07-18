import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = 'large',
  color = '#22c55e',
  text,
  fullScreen = false,
}: LoadingProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size={size} color={color} />
        {text && (
          <Text className="mt-4 text-gray-600 text-base">
            {text}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center py-4">
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="ml-3 text-gray-600 text-base">
          {text}
        </Text>
      )}
    </View>
  );
}
