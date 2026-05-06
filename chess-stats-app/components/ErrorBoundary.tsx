import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors
 * Requirements: 2.5, 8.3
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you could log to an error reporting service here
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View className="flex-1 bg-gray-50">
          <ScrollView contentContainerClassName="flex-1 justify-center items-center p-6">
            <View className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
              <Text className="text-2xl font-bold text-red-600 mb-4 text-center">
                Something went wrong
              </Text>
              <Text className="text-gray-700 mb-2 font-semibold">Error:</Text>
              <Text className="text-gray-600 mb-4 text-sm">
                {this.state.error.message}
              </Text>
              <Text className="text-gray-500 text-xs mb-6">
                This error has been logged. Please try again or contact support if the problem persists.
              </Text>
              <TouchableOpacity
                onPress={this.resetError}
                className="bg-blue-600 rounded-lg py-3 px-6"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
