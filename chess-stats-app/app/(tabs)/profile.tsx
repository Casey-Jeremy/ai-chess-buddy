import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { usePlayerProfile, usePlayerStats } from '../../hooks/useChessData';
import { useHaptics } from '../../hooks/useHaptics';
import OfflineIndicator from '../../components/OfflineIndicator';
import ErrorMessage from '../../components/ErrorMessage';
import { ProfileSkeleton } from '../../components/SkeletonScreen';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isOffline } = useNetwork();
  const haptics = useHaptics();
  const [signingOut, setSigningOut] = useState(false);

  // Fetch Chess.com player profile using custom hook
  const { data: profile, isLoading, error, refetch } = usePlayerProfile(user?.chessComUsername);

  const handleSignOut = async () => {
    haptics.warning();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => haptics.light(),
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.medium();
              setSigningOut(true);
              await signOut();
              haptics.success();
            } catch (error) {
              haptics.error();
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              console.error('Sign out error:', error);
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleRetry = () => {
    refetch();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">Not Signed In</Text>
        <Text className="text-gray-600 text-center">
          Please sign in to view your profile
        </Text>
      </View>
    );
  }

  // Show skeleton screen on initial load
  // Requirements: 8.3
  if (isLoading && !profile) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <OfflineIndicator isVisible={isOffline} />
        <ProfileSkeleton />
      </ScrollView>
    );
  }

  // Show error message with retry when no cached profile exists
  // Requirements: 2.5, 4.5
  if (error && !profile) {
    return (
      <>
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={error}
          onRetry={handleRetry}
        />
      </>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Offline Indicator - Requirements: 6.2 */}
      <OfflineIndicator isVisible={isOffline} />
      
      <View className="p-4">
        {/* Show inline error if we have cached profile data */}
        {error && profile && (
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
            inline
            className="mb-4"
          />
        )}

        {/* Profile Header */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-4">
          {profile?.avatar && (
            <View className="items-center mb-4">
              <Image
                source={{ uri: profile.avatar }}
                className="w-24 h-24 rounded-full"
              />
            </View>
          )}
          
          <View className="items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {profile?.name || profile?.username || user.chessComUsername}
            </Text>
            <Text className="text-gray-600">@{profile?.username || user.chessComUsername}</Text>
            {profile?.status && (
              <View className="mt-2 px-3 py-1 bg-green-100 rounded-full">
                <Text className="text-green-800 text-sm capitalize">{profile.status}</Text>
              </View>
            )}
          </View>

          {/* Profile Details */}
          {profile && (
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
                  <Text className="text-gray-900 font-medium">{formatDate(profile.lastOnline)}</Text>
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
          )}
        </View>

        {/* Account Information */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Account</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Email</Text>
              <Text className="text-gray-900 font-medium">{user.email}</Text>
            </View>
            
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Linked Chess.com Account</Text>
              <Text className="text-gray-900 font-medium">
                {user.chessComUsername || 'Not linked'}
              </Text>
            </View>
            
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Member Since</Text>
              <Text className="text-gray-900 font-medium">
                {user.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
          
          <View className="space-y-3">
            <TouchableOpacity className="py-3 border-b border-gray-100">
              <Text className="text-gray-700">Preferences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="py-3 border-b border-gray-100">
              <Text className="text-gray-700">Cache Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="py-3">
              <Text className="text-gray-700">About</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-red-600 rounded-xl p-4 shadow-sm mb-8 active:bg-red-700"
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Text className="text-white text-center font-semibold text-lg">Signing Out...</Text>
          ) : (
            <Text className="text-white text-center font-semibold text-lg">Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
