import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { OpeningAnalysis } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OpeningCardProps {
  opening: OpeningAnalysis;
  onPress?: () => void;
}

export default function OpeningCard({ opening, onPress }: OpeningCardProps) {
  const haptics = useHaptics();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (opening.openingName.toLowerCase().includes('unknown')) return;
    haptics.light();
    onPress?.();
  };

  const statusColor = opening.successRate >= 60 ? '#10b981' : 
                      opening.successRate >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-xl font-bold text-slate-900 leading-tight">
              {opening.openingName}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-slate-100 px-2 py-0.5 rounded-md mr-2">
                <Text className="text-[10px] font-black text-slate-500 uppercase">{opening.eco || 'ECO'}</Text>
              </View>
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                {opening.gamesPlayed} {opening.gamesPlayed === 1 ? 'game' : 'games'}
              </Text>
            </View>
          </View>
          <View 
            style={{ backgroundColor: `${statusColor}15` }}
            className="w-12 h-12 rounded-2xl items-center justify-center"
          >
            <Text style={{ color: statusColor }} className="text-lg font-black">
              {Math.round(opening.successRate)}%
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
          <View className="flex-row items-center">
            <View className="items-center mr-6">
              <Text className="text-emerald-600 font-black text-sm">{opening.wins}</Text>
              <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">Wins</Text>
            </View>
            <View className="items-center mr-6">
              <Text className="text-rose-600 font-black text-sm">{opening.losses}</Text>
              <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">Losses</Text>
            </View>
            <View className="items-center">
              <Text className="text-slate-500 font-black text-sm">{opening.draws}</Text>
              <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">Draws</Text>
            </View>
          </View>
          
          <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
