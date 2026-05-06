import React from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MetricCardProps {
  label: string;
  value: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export default function MetricCard({ 
  label, 
  value, 
  icon, 
  className = '',
  iconColor = '#64748b',
  iconBgColor = 'bg-slate-100'
}: MetricCardProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={{ opacity: fadeAnim }}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}
    >
      {icon && (
        <View className={`w-10 h-10 rounded-full ${iconBgColor} items-center justify-center mb-4`}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
      )}
      {!icon && (
        <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mb-4" />
      )}
      <Text className="text-slate-500 text-xs mb-1 font-semibold uppercase tracking-wider">{label}</Text>
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
    </Animated.View>
  );
}
