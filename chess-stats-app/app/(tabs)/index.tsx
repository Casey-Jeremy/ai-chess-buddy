import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import {
  usePlayerStats,
  useRecentGames,
  useImprovementSuggestions,
  useCurrentGames,
  useInvalidateUserCache,
} from '../../hooks/useChessData';
import MetricCard from '../../components/MetricCard';
import PerformanceChart from '../../components/PerformanceChart';
import ImprovementSuggestionCard from '../../components/ImprovementSuggestionCard';
import OfflineIndicator from '../../components/OfflineIndicator';
import ErrorMessage from '../../components/ErrorMessage';
import { DashboardSkeleton } from '../../components/SkeletonScreen';
import analyticsService from '../../services/AnalyticsService';

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'text-green-700 bg-green-100';
  if (score >= 45) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);
  const invalidateCache = useInvalidateUserCache();

  // Fetch player stats using custom hook
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = 
    usePlayerStats(user?.chessComUsername);

  // Fetch recent games using custom hook
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = 
    useRecentGames(user?.chessComUsername);
  const { data: currentGames } = useCurrentGames(user?.chessComUsername);

  // Calculate performance metrics locally to avoid cache/dependency issues
  const [dashboard, setDashboard] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  React.useEffect(() => {
    // We only need games and username to calculate basic metrics
    if (games && games.length > 0 && user?.chessComUsername) {
      setDashboardLoading(true);
      analyticsService.calculatePerformanceMetrics(games, stats, user.chessComUsername)
        .then(data => {
          if (!data) {
            console.warn('calculatePerformanceMetrics returned null, using empty dashboard');
            setDashboard({ totalGames: 0 });
            setDashboardLoading(false);
            return;
          }
          setDashboard(data);
          setDashboardLoading(false);
        })
        .catch(err => {
          console.error('Error calculating dashboard:', err);
          setDashboard({ totalGames: 0 });
          setDashboardLoading(false);
        });
    } else if (games && games.length === 0) {
      setDashboard({ totalGames: 0 });
      setDashboardLoading(false);
    }
  }, [games, stats, user?.chessComUsername]);

  // Generate AI improvement suggestions using custom hook
  const { data: suggestions, isLoading: suggestionsLoading } = 
    useImprovementSuggestions(user?.chessComUsername, games);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchGames()]);
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetchStats();
    refetchGames();
  };
  const formatLastUpdated = (timestamp: number | null): string => {
    if (!timestamp) return 'No games yet';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">No Chess.com Account Linked</Text>
        <Text className="text-gray-600 text-center">
          Please link your Chess.com account to view your dashboard
        </Text>
      </View>
    );
  }

  const isLoading = statsLoading || gamesLoading || dashboardLoading;
  const hasError = statsError || gamesError;

  // Show skeleton screen on initial load
  // Requirements: 8.3
  if (isLoading && !dashboard) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <ScrollView className="flex-1">
          <DashboardSkeleton />
        </ScrollView>
      </View>
    );
  }

  // Show error message with retry
  // Requirements: 2.5, 4.5
  if (hasError && !dashboard) {
    return (
      <View className="flex-1 bg-slate-50">
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={statsError || gamesError}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <OfflineIndicator isVisible={isOffline} />
      <ScrollView
        testID="dashboard-screen"
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-8 mt-2">
            <Text testID="dashboard-title" className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</Text>
            <Text testID="dashboard-username" className="text-slate-500 text-lg font-medium mt-1">@{user.chessComUsername}</Text>
          </View>

          {/* Show error inline if we have cached data */}
          {hasError && dashboard && (
            <ErrorMessage
              error={statsError || gamesError}
              onRetry={handleRetry}
              inline
              className="mb-6"
            />
          )}

          {/* Dashboard Data */}
          {dashboard && dashboard.totalGames !== undefined ? (
            <>
              {/* Overview Metrics */}
              <View className="mb-8">
                <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Overview</Text>
                <View className="flex-row flex-wrap gap-3">
                  <MetricCard
                    label="Rapid Games"
                    value={(dashboard.rapidGames || 0).toString()}
                    icon="chess-pawn"
                    iconColor="#6366f1"
                    iconBgColor="bg-indigo-50"
                    className="w-[47%]"
                  />
                  <MetricCard
                    label="Total Wins"
                    value={(dashboard.totalWins || 0).toString()}
                    icon="trophy"
                    iconColor="#f59e0b"
                    iconBgColor="bg-amber-50"
                    className="w-[47%]"
                  />
                  <MetricCard
                    label="Overall Win Rate"
                    value={`${(dashboard.overallWinRate || 0).toFixed(1)}%`}
                    icon="trophy-outline"
                    iconColor="#10b981"
                    iconBgColor="bg-emerald-50"
                    className="w-[47%]"
                  />
                  <MetricCard
                    label="Draw Rate"
                    value={`${(dashboard.drawRate || 0).toFixed(1)}%`}
                    icon="equal"
                    iconColor="#64748b"
                    iconBgColor="bg-slate-100"
                    className="w-[47%]"
                  />
                </View>
                
                <View className="flex-row flex-wrap gap-3 mt-3">
                  <MetricCard
                    label="White Win"
                    value={`${(dashboard.whiteWinRate || 0).toFixed(1)}%`}
                    icon="circle-outline"
                    iconColor="#94a3b8"
                    className="flex-1"
                  />
                  <MetricCard
                    label="Black Win"
                    value={`${(dashboard.blackWinRate || 0).toFixed(1)}%`}
                    icon="circle"
                    iconColor="#1e293b"
                    className="flex-1"
                  />
                  <MetricCard
                    label="Loss Rate"
                    value={`${(dashboard.lossRate || 0).toFixed(1)}%`}
                    icon="close-circle-outline"
                    iconColor="#ef4444"
                    iconBgColor="bg-red-50"
                    className="flex-1"
                  />
                </View>
              </View>

              {/* Game Volume Statistics */}
              <View className="mb-8">
                <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Game Volume</Text>
                <View className="flex-row flex-wrap gap-3">
                  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Blitz</Text>
                    <Text className="text-2xl font-black text-slate-900">{dashboard.blitzGames || 0}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-1">GAMES</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Bullet</Text>
                    <Text className="text-2xl font-black text-slate-900">{dashboard.bulletGames || 0}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-1">GAMES</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Daily</Text>
                    <Text className="text-2xl font-black text-slate-900">{dashboard.dailyGames || 0}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-1">GAMES</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total</Text>
                    <Text className="text-2xl font-black text-indigo-600">{dashboard.totalGames || 0}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-1">TRACKED</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[45%] items-center">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active</Text>
                    <Text className="text-2xl font-black text-emerald-600">{currentGames?.length || 0}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-1">CURRENT</Text>
                  </View>
                </View>
              </View>

              {/* Rating Trend Chart */}
              {dashboard.ratingTrend && dashboard.ratingTrend.length > 0 && (
                <View className="mb-8">
                  <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Rating Trend</Text>
                  <PerformanceChart data={dashboard.ratingTrend} />
                </View>
              )}

              {/* Performance Scores */}
              {dashboard.skillScores && (
                <View className="mb-8">
                  <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Performance Scores</Text>
                  <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <View className="flex-row flex-wrap gap-2">
                      {dashboard.skillScores.map((skill: any) => (
                        <View key={skill.key} className={`px-4 py-2 rounded-full border ${getScoreBadgeColor(skill.score)}`}>
                          <Text className="text-xs font-bold uppercase tracking-wider">
                            {skill.label}: {skill.score}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Top Openings */}
              {dashboard.topOpenings && dashboard.topOpenings.length > 0 && (
                <View className="mb-8">
                  <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Top Openings</Text>
                  <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    {dashboard.topOpenings.map((opening: any, idx: number) => (
                      <View key={`${opening.eco}_${opening.openingName}`} className={`py-3 ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-4">
                            <Text className="text-slate-900 font-bold text-base">
                              {opening.eco ? `${opening.eco} ` : ''}{opening.openingName}
                            </Text>
                            <Text className="text-slate-500 text-xs font-medium uppercase mt-0.5">
                              {opening.games} {opening.games === 1 ? 'game' : 'games'}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-indigo-600 font-black text-lg">{opening.winRate.toFixed(1)}%</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase">Win Rate</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Interpretation */}
              <View className="mb-8">
                <Text className="text-xl font-bold text-slate-900 mb-4 px-1">Interpretation</Text>
                <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <Text className="text-slate-600 leading-relaxed mb-4">
                    Analysis reveals strengths in <Text className="text-slate-900 font-bold">{dashboard.strongestTimeControl || 'various'}</Text> games.
                  </Text>
                  
                  <View className="bg-slate-50 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between mb-3 border-b border-slate-200/50 pb-2">
                      <Text className="text-slate-500 font-semibold text-xs uppercase">Strongest</Text>
                      <Text className="text-slate-900 font-bold capitalize">{dashboard.strongestTimeControl || '-'}</Text>
                    </View>
                    <View className="flex-row justify-between mb-3 border-b border-slate-200/50 pb-2">
                      <Text className="text-slate-500 font-semibold text-xs uppercase">Weakest</Text>
                      <Text className="text-slate-900 font-bold capitalize">{dashboard.weakestTimeControl || '-'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-500 font-semibold text-xs uppercase">Win/Loss Ratio</Text>
                      <Text className="text-slate-900 font-bold">
                        {(dashboard.overallWinRate / (dashboard.lossRate || 1)).toFixed(2)}x
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-400 text-[11px] font-medium text-center uppercase">
                    BASED ON {dashboard.totalGames || 0} RECENT GAMES • LAST UPDATED {formatLastUpdated(dashboard.lastGameAt).toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Time Control Breakdown */}
              {dashboard.byTimeControl && (
                <View className="mb-8">
                  <Text className="text-xl font-bold text-slate-900 mb-4 px-1">By Time Control</Text>
                  <View className="gap-4">
                    {Object.entries(dashboard.byTimeControl).map(([timeControl, metrics]: [string, any]) => (
                      metrics.games > 0 && (
                        <View key={timeControl} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-900 capitalize mb-1">
                              {timeControl}
                            </Text>
                            <View className="flex-row items-center mb-3">
                              <Text className="text-slate-500 text-xs font-semibold mr-3">GAMES: {metrics.games}</Text>
                              <Text className="text-slate-500 text-xs font-semibold">RATING: {metrics.currentRating}</Text>
                            </View>
                            <View className="flex-row items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                              <View className="flex-row gap-3">
                                <Text className="text-emerald-600 font-bold text-xs">{metrics.wins}W</Text>
                                <Text className="text-rose-600 font-bold text-xs">{metrics.losses}L</Text>
                                <Text className="text-slate-500 font-bold text-xs">{metrics.draws}D</Text>
                              </View>
                              <Text className="text-indigo-600 font-black">
                                {metrics.winRate.toFixed(1)}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm items-center justify-center mb-8">
              <ActivityIndicator size="small" color="#6366f1" />
              <Text className="text-slate-500 font-medium mt-3">Preparing your dashboard...</Text>
            </View>
          )}

          {/* AI Improvement Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold text-slate-900 mb-4 px-1">
                AI Insights
              </Text>
              {suggestionsLoading ? (
                <View className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm items-center justify-center">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-slate-500 font-medium mt-3">Analyzing your games...</Text>
                </View>
              ) : (
                <View className="gap-4">
                  {suggestions.map((suggestion, index) => (
                    <ImprovementSuggestionCard key={index} suggestion={suggestion} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
