import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useRecentGames, useOpeningAnalysis } from '../../hooks/useChessData';
import { OpeningAnalysis, Game } from '../../types';
import GameListItem from '../../components/GameListItem';
import ErrorMessage from '../../components/ErrorMessage';
import OfflineIndicator from '../../components/OfflineIndicator';
import { ListItemSkeleton } from '../../components/SkeletonScreen';
import cacheService from '../../services/CacheService';

export default function OpeningDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  
  const openingName = decodeURIComponent(name || '');

  // Fetch recent games using custom hook
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = 
    useRecentGames(user?.chessComUsername);

  // Analyze openings using custom hook
  const { data: allOpenings, isLoading: openingLoading, error: openingError } = 
    useOpeningAnalysis(user?.chessComUsername, games);

  // Find the specific opening
  const openingData = allOpenings?.find(o => o.openingName === openingName);

  const handleRetry = () => {
    refetchGames();
  };

  const handleGamePress = (game: Game) => {
    // Extract game ID from URL (e.g., https://www.chess.com/game/live/12345678)
    const gameId = game.url.split('/').pop();
    if (gameId) {
      // Cache the game data so the detail screen can access it
      cacheService.set(`game_${gameId}`, game, 24 * 60 * 60 * 1000);
      router.push({
        pathname: '/game/[id]',
        params: { id: gameId },
      });
    }
  };

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">No Chess.com Account Linked</Text>
        <Text className="text-gray-600 text-center">
          Please link your Chess.com account to view opening details
        </Text>
      </View>
    );
  }

  const isLoading = gamesLoading || openingLoading;
  const hasError = gamesError || openingError;

  // Show skeleton screen on initial load
  // Requirements: 8.3
  if (isLoading && !openingData) {
    return (
      <View className="flex-1 bg-gray-50">
        <OfflineIndicator isVisible={isOffline} />
        <View className="p-4">
          <View className="mb-6">
            <ListItemSkeleton />
            <View className="bg-white rounded-lg p-4 shadow-sm mb-3">
              {[1, 2, 3].map((i) => (
                <ListItemSkeleton key={i} />
              ))}
            </View>
          </View>
          {[1, 2, 3].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  // Show error message with retry
  // Requirements: 2.5, 4.5
  if (hasError && !openingData) {
    return (
      <>
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={gamesError || openingError}
          onRetry={handleRetry}
        />
      </>
    );
  }

  if (!openingData) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">Opening Not Found</Text>
        <Text className="text-gray-600 text-center">
          Could not find details for this opening
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <OfflineIndicator isVisible={isOffline} />

      {/* Show inline error if we have cached data */}
      {hasError && openingData && (
        <ErrorMessage
          error={gamesError || openingError}
          onRetry={handleRetry}
          inline
          className="mx-4 mt-2"
        />
      )}

      <FlatList
        data={openingData.games}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({ item }) => (
          <GameListItem
            game={item}
            currentUsername={user.chessComUsername!}
            onPress={() => handleGamePress(item)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-6">
            {/* Opening Name and ECO */}
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-3xl font-bold text-gray-900 flex-1">
                {openingData.openingName}
              </Text>
              {openingData.eco && (
                <Text className="text-lg text-gray-500 ml-2">{openingData.eco}</Text>
              )}
            </View>
            
            {/* Statistics Cards */}
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
              {/* Games Played */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">Games Played</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {openingData.gamesPlayed}
                </Text>
              </View>
              
              {/* Win/Loss/Draw Record */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Record</Text>
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">{openingData.wins}</Text>
                    <Text className="text-gray-600 text-sm">Wins</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">{openingData.losses}</Text>
                    <Text className="text-gray-600 text-sm">Losses</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-gray-600">{openingData.draws}</Text>
                    <Text className="text-gray-600 text-sm">Draws</Text>
                  </View>
                </View>
              </View>
              
              {/* Success Rate */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-1">Success Rate</Text>
                <View className={`self-start px-4 py-2 rounded-full ${
                  openingData.successRate >= 60 ? 'bg-green-100' :
                  openingData.successRate >= 45 ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <Text className={`font-bold text-2xl ${
                    openingData.successRate >= 60 ? 'text-green-700' :
                    openingData.successRate >= 45 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {openingData.successRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              {/* Average Rating */}
              <View>
                <Text className="text-gray-600 text-sm mb-1">Average Opponent Rating</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {Math.round(openingData.averageRating)}
                </Text>
              </View>
            </View>
            
            {/* Games List Header */}
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Games ({openingData.games.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-gray-600">No games found for this opening</Text>
          </View>
        }
        // Performance optimization - Requirements: 8.5
        getItemLayout={(data, index) => ({
          length: 130, // Approximate height of GameListItem
          offset: 130 * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </View>
  );
}
