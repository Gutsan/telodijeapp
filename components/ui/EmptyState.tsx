import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <Text className="text-6xl mb-4">{icon}</Text>
      
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>
      
      {description && (
        <Text className="text-gray-500 text-center mb-6 max-w-xs">
          {description}
        </Text>
      )}
      
      {action && <View>{action}</View>}
    </View>
  );
}
