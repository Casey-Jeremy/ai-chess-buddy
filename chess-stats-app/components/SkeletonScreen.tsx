import React, { useEffect, useRef } from 'react';
import { View, DimensionValue, Animated, Easing } from 'react-native';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
}

/**
 * Premium Skeleton loading component with Reanimated pulse
 * Aesthetic: Refined Editorial / Grandmaster
 */
export function SkeletonBox({ 
  width = '100%', 
  height = 20, 
  borderRadius = 6,
  className = '' 
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-slate-200 ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        { opacity }
      ]}
    />
  );
}

// ----------------------------------------------------------------------
// SKELETON LAYOUTS (Refined Geometry & Alignment Fixes)
// ----------------------------------------------------------------------

/**
 * Skeleton for dashboard cards
 */
export function DashboardSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      {/* Header section */}
      <View className="mb-8 mt-2">
        <SkeletonBox width={180} height={36} borderRadius={4} className="mb-3" />
        <SkeletonBox width={130} height={18} borderRadius={4} />
      </View>

      {/* Overview Metrics */}
      <View className="mb-8">
        <SkeletonBox width={140} height={22} borderRadius={4} className="mb-4" />
        <View className="flex-col gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-start">
              <SkeletonBox width={40} height={40} borderRadius={20} className="mb-4" />
              <SkeletonBox width={60} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={80} height={28} borderRadius={4} />
            </View>
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-start">
              <SkeletonBox width={40} height={40} borderRadius={20} className="mb-4" />
              <SkeletonBox width={60} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={80} height={28} borderRadius={4} />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-start">
              <SkeletonBox width={40} height={40} borderRadius={20} className="mb-4" />
              <SkeletonBox width={60} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={80} height={28} borderRadius={4} />
            </View>
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm items-start">
              <SkeletonBox width={40} height={40} borderRadius={20} className="mb-4" />
              <SkeletonBox width={60} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={80} height={28} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Game Volume */}
      <View className="mb-8">
        <SkeletonBox width={130} height={22} borderRadius={4} className="mb-4" />
        <View className="flex-row flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-1 min-w-[30%] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm items-center">
              <SkeletonBox width={40} height={10} borderRadius={2} className="mb-2" />
              <SkeletonBox width={30} height={24} borderRadius={4} className="mb-1" />
              <SkeletonBox width={40} height={8} borderRadius={2} />
            </View>
          ))}
        </View>
      </View>

      {/* Chart */}
      <View className="mb-8">
        <SkeletonBox width={160} height={22} borderRadius={4} className="mb-4" />
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <SkeletonBox width="100%" height={220} borderRadius={8} />
        </View>
      </View>

      {/* Performance Scores */}
      <View className="mb-8">
        <SkeletonBox width={170} height={22} borderRadius={4} className="mb-4" />
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-row flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} width={80} height={32} borderRadius={16} />
          ))}
        </View>
      </View>

      {/* Top Openings */}
      <View className="mb-8">
        <SkeletonBox width={140} height={22} borderRadius={4} className="mb-4" />
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          {[1, 2, 3].map((i) => (
            <View key={i} className={`py-3 ${i !== 1 ? 'border-t border-slate-50' : ''} flex-row justify-between items-center`}>
              <View>
                <SkeletonBox width={120} height={18} borderRadius={4} className="mb-2" />
                <SkeletonBox width={60} height={12} borderRadius={4} />
              </View>
              <SkeletonBox width={50} height={24} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Interpretation */}
      <View className="mb-8">
        <SkeletonBox width={150} height={22} borderRadius={4} className="mb-4" />
        <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <SkeletonBox width="100%" height={16} borderRadius={4} className="mb-2" />
          <SkeletonBox width="85%" height={16} borderRadius={4} className="mb-6" />
          <View className="bg-slate-50 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between mb-3">
              <SkeletonBox width={60} height={12} borderRadius={4} />
              <SkeletonBox width={80} height={14} borderRadius={4} />
            </View>
            <View className="flex-row justify-between">
              <SkeletonBox width={60} height={12} borderRadius={4} />
              <SkeletonBox width={80} height={14} borderRadius={4} />
            </View>
          </View>
          <View className="items-center">
            <SkeletonBox width={200} height={10} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Time Control Breakdown */}
      <View className="mb-6">
        <SkeletonBox width={150} height={22} borderRadius={4} className="mb-4" />
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4 flex-row items-center justify-between">
            <View className="w-1/2">
              <SkeletonBox width="80%" height={20} borderRadius={4} className="mb-2" />
              <SkeletonBox width="60%" height={14} borderRadius={4} />
            </View>
            <View className="items-end">
              <SkeletonBox width={50} height={28} borderRadius={4} className="mb-2" />
              <SkeletonBox width={70} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for list items (Refined)
 */
export function ListItemSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3 flex-row items-center">
      <SkeletonBox width={48} height={48} borderRadius={24} className="mr-4" />
      <View className="flex-1">
        <SkeletonBox width="65%" height={18} borderRadius={4} className="mb-2" />
        <SkeletonBox width="45%" height={14} borderRadius={4} />
      </View>
      <SkeletonBox width={30} height={30} borderRadius={15} />
    </View>
  );
}

/**
 * Skeleton for game detail screen
 */
export function GameDetailSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      {/* Match Header */}
      <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-5 items-center">
        <View className="flex-row justify-between w-full mb-6">
          <View className="items-center flex-1">
            <SkeletonBox width={64} height={64} borderRadius={32} className="mb-3" />
            <SkeletonBox width={80} height={16} borderRadius={4} className="mb-2" />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>
          <View className="justify-center items-center px-4">
            <SkeletonBox width={30} height={30} borderRadius={15} />
          </View>
          <View className="items-center flex-1">
            <SkeletonBox width={64} height={64} borderRadius={32} className="mb-3" />
            <SkeletonBox width={80} height={16} borderRadius={4} className="mb-2" />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>
        </View>
        <SkeletonBox width={120} height={24} borderRadius={6} />
      </View>

      {/* Board */}
      <View className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm mb-5 items-center justify-center">
        <SkeletonBox width="100%" height={340} borderRadius={8} />
      </View>

      {/* Game Data */}
      <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <SkeletonBox width={140} height={20} borderRadius={4} className="mb-6" />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row justify-between items-center py-3 border-b border-slate-50">
            <SkeletonBox width={100} height={16} borderRadius={4} />
            <SkeletonBox width={120} height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for profile screen
 */
export function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="p-4">
        {/* Profile Header */}
        <View className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-5 items-center">
          <SkeletonBox width={110} height={110} borderRadius={55} className="mb-5 shadow-sm" />
          <SkeletonBox width={180} height={28} borderRadius={6} className="mb-3" />
          <SkeletonBox width={130} height={16} borderRadius={4} className="mb-5" />
          <SkeletonBox width={80} height={24} borderRadius={12} />
          
          <View className="w-full mt-8 pt-6 border-t border-slate-100 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="flex-row justify-between items-center py-1">
                <SkeletonBox width={90} height={14} borderRadius={4} />
                <SkeletonBox width={110} height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-5">
          <SkeletonBox width={140} height={22} borderRadius={4} className="mb-6" />
          <View className="space-y-4">
            {[1, 2, 3].map((i) => (
              <View key={i} className="flex-row justify-between items-center py-2 border-b border-slate-50">
                <SkeletonBox width={100} height={16} borderRadius={4} />
                <SkeletonBox width={150} height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Settings Block */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <SkeletonBox width={100} height={22} borderRadius={4} className="mb-6" />
          <View className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} width="100%" height={40} borderRadius={8} className="mb-2" />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for openings list screen
 */
export function OpeningsSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      <View className="mb-6 mt-2">
        <SkeletonBox width={200} height={36} borderRadius={4} className="mb-3" />
        <SkeletonBox width={150} height={18} borderRadius={4} />
      </View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
          <SkeletonBox width="60%" height={22} borderRadius={4} className="mb-4" />
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <SkeletonBox width={40} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={50} height={20} borderRadius={4} />
            </View>
            <View className="items-center border-l border-r border-slate-100 px-6">
              <SkeletonBox width={40} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={50} height={20} borderRadius={4} />
            </View>
            <View className="items-center">
              <SkeletonBox width={40} height={14} borderRadius={4} className="mb-2" />
              <SkeletonBox width={50} height={20} borderRadius={4} />
            </View>
          </View>
          <View className="w-full bg-slate-50 h-2 rounded-full mt-2" />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton for archive/game list screens
 */
export function ArchiveSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      <View className="mb-6 mt-2">
        <SkeletonBox width={220} height={36} borderRadius={4} className="mb-3" />
        <SkeletonBox width={140} height={18} borderRadius={4} />
      </View>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ListItemSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Skeleton for search screen results
 */
export function SearchSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      <View className="items-center mb-8 mt-6">
        <SkeletonBox width={110} height={110} borderRadius={55} className="mb-4" />
        <SkeletonBox width={160} height={28} borderRadius={6} className="mb-3" />
        <SkeletonBox width={120} height={16} borderRadius={4} />
      </View>
      <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <SkeletonBox width={120} height={22} borderRadius={4} className="mb-6" />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="mb-5 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
            <View className="flex-row justify-between items-center mb-3">
              <SkeletonBox width={90} height={18} borderRadius={4} />
              <SkeletonBox width={70} height={26} borderRadius={6} />
            </View>
            <SkeletonBox width="100%" height={12} borderRadius={3} className="mb-2" />
            <SkeletonBox width="85%" height={12} borderRadius={3} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for phase analysis screen
 */
export function PhaseAnalysisSkeleton() {
  return (
    <View className="p-4 bg-slate-50 flex-1">
      <View className="mb-8 mt-2">
        <SkeletonBox width={240} height={36} borderRadius={4} className="mb-3" />
        <SkeletonBox width={180} height={18} borderRadius={4} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-8">
          <View className="flex-row items-center mb-4">
            <SkeletonBox width={36} height={36} borderRadius={18} className="mr-3" />
            <SkeletonBox width={170} height={26} borderRadius={4} />
          </View>
          <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <View className="flex-row justify-between mb-4">
              <SkeletonBox width={110} height={18} borderRadius={4} />
              <SkeletonBox width={50} height={26} borderRadius={6} />
            </View>
            <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 pt-4">
              <SkeletonBox width={90} height={16} borderRadius={4} />
              <SkeletonBox width={70} height={26} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
