import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'large',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <View className={`flex-1 justify-center items-center ${className}`}>
      <ActivityIndicator size={size} color="#3b82f6" />
      {message && (
        <Text className="text-gray-600 mt-4 text-center">{message}</Text>
      )}
    </View>
  );
}
