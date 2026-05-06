import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useRouter } from 'expo-router';
import { useGameArchives } from '../../hooks/useChessData';
import OfflineIndicator from '../../components/OfflineIndicator';
import ErrorMessage from '../../components/ErrorMessage';
import { ArchiveSkeleton } from '../../components/SkeletonScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ArchiveItem {
  year: number;
  month: number;
  displayText: string;
  url: string;
}

export default function GamesScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch game archives using custom hook
  const { data: archives, isLoading, error, refetch } = useGameArchives(user?.chessComUsername);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetch();
  };

  // Transform archive URLs into structured data
  const archiveItems: ArchiveItem[] = archives?.map((url) => {
    const parts = url.split('/');
    const year = parseInt(parts[parts.length - 2]);
    const month = parseInt(parts[parts.length - 1]);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return {
      year,
      month,
      displayText: monthNames[month - 1],
      url,
    };
  }).reverse() || []; // Reverse to show most recent first

  const handleArchivePress = (item: ArchiveItem) => {
    router.push({
      pathname: '/archive/[year]/[month]',
      params: { 
        year: item.year.toString(), 
        month: item.month.toString() 
      },
    });
  };

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <MaterialCommunityIcons name="account-off-outline" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 mt-4 mb-2">No Account Linked</Text>
        <Text className="text-slate-500 text-center">
          Please link your Chess.com account to view your game archives
        </Text>
      </View>
    );
  }

  if (isLoading && !archives) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <ArchiveSkeleton />
      </View>
    );
  }

  if (error && !archives) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={error}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  // Group archives by year
  const archivesByYear: { [year: number]: ArchiveItem[] } = {};
  archiveItems.forEach((item) => {
    if (!archivesByYear[item.year]) {
      archivesByYear[item.year] = [];
    }
    archivesByYear[item.year].push(item);
  });

  const years = Object.keys(archivesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <View testID="games-screen" className="flex-1 bg-slate-50">
      <OfflineIndicator isVisible={isOffline} />
      
      <FlatList
        data={years}
        keyExtractor={(year) => year.toString()}
        renderItem={({ item: year }) => (
          <View className="mb-8">
            <View className="flex-row items-center px-4 mb-4">
              <View className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3" />
              <Text className="text-2xl font-black text-slate-900 tracking-tight">{year}</Text>
            </View>
            <View className="px-4">
              <View className="flex-row flex-wrap gap-3">
                {archivesByYear[year].map((archive) => (
                  <TouchableOpacity
                    key={archive.url}
                    onPress={() => handleArchivePress(archive)}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm w-[47%] items-center"
                    style={{
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                    }}
                  >
                    <View className="w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center mb-3">
                      <MaterialCommunityIcons name="calendar-month" size={24} color="#6366f1" />
                    </View>
                    <Text className="text-lg font-bold text-slate-900 text-center">
                      {archive.displayText}
                    </Text>
                    <Text className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">
                      VIEW GAMES
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View className="mb-8 mt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-4xl font-black text-slate-900 tracking-tight">Archives</Text>
                <Text className="text-slate-500 font-medium text-lg mt-1">
                  {archiveItems.length} months of history
                </Text>
              </View>
              <View className="bg-indigo-50 p-3 rounded-2xl">
                <MaterialCommunityIcons name="history" size={32} color="#6366f1" />
              </View>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
      />
    </View>
  );
}
