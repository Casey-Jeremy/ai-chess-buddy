import React from 'react';
import { View, Text } from 'react-native';

interface OfflineIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export default function OfflineIndicator({ 
  isVisible, 
  message = 'Using cached data - You are offline' 
}: OfflineIndicatorProps) {
  if (!isVisible) return null;

  return (
    <View className="bg-yellow-500 py-2 px-4">
      <Text className="text-white text-center text-sm font-medium">
        ⚠️ {message}
      </Text>
    </View>
  );
}
