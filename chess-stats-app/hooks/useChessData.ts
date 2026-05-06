import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import chessComApiService from '../services/ChessComApiService';
import analyticsService from '../services/AnalyticsService';
import cacheService from '../services/CacheService';
import {
  PlayerProfile,
  PlayerStats,
  Game,
  OpeningAnalysis,
  PhaseAnalysis,
  PerformanceDashboard,
  ImprovementSuggestion,
} from '../types';

// Query key factory for consistent key management
export const chessQueryKeys = {
  all: ['chess'] as const,
  playerProfile: (username: string) => [...chessQueryKeys.all, 'profile', username] as const,
  playerStats: (username: string) => [...chessQueryKeys.all, 'stats', username] as const,
  gameArchives: (username: string) => [...chessQueryKeys.all, 'archives', username] as const,
  monthlyArchive: (username: string, year: number, month: number) =>
    [...chessQueryKeys.all, 'archive', username, year, month] as const,
  recentGames: (username: string) => [...chessQueryKeys.all, 'recentGames', username] as const,
  currentGames: (username: string) => [...chessQueryKeys.all, 'currentGames', username] as const,
  openingAnalysis: (username: string) => [...chessQueryKeys.all, 'openings', username] as const,
  phaseAnalysis: (username: string) => [...chessQueryKeys.all, 'phases', username] as const,
  dashboard: (username: string) => [...chessQueryKeys.all, 'dashboard', username] as const,
  suggestions: (username: string) => [...chessQueryKeys.all, 'suggestions', username] as const,
};

interface UsePlayerProfileOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch current active games from /games endpoint
 */
export function useCurrentGames(username: string | null | undefined, options?: UsePlayerProfileOptions) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.currentGames(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const cacheKey = `current_games_${username}`;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      const cached = await cacheService.get<Game[]>(cacheKey);

      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        return [];
      }

      if (cached && !cached.isStale) {
        return cached.data;
      }

      const payload = await chessComApiService.getPlayerGames(username);
      const data = payload.games || [];
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount) => {
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch player profile with caching
 * Requirements: 2.1, 2.5, 6.1, 6.2, 6.4
 */
export function usePlayerProfile(username: string | null | undefined, options?: UsePlayerProfileOptions) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.playerProfile(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const cacheKey = `profile_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first (cache-first strategy)
      const cached = await cacheService.get<PlayerProfile>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        // Background refresh if stale (older than 24 hours)
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Fetch fresh data when online
      const data = await chessComApiService.getPlayerProfile(username);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      // Don't retry if offline
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch player statistics with caching
 * Requirements: 2.3, 2.5, 6.1, 6.2, 6.3, 6.4
 */
export function usePlayerStats(username: string | null | undefined, options?: UsePlayerProfileOptions) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.playerStats(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const cacheKey = `stats_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first (cache-first strategy)
      const cached = await cacheService.get<PlayerStats>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Fetch fresh data when online
      const data = await chessComApiService.getPlayerStats(username);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch game archives list
 * Requirements: 3.1, 2.5, 6.1, 6.2, 6.4
 */
export function useGameArchives(username: string | null | undefined, options?: UsePlayerProfileOptions) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.gameArchives(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const cacheKey = `archives_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first (cache-first strategy)
      const cached = await cacheService.get<string[]>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Fetch fresh data when online
      const data = await chessComApiService.getGameArchives(username);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch games for a specific month
 * Requirements: 3.2, 2.5, 6.1, 6.2, 6.4
 */
export function useMonthlyArchive(
  username: string | null | undefined,
  year: number | null | undefined,
  month: number | null | undefined,
  options?: UsePlayerProfileOptions
) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.monthlyArchive(username || '', year || 0, month || 0),
    queryFn: async () => {
      if (!username || !year || !month) throw new Error('Username, year, and month are required');

      const cacheKey = `archive_${username}_${year}_${month}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first (cache-first strategy)
      const cached = await cacheService.get<Game[]>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Fetch fresh data when online
      const data = await chessComApiService.getMonthlyArchive(username, year, month);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && !!year && !!month && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch recent games (last 3 months)
 * Requirements: 2.5, 6.1, 6.2, 6.3, 6.4
 */
export function useRecentGames(username: string | null | undefined, options?: UsePlayerProfileOptions) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.recentGames(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const cacheKey = `recent_games_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first (cache-first strategy)
      const cached = await cacheService.get<Game[]>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Fetch archives and get recent games
      const archives = await chessComApiService.getGameArchives(username);

      // Get last 3 months of games
      const recentArchives = archives.slice(-3);
      const gamesPromises = recentArchives.map(async (archiveUrl) => {
        const parts = archiveUrl.split('/');
        const year = parseInt(parts[parts.length - 2]);
        const month = parseInt(parts[parts.length - 1]);
        return chessComApiService.getMonthlyArchive(username, year, month);
      });

      const gamesArrays = await Promise.all(gamesPromises);
      const allGames = gamesArrays.flat();

      await cacheService.set(cacheKey, allGames, maxAge);
      return allGames;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      if (!isOnline) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to analyze openings from games
 * Requirements: 9.1, 9.2, 9.3, 6.1, 6.2
 */
export function useOpeningAnalysis(
  username: string | null | undefined,
  games: Game[] | undefined,
  options?: UsePlayerProfileOptions
) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.openingAnalysis(username || ''),
    queryFn: async () => {
      if (!games || games.length === 0) return [];

      const cacheKey = `openings_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first
      const cached = await cacheService.get<OpeningAnalysis[]>(cacheKey);
      
      // If offline, return cached data or compute from games
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        // Compute analytics offline from games data
        return await analyticsService.analyzeOpenings(games);
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Analyze openings
      const data = await analyticsService.analyzeOpenings(games);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && !!games && games.length > 0 && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to analyze game phases
 * Requirements: 11.1, 11.2, 6.1, 6.2
 */
export function usePhaseAnalysis(
  username: string | null | undefined,
  games: Game[] | undefined,
  options?: UsePlayerProfileOptions
) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.phaseAnalysis(username || ''),
    queryFn: async () => {
      if (!games || games.length === 0) {
        return {
          openingPhase: { gamesDecided: 0, winRate: 0, commonPatterns: [], exampleGames: [] },
          middlegamePhase: { gamesDecided: 0, winRate: 0, commonPatterns: [], exampleGames: [] },
          endgamePhase: { gamesDecided: 0, winRate: 0, commonPatterns: [], exampleGames: [] },
        };
      }

      const cacheKey = `phases_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first
      const cached = await cacheService.get<PhaseAnalysis>(cacheKey);
      
      // If offline, return cached data or compute from games
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        // Compute analytics offline from games data
        return await analyticsService.analyzeGamePhases(games);
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Analyze phases
      const data = await analyticsService.analyzeGamePhases(games);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && !!games && games.length > 0 && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to calculate performance dashboard metrics
 * Requirements: 10.1, 10.2, 2.5, 6.1, 6.2
 */
export function useDashboard(
  username: string | null | undefined,
  games: Game[] | undefined,
  stats: PlayerStats | undefined,
  options?: UsePlayerProfileOptions
) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.dashboard(username || ''),
    queryFn: async () => {
      if (!games || !username) return null;

      const cacheKey = `dashboard_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first
      const cached = await cacheService.get<PerformanceDashboard>(cacheKey);
      
      // If offline, return cached data or compute from games
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        // Compute analytics offline from games data
        return await analyticsService.calculatePerformanceMetrics(games, stats, username);
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Calculate metrics
      const data = await analyticsService.calculatePerformanceMetrics(games, stats, username);
      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to generate AI improvement suggestions
 * Requirements: 11.3, 11.4, 6.1, 6.2
 */
export function useImprovementSuggestions(
  username: string | null | undefined,
  games: Game[] | undefined,
  options?: UsePlayerProfileOptions
) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.suggestions(username || ''),
    queryFn: async () => {
      if (!games || games.length === 0) return [];

      const cacheKey = `suggestions_${username}`;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Try cache first
      const cached = await cacheService.get<ImprovementSuggestion[]>(cacheKey);
      
      // If offline, return cached data or empty array (AI requires network)
      if (!isOnline) {
        if (cached) {
          return cached.data;
        }
        // AI suggestions require network, return empty array
        return [];
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        const isStale = await cacheService.isStale(cacheKey, maxAge);
        if (!isStale) {
          return cached.data;
        }
      }

      // Generate suggestions (requires network for AI)
      const openingAnalysis = await analyticsService.analyzeOpenings(games);
      const phaseAnalysis = await analyticsService.analyzeGamePhases(games);
      const data = await analyticsService.generateImprovementSuggestions(
        games,
        phaseAnalysis,
        openingAnalysis
      );

      await cacheService.set(cacheKey, data, maxAge);
      return data;
    },
    enabled: !!username && !!games && games.length > 0 && (options?.enabled !== false),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook to invalidate all cache for a user
 * Useful for manual refresh operations
 */
export function useInvalidateUserCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      // Clear React Query cache
      await queryClient.invalidateQueries({ queryKey: chessQueryKeys.all });

      // Clear AsyncStorage cache
      await cacheService.clear();
    },
  });
}
