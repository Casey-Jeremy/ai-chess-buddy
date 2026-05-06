import React from 'react';
import { View, Text, FlatList, Platform } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useNetwork } from '../../../contexts/NetworkContext';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useMonthlyArchive } from '../../../hooks/useChessData';
import GameListItem from '../../../components/GameListItem';
import ErrorMessage from '../../../components/ErrorMessage';
import OfflineIndicator from '../../../components/OfflineIndicator';
import { ArchiveSkeleton } from '../../../components/SkeletonScreen';
import { Game } from '../../../types';
import cacheService from '../../../services/CacheService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MonthlyArchiveScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const params = useLocalSearchParams();
  const year = parseInt(params.year as string);
  const month = parseInt(params.month as string);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch games for the selected month using custom hook
  const { data: games, isLoading, error, refetch } = useMonthlyArchive(
    user?.chessComUsername,
    year,
    month
  );

  const handleRetry = () => {
    refetch();
  };

  const headerTitle = `${monthNames[month - 1]} ${year}`;

  // Sort games by time (most recent first)
  const sortedGames = React.useMemo(() => {
    if (!games) return [];
    return [...games].sort((a, b) => b.endTime - a.endTime);
  }, [games]);

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <MaterialCommunityIcons name="account-off-outline" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 mt-4 mb-2">No Account Linked</Text>
        <Text className="text-slate-500 text-center">
          Please link your Chess.com account to view games
        </Text>
      </View>
    );
  }

  if (isLoading && !games) {
    return (
      <>
        <Stack.Screen
          options={{
            title: headerTitle,
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: '#f8fafc' },
            headerTitleStyle: { fontWeight: '800', color: '#0f172a' },
          }}
        />
        <View className="flex-1 bg-slate-50">
          <OfflineIndicator isVisible={isOffline} />
          <ArchiveSkeleton />
        </View>
      </>
    );
  }

  if (error && !games) {
    return (
      <>
        <Stack.Screen
          options={{
            title: headerTitle,
            headerBackTitle: 'Back',
          }}
        />
        <View className="flex-1 bg-slate-50">
          <OfflineIndicator isVisible={isOffline} />
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
          />
        </View>
      </>
    );
  }

  const handleGamePress = (game: Game) => {
    const gameId = game.url.split('/').pop();
    if (gameId) {
      cacheService.set(`game_${gameId}`, game, 24 * 60 * 60 * 1000);
      router.push({
        pathname: '/game/[id]',
        params: { id: gameId },
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: headerTitle,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontWeight: '800', color: '#0f172a' },
        }}
      />
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />

        <FlatList
          data={sortedGames}
          keyExtractor={(item, index) => item.url || `game-${index}`}
          renderItem={({ item }) => (
            <GameListItem 
              game={item} 
              currentUsername={user.chessComUsername!}
              onPress={() => handleGamePress(item)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            <View className="mb-6 mt-2">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-3xl font-black text-slate-900 tracking-tight">{monthNames[month - 1]}</Text>
                  <Text className="text-slate-500 font-bold text-lg">{year}</Text>
                </View>
                <View className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                  <Text className="text-indigo-600 font-black text-lg">{games?.length || 0}</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase">Games</Text>
                </View>
              </View>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </View>
    </>
  );
}
