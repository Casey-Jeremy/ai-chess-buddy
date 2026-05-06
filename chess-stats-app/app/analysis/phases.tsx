import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useRouter } from 'expo-router';
import { useRecentGames, usePhaseAnalysis, useImprovementSuggestions } from '../../hooks/useChessData';
import { PhaseAnalysis, ImprovementSuggestion } from '../../types';
import ImprovementSuggestionCard from '../../components/ImprovementSuggestionCard';
import GameListItem from '../../components/GameListItem';
import ErrorMessage from '../../components/ErrorMessage';
import OfflineIndicator from '../../components/OfflineIndicator';
import { PhaseAnalysisSkeleton } from '../../components/SkeletonScreen';

export default function PhaseAnalysisScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recent games using custom hook
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = 
    useRecentGames(user?.chessComUsername);

  // Analyze game phases using custom hook
  const { data: phaseAnalysis, isLoading: phaseLoading } = 
    usePhaseAnalysis(user?.chessComUsername, games);

  // Generate AI improvement suggestions using custom hook
  const { data: suggestions, isLoading: suggestionsLoading } = 
    useImprovementSuggestions(user?.chessComUsername, games);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchGames();
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetchGames();
  };

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">No Chess.com Account Linked</Text>
        <Text className="text-gray-600 text-center">
          Please link your Chess.com account to view phase analysis
        </Text>
      </View>
    );
  }

  const isLoading = gamesLoading || phaseLoading;

  // Show skeleton screen on initial load
  // Requirements: 8.3
  if (isLoading && !phaseAnalysis) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <OfflineIndicator isVisible={isOffline} />
        <PhaseAnalysisSkeleton />
      </ScrollView>
    );
  }

  // Show error message with retry
  // Requirements: 2.5, 4.5
  if (gamesError && !phaseAnalysis) {
    return (
      <>
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={gamesError}
          onRetry={handleRetry}
        />
      </>
    );
  }

  if (!phaseAnalysis || !games || games.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">No Games Found</Text>
        <Text className="text-gray-600 text-center">
          Play some games on Chess.com to see phase analysis
        </Text>
      </View>
    );
  }

  // Filter suggestions by phase
  const phaseSuggestions = suggestions?.filter(s => 
    s.category === 'opening' || s.category === 'middlegame' || s.category === 'endgame'
  ) || [];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Offline Indicator - Requirements: 6.2 */}
      <OfflineIndicator isVisible={isOffline} />

      {/* Show inline error if we have cached data */}
      {gamesError && phaseAnalysis && (
        <ErrorMessage
          error={gamesError}
          onRetry={handleRetry}
          inline
          className="mx-4 mt-2"
        />
      )}

      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Phase Analysis</Text>
          <Text className="text-gray-600 mt-1">
            Analyzing {games.length} recent games
          </Text>
        </View>

        {/* Opening Phase */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">♟️</Text>
            <Text className="text-xl font-semibold text-gray-900">Opening Phase</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-medium">Games Decided</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {phaseAnalysis.openingPhase.gamesDecided}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-medium">Win Rate</Text>
              <Text className="text-2xl font-bold text-green-600">
                {phaseAnalysis.openingPhase.winRate.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Common Patterns */}
          {phaseAnalysis.openingPhase.commonPatterns.length > 0 && (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Common Patterns</Text>
              {phaseAnalysis.openingPhase.commonPatterns.map((pattern, index) => (
                <Text key={index} className="text-gray-700 mb-1">• {pattern}</Text>
              ))}
            </View>
          )}

          {/* Example Games */}
          {phaseAnalysis.openingPhase.exampleGames.length > 0 && (
            <View className="mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Example Games</Text>
              {phaseAnalysis.openingPhase.exampleGames.map((game, index) => (
                <GameListItem
                  key={index}
                  game={game}
                  currentUsername={user.chessComUsername!}
                  onPress={() => {
                    const gameId = game.url.split('/').pop();
                    router.push(`/game/${gameId}`);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Middlegame Phase */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">♔</Text>
            <Text className="text-xl font-semibold text-gray-900">Middlegame Phase</Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm mb-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-medium">Games Decided</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {phaseAnalysis.middlegamePhase.gamesDecided}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-medium">Win Rate</Text>
              <Text className="text-2xl font-bold text-green-600">
                {phaseAnalysis.middlegamePhase.winRate.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Common Patterns */}
          {phaseAnalysis.middlegamePhase.commonPatterns.length > 0 && (
            <View className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Common Patterns</Text>
              {phaseAnalysis.middlegamePhase.commonPatterns.map((pattern, index) => (
                <Text key={index} className="text-gray-700 mb-1">• {pattern}</Text>
              ))}
            </View>
          )}

          {/* Example Games */}
          {phaseAnalysis.middlegamePhase.exampleGames.length > 0 && (
            <View className="mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Example Games</Text>
              {phaseAnalysis.middlegamePhase.exampleGames.map((game, index) => (
                <GameListItem
                  key={index}
                  game={game}
                  currentUsername={user.chessComUsername!}
                  onPress={() => {
                    const gameId = game.url.split('/').pop();
                    router.push(`/game/${gameId}`);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Endgame Phase */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">♚</Text>
            <Text className="text-xl font-semibold text-gray-900">Endgame Phase</Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm mb-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-medium">Games Decided</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {phaseAnalysis.endgamePhase.gamesDecided}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-medium">Win Rate</Text>
              <Text className="text-2xl font-bold text-green-600">
                {phaseAnalysis.endgamePhase.winRate.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Common Patterns */}
          {phaseAnalysis.endgamePhase.commonPatterns.length > 0 && (
            <View className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Common Patterns</Text>
              {phaseAnalysis.endgamePhase.commonPatterns.map((pattern, index) => (
                <Text key={index} className="text-gray-700 mb-1">• {pattern}</Text>
              ))}
            </View>
          )}

          {/* Example Games */}
          {phaseAnalysis.endgamePhase.exampleGames.length > 0 && (
            <View className="mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Example Games</Text>
              {phaseAnalysis.endgamePhase.exampleGames.map((game, index) => (
                <GameListItem
                  key={index}
                  game={game}
                  currentUsername={user.chessComUsername!}
                  onPress={() => {
                    const gameId = game.url.split('/').pop();
                    router.push(`/game/${gameId}`);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* AI-Generated Insights */}
        {phaseSuggestions.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-900 mb-3">
              AI-Generated Insights
            </Text>
            {suggestionsLoading ? (
              <View className="bg-white rounded-lg p-4 shadow-sm">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-600 text-center mt-2">Generating insights...</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {phaseSuggestions.map((suggestion, index) => (
                  <ImprovementSuggestionCard key={index} suggestion={suggestion} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
