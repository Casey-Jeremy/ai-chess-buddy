import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();

  // Hide tabs when user is not authenticated or hasn't linked Chess.com account
  const shouldHideTabs = !user || !user.chessComUsername;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f8fafc',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: -0.5,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: shouldHideTabs ? { display: 'none' } : {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Insights',
          headerTitle: 'Chess Buddy',
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-indigo-50' : ''}`}>
              <Ionicons 
                name={focused ? 'analytics' : 'analytics-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="openings"
        options={{
          title: 'Openings',
          headerTitle: 'My Library',
          tabBarLabel: 'Openings',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-indigo-50' : ''}`}>
              <Ionicons 
                name={focused ? 'library' : 'library-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Archives',
          headerTitle: 'Game History',
          tabBarLabel: 'Games',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-indigo-50' : ''}`}>
              <Ionicons 
                name={focused ? 'time' : 'time-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          headerTitle: 'Settings',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-indigo-50' : ''}`}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
