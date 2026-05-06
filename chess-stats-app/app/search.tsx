import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { usePlayerProfile, usePlayerStats } from '../hooks/useChessData';
import { PlayerProfile, PlayerStats } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import { SearchSkeleton } from '../components/SkeletonScreen';

export default function SearchScreen() {
  const [searchUsername, setSearchUsername] = useState('');
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(null);

  // Fetch player profile using custom hook
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = usePlayerProfile(submittedUsername, { enabled: !!submittedUsername });

  // Fetch player stats using custom hook
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = usePlayerStats(submittedUsername, { enabled: !!submittedUsername });

  const handleSearch = () => {
    const trimmed = searchUsername.trim();
    if (trimmed) {
      setSubmittedUsername(trimmed);
    }
  };

  const handleRetry = () => {
    refetchProfile();
  };

  const isLoading = profileLoading || statsLoading;
  const error = profileError || statsError;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView testID="search-screen" className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Search Header */}
        <View className="mb-6">
          <Text testID="search-title" className="text-2xl font-bold text-gray-900 mb-2">Player Search</Text>
          <Text className="text-gray-600">
            Search for Chess.com players to view their profiles and ratings
          </Text>
        </View>

        {/* Search Input */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Chess.com Username</Text>
          <View className="flex-row space-x-2">
            <TextInput
              testID="search-input"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="Enter username..."
              value={searchUsername}
              onChangeText={setSearchUsername}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <TouchableOpacity
              testID="search-button"
              className="bg-blue-600 rounded-lg px-6 py-3 justify-center"
              onPress={handleSearch}
              disabled={!searchUsername.trim() || isLoading}
            >
              <Text className="text-white font-semibold">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State - Skeleton screen */}
        {/* Requirements: 8.3 */}
        {isLoading && (
          <SearchSkeleton />
        )}

        {/* Error State - Consistent ErrorMessage component */}
        {/* Requirements: 2.5, 4.5 */}
        {error && !isLoading && (
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
            title="Player Not Found"
            inline
            className="mb-4"
          />
        )}

        {/* Player Profile Display */}
        {profile && !isLoading && (
          <View>
            {/* Profile Header */}
            <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
              {profile.avatar && (
                <View className="items-center mb-4">
                  <Image
                    source={{ uri: profile.avatar }}
                    className="w-24 h-24 rounded-full"
                  />
                </View>
              )}

              <View className="items-center mb-4">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.name || profile.username}
                </Text>
                <Text className="text-gray-600">@{profile.username}</Text>
                {profile.status && (
                  <View className="mt-2 px-3 py-1 bg-green-100 rounded-full">
                    <Text className="text-green-800 text-sm capitalize">{profile.status}</Text>
                  </View>
                )}
              </View>

              {/* Profile Details */}
              <View className="space-y-3">
                {profile.joined && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-600">Joined Chess.com</Text>
                    <Text className="text-gray-900 font-medium">{formatDate(profile.joined)}</Text>
                  </View>
                )}

                {profile.lastOnline && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-600">Last Online</Text>
                    <Text className="text-gray-900 font-medium">
                      {formatDate(profile.lastOnline)}
                    </Text>
                  </View>
                )}

                {profile.followers !== undefined && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-600">Followers</Text>
                    <Text className="text-gray-900 font-medium">{profile.followers}</Text>
                  </View>
                )}

                {profile.country && (
                  <View className="flex-row justify-between py-2">
                    <Text className="text-gray-600">Country</Text>
                    <Text className="text-gray-900 font-medium">{profile.country}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Ratings Section */}
            {stats && (
              <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Ratings</Text>

                <View className="space-y-4">
                  {stats.chess_bullet && (
                    <View className="border-b border-gray-100 pb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-700 font-medium">Bullet</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {stats.chess_bullet.last.rating}
                        </Text>
                      </View>
                      <View className="flex-row justify-between text-sm">
                        <Text className="text-gray-500">
                          W: {stats.chess_bullet.record.win} / L: {stats.chess_bullet.record.loss} / D:{' '}
                          {stats.chess_bullet.record.draw}
                        </Text>
                        <Text className="text-gray-500">Best: {stats.chess_bullet.best.rating}</Text>
                      </View>
                    </View>
                  )}

                  {stats.chess_blitz && (
                    <View className="border-b border-gray-100 pb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-700 font-medium">Blitz</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {stats.chess_blitz.last.rating}
                        </Text>
                      </View>
                      <View className="flex-row justify-between text-sm">
                        <Text className="text-gray-500">
                          W: {stats.chess_blitz.record.win} / L: {stats.chess_blitz.record.loss} / D:{' '}
                          {stats.chess_blitz.record.draw}
                        </Text>
                        <Text className="text-gray-500">Best: {stats.chess_blitz.best.rating}</Text>
                      </View>
                    </View>
                  )}

                  {stats.chess_rapid && (
                    <View className="border-b border-gray-100 pb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-700 font-medium">Rapid</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {stats.chess_rapid.last.rating}
                        </Text>
                      </View>
                      <View className="flex-row justify-between text-sm">
                        <Text className="text-gray-500">
                          W: {stats.chess_rapid.record.win} / L: {stats.chess_rapid.record.loss} / D:{' '}
                          {stats.chess_rapid.record.draw}
                        </Text>
                        <Text className="text-gray-500">Best: {stats.chess_rapid.best.rating}</Text>
                      </View>
                    </View>
                  )}

                  {stats.chess_daily && (
                    <View className="pb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-700 font-medium">Daily</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {stats.chess_daily.last.rating}
                        </Text>
                      </View>
                      <View className="flex-row justify-between text-sm">
                        <Text className="text-gray-500">
                          W: {stats.chess_daily.record.win} / L: {stats.chess_daily.record.loss} / D:{' '}
                          {stats.chess_daily.record.draw}
                        </Text>
                        <Text className="text-gray-500">Best: {stats.chess_daily.best.rating}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Initial State */}
        {!submittedUsername && !isLoading && (
          <View className="items-center py-12">
            <Text className="text-gray-500 text-center">
              Enter a Chess.com username to search for a player
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
