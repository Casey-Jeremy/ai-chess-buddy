import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Game } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface GameListItemProps {
  game: Game;
  currentUsername: string;
  onPress?: () => void;
}

export default function GameListItem({ game, currentUsername, onPress }: GameListItemProps) {
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
    haptics.light();
    onPress?.();
  };
  
  const userColor = game.white.username.toLowerCase() === currentUsername.toLowerCase() ? 'white' : 'black';
  const opponentColor = userColor === 'white' ? 'black' : 'white';
  const opponent = opponentColor === 'white' ? game.white : game.black;
  const userResult = userColor === 'white' ? game.white.result : game.black.result;
  
  const gameDate = game.endTime 
    ? new Date(game.endTime * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';
  
  const timeControl = formatTimeControl(game.timeControl);
  
  const isWin = userResult === 'win';
  const isDraw = ['repetition', 'stalemate', 'insufficient', '50move', 'draw'].includes(userResult);
  
  const resultColor = isWin ? '#10b981' : isDraw ? '#64748b' : '#ef4444';
  const resultBg = isWin ? 'bg-emerald-50' : isDraw ? 'bg-slate-100' : 'bg-rose-50';
  
  const resultText = isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS';

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
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${resultBg}`}>
              <MaterialCommunityIcons 
                name={isWin ? 'trophy' : isDraw ? 'equal' : 'close-circle'} 
                size={20} 
                color={resultColor} 
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900 leading-tight" numberOfLines={1}>
                {opponent.username}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="bg-slate-100 px-1.5 py-0.5 rounded-md mr-2">
                  <Text className="text-[10px] font-black text-slate-500 uppercase">{opponent.rating}</Text>
                </View>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{gameDate}</Text>
              </View>
            </View>
          </View>
          
          <View className={`px-3 py-1 rounded-full border ${isWin ? 'border-emerald-100' : isDraw ? 'border-slate-200' : 'border-rose-100'} ${resultBg}`}>
            <Text className="text-[10px] font-black tracking-widest" style={{ color: resultColor }}>
              {resultText}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
          <View className="flex-row items-center">
            <View className="bg-indigo-50 px-3 py-1 rounded-lg mr-3">
              <Text className="text-indigo-600 font-black text-[10px] uppercase">{timeControl}</Text>
            </View>
            {game.opening && !game.opening.toLowerCase().includes('unknown') && (
              <Text className="text-slate-500 text-xs font-medium flex-1" numberOfLines={1}>
                {game.opening.split(':')[0]}
              </Text>
            )}
            {(!game.opening || game.opening.toLowerCase().includes('unknown')) && (
              <Text className="text-slate-400 text-xs font-medium italic flex-1" numberOfLines={1}>
                Opening Theory Unknown
              </Text>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#cbd5e1" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function formatTimeControl(timeControl: string | undefined): string {
  if (!timeControl) return 'Daily';
  if (timeControl.includes('/')) return 'Daily';
  
  const seconds = parseInt(timeControl);
  if (isNaN(seconds)) return timeControl;
  
  if (seconds < 180) return 'Bullet';
  if (seconds < 600) return 'Blitz';
  if (seconds < 1800) return 'Rapid';
  return 'Rapid';
}
