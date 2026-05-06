import React from 'react';
import { View, Text } from 'react-native';
import { ImprovementSuggestion } from '../types';

interface ImprovementSuggestionCardProps {
  suggestion: ImprovementSuggestion;
}

export default function ImprovementSuggestionCard({ suggestion }: ImprovementSuggestionCardProps) {
  const priorityColors = {
    high: 'bg-rose-50 text-rose-700 border-rose-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const categoryIcons = {
    opening: '♟️',
    middlegame: '⚔️',
    endgame: '🏁',
    'time-management': '⏱️',
  };

  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3">
            <Text className="text-xl">{categoryIcons[suggestion.category]}</Text>
          </View>
          <Text className="text-lg font-bold text-slate-900 capitalize">
            {suggestion.category.replace('-', ' ')}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full border ${priorityColors[suggestion.priority]}`}>
          <Text className="text-[10px] font-black uppercase tracking-widest">
            {suggestion.priority}
          </Text>
        </View>
      </View>

      <Text className="text-slate-600 text-base leading-snug mb-4 font-medium">{suggestion.insight}</Text>
      
      <View className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 mb-4">
        <Text className="text-xs font-black text-indigo-700 mb-1 uppercase tracking-wider">Recommendation</Text>
        <Text className="text-slate-700 font-medium">{suggestion.recommendation}</Text>
      </View>

      <View className="flex-row justify-between border-t border-slate-50 pt-3">
        <View>
          <Text className="text-[10px] text-slate-400 font-bold uppercase">Games Affected</Text>
          <Text className="text-slate-700 font-bold">{suggestion.supportingData.gamesAffected}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-slate-400 font-bold uppercase">Impact</Text>
          <Text className="text-indigo-600 font-bold">{suggestion.supportingData.impactOnWinRate.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}
