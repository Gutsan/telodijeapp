import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Here you could send error to a reporting service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 justify-center items-center bg-white p-6">
          <Text className="text-6xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Algo salió mal
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Ha ocurrido un error inesperado. Por favor intenta de nuevo.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-primary-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">
              Intentar de Nuevo
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
