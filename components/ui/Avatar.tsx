import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({
  uri,
  name = '',
  size = 'md',
}: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };
  
  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Generate initials from name
  const initials = name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on name
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-accent-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${sizeStyles[size]} rounded-full`}
        resizeMode="cover"
      />
    );
  }

  return (
    <View className={`${sizeStyles[size]} ${backgroundColor} rounded-full items-center justify-center`}>
      <Text className={`text-white font-semibold ${textSizeStyles[size]}`}>
        {initials}
      </Text>
    </View>
  );
}
