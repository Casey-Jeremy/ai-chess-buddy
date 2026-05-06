import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  className?: string;
}

export default function StatCard({ label, value, subtitle, icon, className = '' }: StatCardProps) {
  return (
    <View className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-600 text-sm">{label}</Text>
        {icon && <Text className="text-xl">{icon}</Text>}
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      {subtitle && (
        <Text className="text-gray-500 text-xs">{subtitle}</Text>
      )}
    </View>
  );
}
