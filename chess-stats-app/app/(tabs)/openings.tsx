import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useRouter } from 'expo-router';
import { useRecentGames, useOpeningAnalysis } from '../../hooks/useChessData';
import { OpeningAnalysis } from '../../types';
import OpeningCard from '../../components/OpeningCard';
import OfflineIndicator from '../../components/OfflineIndicator';
import ErrorMessage from '../../components/ErrorMessage';
import { OpeningsSkeleton } from '../../components/SkeletonScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OpeningsScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recent games using custom hook
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = 
    useRecentGames(user?.chessComUsername);

  // Analyze openings using custom hook
  const { data: openings, isLoading: openingsLoading, error: openingsError } = 
    useOpeningAnalysis(user?.chessComUsername, games);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchGames();
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetchGames();
  };

  const handleOpeningPress = (opening: OpeningAnalysis) => {
    if (opening.openingName.toLowerCase().includes('unknown')) return;
    router.push({
      pathname: '/opening/[name]',
      params: { name: encodeURIComponent(opening.openingName) },
    });
  };

  // Identify openings that need improvement
  const improvementNeeded = useMemo(() => {
    if (!openings) return [];
    return openings
      .filter(o => o.gamesPlayed >= 3 && o.successRate < 45 && !o.openingName.toLowerCase().includes('unknown'))
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 2);
  }, [openings]);

  // Learning resources
  const learningResources = [
    {
      title: 'Chess.com Openings',
      description: 'Interactive courses and explorer',
      url: 'https://www.chess.com/openings',
      icon: 'chess-pawn',
      color: '#81b64c'
    },
    {
      title: 'Lichess Study',
      description: 'Free community-made opening guides',
      url: 'https://lichess.org/study',
      icon: 'book-open-variant',
      color: '#d5a021'
    },
    {
      title: 'Chessable',
      description: 'Science-based opening memorization',
      url: 'https://www.chessable.com',
      icon: 'brain',
      color: '#2b79c2'
    }
  ];

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <MaterialCommunityIcons name="account-search-outline" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 mt-4 mb-2">No Account Linked</Text>
        <Text className="text-slate-500 text-center">
          Please link your Chess.com account to view opening analysis
        </Text>
      </View>
    );
  }

  const isLoading = gamesLoading || openingsLoading;
  const hasError = gamesError || openingsError;

  if (isLoading && !openings) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <OpeningsSkeleton />
      </View>
    );
  }

  if (hasError && !openings) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={gamesError || openingsError}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  return (
    <View testID="openings-screen" className="flex-1 bg-slate-50">
      <OfflineIndicator isVisible={isOffline} />
      
      <FlatList
        data={openings}
        keyExtractor={(item) => item.openingName}
        renderItem={({ item }) => (
          <OpeningCard
            opening={item}
            onPress={item.openingName.toLowerCase().includes('unknown') ? undefined : () => handleOpeningPress(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-4xl font-black text-slate-900 tracking-tight">Openings</Text>
                <Text className="text-slate-500 font-medium text-lg mt-1">
                  Analysis of {openings?.length || 0} systems
                </Text>
              </View>
              <View className="bg-indigo-50 p-3 rounded-2xl">
                <MaterialCommunityIcons name="library-shelves" size={32} color="#6366f1" />
              </View>
            </View>

            {/* Improvement Section */}
            {improvementNeeded.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center mb-4">
                  <MaterialCommunityIcons name="trending-up" size={24} color="#6366f1" />
                  <Text className="text-xl font-bold text-slate-900 ml-2">Growth Areas</Text>
                </View>
                <View className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200">
                  <Text className="text-white/80 font-bold uppercase tracking-widest text-[10px] mb-2">Needs Study</Text>
                  {improvementNeeded.map((opening, idx) => (
                    <View key={opening.openingName} className={`flex-row items-center justify-between ${idx !== 0 ? 'mt-4 pt-4 border-t border-white/10' : ''}`}>
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold">{opening.openingName}</Text>
                        <Text className="text-white/70 text-xs font-medium">Win rate: {opening.successRate.toFixed(1)}%</Text>
                      </View>
                      <TouchableOpacity 
                        className="bg-white/20 px-4 py-2 rounded-xl"
                        onPress={() => handleOpeningPress(opening)}
                      >
                        <Text className="text-white font-bold text-xs">Analyze</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View className="mt-6 bg-white/10 p-4 rounded-2xl border border-white/5">
                    <Text className="text-white font-medium text-sm leading-snug">
                      Focusing on these openings could increase your overall win rate by ~{(improvementNeeded.reduce((acc, curr) => acc + (50 - curr.successRate), 0) / (openings?.length || 1)).toFixed(1)}%.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Learning Resources */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-slate-900 mb-4">Mastery Resources</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {learningResources.map((resource, index) => (
                  <View 
                    key={index} 
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mr-4 w-64"
                  >
                    <View 
                      style={{ backgroundColor: `${resource.color}15` }}
                      className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                    >
                      <MaterialCommunityIcons name={resource.icon as any} size={24} color={resource.color} />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg mb-1">{resource.title}</Text>
                    <Text className="text-slate-500 text-sm mb-4 leading-snug">{resource.description}</Text>
                    <TouchableOpacity className="flex-row items-center">
                      <Text style={{ color: resource.color }} className="font-bold text-sm">Explore Guide</Text>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={resource.color} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            <Text className="text-xl font-bold text-slate-900 mb-4">Your Library</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </View>
  );
}
