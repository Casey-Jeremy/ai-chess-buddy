import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ApiError } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface ErrorMessageProps {
  message?: string;
  error?: Error | ApiError | unknown;
  onRetry?: () => void;
  className?: string;
  title?: string;
  inline?: boolean;
}

/**
 * Enhanced error message component with retry functionality
 * Requirements: 2.5, 4.5, 8.3
 */
export default function ErrorMessage({ 
  message, 
  error,
  onRetry, 
  className = '',
  title = 'Error',
  inline = false,
}: ErrorMessageProps) {
  const haptics = useHaptics();
  // Extract error message from various error types
  const getErrorMessage = (): string => {
    if (message) return message;
    
    if (error) {
      // Handle ApiError type
      if (typeof error === 'object' && error !== null && 'message' in error) {
        return (error as ApiError).message;
      }
      // Handle standard Error
      if (error instanceof Error) {
        return error.message;
      }
      // Handle string errors
      if (typeof error === 'string') {
        return error;
      }
    }
    
    return 'An unexpected error occurred';
  };

  // Check if error is retryable
  const isRetryable = (): boolean => {
    if (error && typeof error === 'object' && error !== null && 'retryable' in error) {
      return (error as ApiError).retryable ?? true;
    }
    return true; // Default to retryable
  };

  // Get user-friendly error title based on error code
  const getErrorTitle = (): string => {
    if (title !== 'Error') return title;
    
    if (error && typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as ApiError).code;
      switch (code) {
        case 'NOT_FOUND':
          return 'Not Found';
        case 'RATE_LIMITED':
          return 'Rate Limited';
        case 'SERVER_ERROR':
          return 'Server Error';
        case 'NETWORK_ERROR':
          return 'Network Error';
        default:
          return 'Error';
      }
    }
    
    return 'Error';
  };

  const errorMessage = getErrorMessage();
  const showRetry = onRetry && isRetryable();
  const errorTitle = getErrorTitle();

  const handleRetry = () => {
    haptics.light();
    onRetry?.();
  };

  // Inline error (for forms, etc.)
  if (inline) {
    return (
      <View className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <Text className="text-red-800 text-sm font-medium mb-1">
          {errorTitle}
        </Text>
        <Text className="text-red-700 text-sm">
          {errorMessage}
        </Text>
        {showRetry && (
          <TouchableOpacity
            onPress={handleRetry}
            className="mt-2 self-start"
            activeOpacity={0.7}
          >
            <Text className="text-red-600 text-sm font-semibold underline">
              Try again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Full-screen error
  return (
    <View className={`flex-1 justify-center items-center p-6 bg-gray-50 ${className}`}>
      <View className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <View className="items-center mb-4">
          <View className="bg-red-100 rounded-full w-16 h-16 items-center justify-center mb-3">
            <Text className="text-red-600 text-3xl">⚠️</Text>
          </View>
          <Text className="text-red-800 text-xl font-bold text-center">
            {errorTitle}
          </Text>
        </View>
        <Text className="text-gray-700 text-center mb-6">
          {errorMessage}
        </Text>
        {showRetry && (
          <TouchableOpacity
            onPress={handleRetry}
            className="bg-blue-600 rounded-xl py-3 px-6 mb-2 active:bg-blue-700"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold">
              Try Again
            </Text>
          </TouchableOpacity>
        )}
        <Text className="text-gray-500 text-xs text-center mt-2">
          If this problem persists, please check your internet connection or try again later.
        </Text>
      </View>
    </View>
  );
}
