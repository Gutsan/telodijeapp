import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, TouchableWithoutFeedback } from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full',
  };

  // Close on back button press (Android)
  useEffect(() => {
    const subscription = () => {
      if (visible) {
        onClose();
      }
    };
    // This is a simplified version - in production, use useBackHandler
    return () => {};
  }, [visible, onClose]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <TouchableWithoutFeedback>
            <View className={`bg-white rounded-2xl w-full ${sizeStyles[size]} max-h-[90%]`}>
              {/* Header */}
              {(title || showCloseButton) && (
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  {title && (
                    <Text className="text-lg font-semibold text-gray-900">
                      {title}
                    </Text>
                  )}
                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      className="p-1"
                    >
                      <Text className="text-gray-400 text-xl">✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Content */}
              <View className="p-4">
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
