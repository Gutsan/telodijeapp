import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <View className="absolute top-12 left-4 right-4 z-50">
        {toasts.map(toast => (
          <View 
            key={toast.id}
            className={`${getToastStyle(toast.type)} px-4 py-3 rounded-lg mb-2 flex-row items-center`}
          >
            <Text className="text-white font-bold mr-2">
              {getToastIcon(toast.type)}
            </Text>
            <Text className="text-white flex-1">
              {toast.message}
            </Text>
            <TouchableOpacity onPress={() => removeToast(toast.id)}>
              <Text className="text-white font-bold ml-2">✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}
