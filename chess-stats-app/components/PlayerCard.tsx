import React from 'react';
import { View, Text, Image } from 'react-native';
import { PlayerProfile } from '../types';

interface PlayerCardProps {
  profile: PlayerProfile;
  className?: string;
}

export default function PlayerCard({ profile, className = '' }: PlayerCardProps) {
  const joinDate = new Date(profile.joined * 1000).toLocaleDateString();
  const lastOnline = new Date(profile.lastOnline * 1000).toLocaleDateString();

  return (
    <View className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      <View className="flex-row items-center mb-3">
        {profile.avatar && (
          <Image
            source={{ uri: profile.avatar }}
            className="w-16 h-16 rounded-full mr-4"
          />
        )}
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">
            {profile.username}
          </Text>
          {profile.name && (
            <Text className="text-gray-600 text-sm">{profile.name}</Text>
          )}
          <Text className="text-gray-500 text-xs mt-1">{profile.status}</Text>
        </View>
      </View>

      <View className="border-t border-gray-200 pt-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600 text-sm">Country:</Text>
          <Text className="text-gray-900 text-sm font-medium">{profile.country}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600 text-sm">Joined:</Text>
          <Text className="text-gray-900 text-sm font-medium">{joinDate}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600 text-sm">Last Online:</Text>
          <Text className="text-gray-900 text-sm font-medium">{lastOnline}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-600 text-sm">Followers:</Text>
          <Text className="text-gray-900 text-sm font-medium">{profile.followers}</Text>
        </View>
      </View>
    </View>
  );
}
