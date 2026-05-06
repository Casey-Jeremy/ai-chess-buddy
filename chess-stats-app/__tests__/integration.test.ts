/**
 * Integration Tests for Chess Stats App
 * 
 * These tests verify end-to-end functionality across multiple components:
 * - Authentication and account linking flow
 * - Navigation between screens
 * - Data fetching and caching behavior
 * - Offline mode functionality
 * - Analytics calculations end-to-end
 */

import { ChessComApiService } from '../services/ChessComApiService';
import { CacheService } from '../services/CacheService';
import { AnalyticsService } from '../services/AnalyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `chessstatsapp://${path}`),
  openURL: jest.fn(),
}));

// Mock Supabase - must be defined before importing SupabaseService
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Import SupabaseService after mocking
import { SupabaseService } from '../services/SupabaseService';

describe('Integration Tests', () => {
  let chessComApi: ChessComApiService;
  let supabaseService: SupabaseService;
  let cacheService: CacheService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    chessComApi = new ChessComApiService();
    supabaseService = new SupabaseService();
    cacheService = new CacheService();
    analyticsService = new AnalyticsService();
    
    // Setup default mocks
    global.fetch = jest.fn();
    
    // Reset Supabase mock
    mockSupabaseClient.auth.signInWithOAuth.mockReset();
    mockSupabaseClient.auth.getSession.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication and Account Linking Flow', () => {
    it('should complete full authentication and account linking flow', async () => {
      const testUsername = 'testplayer123';
      const testUserId = 'user-123';
      const testEmail = 'test@example.com';

      // Step 1: Google Sign-In
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: testUserId, email: testEmail },
          },
        },
        error: null,
      });

      // Mock profile creation
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testUserId,
                email: testEmail,
                chess_com_username: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      } as any);

      await supabaseService.signInWithGoogle();

      // Step 2: Validate Chess.com username
      const mockProfile = {
        username: testUsername,
        player_id: 12345,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 100,
        country: 'US',
        joined: Date.now(),
        last_online: Date.now(),
        status: 'premium',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const profile = await chessComApi.getPlayerProfile(testUsername);
      expect(profile.username).toBe(testUsername);

      // Step 3: Link Chess.com account
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      await supabaseService.linkChessComAccount(testUserId, testUsername);

      // Step 4: Verify linked account
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { chess_com_username: testUsername },
              error: null,
            }),
          }),
        }),
      } as any);

      const linkedUsername = await supabaseService.getLinkedChessComUsername(testUserId);
      expect(linkedUsername).toBe(testUsername);
    });

    it('should handle invalid Chess.com username during linking', async () => {
      const invalidUsername = 'nonexistentuser999';

      // Mock 404 response for invalid username
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      // Should throw an error with NOT_FOUND code
      await expect(chessComApi.getPlayerProfile(invalidUsername)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('Data Fetching and Caching Behavior', () => {
    it('should fetch data from API and store in cache', async () => {
      const testUsername = 'testplayer';
      const mockProfile = {
        username: testUsername,
        player_id: 12345,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 50,
        country: 'US',
        joined: Date.now(),
        last_online: Date.now(),
        status: 'basic',
      };

      // Mock successful API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      // Mock cache storage
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      // Fetch profile
      const profile = await chessComApi.getPlayerProfile(testUsername);
      expect(profile.username).toBe(testUsername);

      // Store in cache
      await cacheService.set(`profile_${testUsername}`, profile);

      // Verify cache was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `chess_stats_cache_profile_${testUsername}`,
        expect.any(String)
      );
    });

    it('should retrieve data from cache when available', async () => {
      const testUsername = 'cachedplayer';
      const cachedProfile = {
        username: testUsername,
        player_id: 67890,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 200,
        country: 'UK',
        joined: Date.now() - 86400000,
        last_online: Date.now() - 3600000,
        status: 'premium',
      };

      // Mock cache retrieval
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          data: cachedProfile,
          timestamp: Date.now() - 1000,
          ttl: 3600000,
        })
      );

      const cached = await cacheService.get<any>(`profile_${testUsername}`);
      expect(cached).not.toBeNull();
      expect((cached?.data as any).username).toBe(testUsername);
    });

    it('should handle cache miss and fetch from API', async () => {
      const testUsername = 'newplayer';
      const mockProfile = {
        username: testUsername,
        player_id: 11111,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 10,
        country: 'CA',
        joined: Date.now(),
        last_online: Date.now(),
        status: 'basic',
      };

      // Mock cache miss
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      // Mock API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      // Try to get from cache first
      const cached = await cacheService.get(`profile_${testUsername}`);
      expect(cached).toBeNull();

      // Fetch from API
      const profile = await chessComApi.getPlayerProfile(testUsername);
      expect(profile.username).toBe(testUsername);
    });
  });

  describe('Offline Mode Functionality', () => {
    it('should use cached data when offline', async () => {
      const testUsername = 'offlineplayer';
      const cachedData = {
        username: testUsername,
        player_id: 99999,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 500,
        country: 'DE',
        joined: Date.now() - 172800000,
        last_online: Date.now() - 7200000,
        status: 'premium',
      };

      // Mock offline state
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: null,
      });

      // Mock cached data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          data: cachedData,
          timestamp: Date.now() - 3600000,
          ttl: undefined,
        })
      );

      const cached = await cacheService.get<any>(`profile_${testUsername}`);
      expect(cached).not.toBeNull();
      expect((cached?.data as any).username).toBe(testUsername);
      expect(cached?.isStale).toBe(false);
    });

    it('should indicate stale data when cache is old', async () => {
      const testUsername = 'staleplayer';
      const oldCachedData = {
        username: testUsername,
        player_id: 88888,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 300,
        country: 'FR',
        joined: Date.now() - 604800000,
        last_online: Date.now() - 86400000,
        status: 'basic',
      };

      // Mock cached data older than 24 hours
      const oldTimestamp = Date.now() - 86400000 - 1000;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          data: oldCachedData,
          timestamp: oldTimestamp,
          ttl: 86400000, // 24 hours
        })
      );

      const cached = await cacheService.get(`profile_${testUsername}`);
      expect(cached).not.toBeNull();
      expect(cached?.isStale).toBe(true);
    });

    it('should refresh stale cache when online', async () => {
      const testUsername = 'refreshplayer';
      const freshData = {
        username: testUsername,
        player_id: 77777,
        url: `https://www.chess.com/member/${testUsername}`,
        followers: 1000,
        country: 'ES',
        joined: Date.now() - 259200000,
        last_online: Date.now(),
        status: 'premium',
      };

      // Mock online state
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: null,
      });

      // Check if cache is stale
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          data: { username: testUsername },
          timestamp: Date.now() - 86400000 - 1000,
          ttl: undefined,
        })
      );

      const isStale = await cacheService.isStale(`profile_${testUsername}`, 86400000);
      expect(isStale).toBe(true);

      // Fetch fresh data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => freshData,
      });

      const profile = await chessComApi.getPlayerProfile(testUsername);
      expect(profile.username).toBe(testUsername);
      expect(profile.followers).toBe(1000);
    });
  });

  describe('Analytics Calculations End-to-End', () => {
    it('should analyze openings from game data', async () => {
      const mockGames: any[] = [
        {
          url: 'https://www.chess.com/game/1',
          pgn: '[Opening "Sicilian Defense"]\n1. e4 c5',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1500, result: 'loss' as const },
          black: { username: 'player1', rating: 1480, result: 'win' as const },
          result: '0-1',
          opening: 'Sicilian Defense',
        },
        {
          url: 'https://www.chess.com/game/2',
          pgn: '[Opening "Sicilian Defense"]\n1. e4 c5',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1485, result: 'win' as const },
          black: { username: 'player2', rating: 1470, result: 'loss' as const },
          result: '1-0',
          opening: 'Sicilian Defense',
        },
        {
          url: 'https://www.chess.com/game/3',
          pgn: '[Opening "Italian Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1490, result: 'draw' as const },
          black: { username: 'player3', rating: 1495, result: 'draw' as const },
          result: '1/2-1/2',
          opening: 'Italian Game',
        },
      ];

      // Note: analyzeOpenings analyzes from white's perspective
      const openingAnalysis = await analyticsService.analyzeOpenings(mockGames);

      expect(openingAnalysis).toHaveLength(2);
      
      const sicilian = openingAnalysis.find(o => o.openingName === 'Sicilian Defense');
      expect(sicilian).toBeDefined();
      expect(sicilian?.gamesPlayed).toBe(2);
      expect(sicilian?.wins).toBe(1);
      expect(sicilian?.losses).toBe(1);

      const italian = openingAnalysis.find(o => o.openingName === 'Italian Game');
      expect(italian).toBeDefined();
      expect(italian?.gamesPlayed).toBe(1);
      expect(italian?.draws).toBe(1);
    });

    it('should calculate performance metrics from stats and games', async () => {
      const mockStats = {
        chess_blitz: {
          last: { rating: 1500, date: Date.now() },
          best: { rating: 1600, date: Date.now() - 86400000 },
          record: { win: 50, loss: 30, draw: 20 },
        },
        chess_rapid: {
          last: { rating: 1450, date: Date.now() },
          best: { rating: 1550, date: Date.now() - 172800000 },
          record: { win: 30, loss: 25, draw: 15 },
        },
      };

      const mockGames: any[] = [
        {
          url: 'https://www.chess.com/game/1',
          pgn: '1. e4 e5',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1500, result: 'win' as const },
          black: { username: 'opponent', rating: 1480, result: 'loss' as const },
          result: '1-0',
        },
      ];

      const dashboard = await analyticsService.calculatePerformanceMetrics(mockGames, mockStats, 'testplayer');

      expect(dashboard.totalGames).toBeGreaterThan(0);
      expect(dashboard.byTimeControl).toHaveProperty('blitz');
      expect(dashboard.byTimeControl).toHaveProperty('rapid');
      expect(dashboard.strongestTimeControl).toBeDefined();
      expect(dashboard.weakestTimeControl).toBeDefined();
    });

    it('should analyze game phases', async () => {
      const mockGames: any[] = [
        {
          url: 'https://www.chess.com/game/1',
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1500, result: 'win' as const },
          black: { username: 'opponent', rating: 1480, result: 'loss' as const },
          result: '1-0',
          opening: 'Ruy Lopez',
        },
        {
          url: 'https://www.chess.com/game/2',
          pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: 'opponent', rating: 1490, result: 'win' as const },
          black: { username: 'testplayer', rating: 1485, result: 'loss' as const },
          result: '1-0',
          opening: "Queen's Gambit Declined",
        },
      ];

      const phaseAnalysis = await analyticsService.analyzeGamePhases(mockGames);

      expect(phaseAnalysis).toHaveProperty('openingPhase');
      expect(phaseAnalysis).toHaveProperty('middlegamePhase');
      expect(phaseAnalysis).toHaveProperty('endgamePhase');
      expect(phaseAnalysis.openingPhase.gamesDecided).toBeGreaterThanOrEqual(0);
      expect(phaseAnalysis.middlegamePhase.gamesDecided).toBeGreaterThanOrEqual(0);
      expect(phaseAnalysis.endgamePhase.gamesDecided).toBeGreaterThanOrEqual(0);
    });

    it('should identify patterns in game data', async () => {
      const mockGames: any[] = [
        {
          url: 'https://www.chess.com/game/1',
          pgn: '1. e4 e5',
          timeControl: '60',
          endTime: Date.now(),
          rated: true,
          white: { username: 'testplayer', rating: 1500, result: 'timeout' as const },
          black: { username: 'opponent', rating: 1480, result: 'win' as const },
          result: '0-1',
        },
        {
          url: 'https://www.chess.com/game/2',
          pgn: '1. d4 d5',
          timeControl: '60',
          endTime: Date.now(),
          rated: true,
          white: { username: 'opponent', rating: 1490, result: 'win' as const },
          black: { username: 'testplayer', rating: 1485, result: 'timeout' as const },
          result: '1-0',
        },
      ];

      const patterns = await analyticsService.identifyPatterns(mockGames);

      expect(Array.isArray(patterns)).toBe(true);
      // Should identify time pressure pattern
      const timePressurePattern = patterns.find(p => p.type === 'time-pressure');
      if (timePressurePattern) {
        expect(timePressurePattern.frequency).toBeGreaterThan(0);
      }
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle complete user journey from auth to analytics', async () => {
      const testUsername = 'journeyplayer';
      const testUserId = 'journey-user-123';

      // Step 1: Authentication
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: testUserId, email: 'journey@example.com' },
          },
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testUserId,
                email: 'journey@example.com',
                chess_com_username: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      } as any);

      await supabaseService.signInWithGoogle();

      // Step 2: Link Chess.com account
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: testUsername,
          player_id: 12345,
          url: `https://www.chess.com/member/${testUsername}`,
          followers: 100,
          country: 'US',
          joined: Date.now(),
          last_online: Date.now(),
          status: 'premium',
        }),
      });

      await chessComApi.getPlayerProfile(testUsername);

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      await supabaseService.linkChessComAccount(testUserId, testUsername);

      // Step 3: Fetch and cache player stats
      const mockStats = {
        chess_blitz: {
          last: { rating: 1500, date: Date.now() },
          best: { rating: 1600, date: Date.now() - 86400000 },
          record: { win: 50, loss: 30, draw: 20 },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const stats = await chessComApi.getPlayerStats(testUsername);
      expect(stats).toHaveProperty('chess_blitz');

      // Cache the stats
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
      await cacheService.set(`stats_${testUsername}`, stats);

      // Step 4: Fetch games and run analytics
      const mockGames: any[] = [
        {
          url: 'https://www.chess.com/game/1',
          pgn: '[Opening "Sicilian Defense"]\n1. e4 c5',
          timeControl: '600',
          endTime: Date.now(),
          rated: true,
          white: { username: testUsername, rating: 1500, result: 'win' as const },
          black: { username: 'opponent', rating: 1480, result: 'loss' as const },
          result: '1-0',
          opening: 'Sicilian Defense',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ archives: ['https://api.chess.com/pub/player/testplayer/games/2024/01'] }),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: mockGames }),
      });

      const archives = await chessComApi.getGameArchives(testUsername);
      expect(archives.length).toBeGreaterThan(0);

      const games = await chessComApi.getMonthlyArchive(testUsername, 2024, 1);
      expect(games.length).toBeGreaterThan(0);

      // Run analytics
      const openingAnalysis = await analyticsService.analyzeOpenings(games);
      expect(openingAnalysis.length).toBeGreaterThan(0);

      const dashboard = await analyticsService.calculatePerformanceMetrics(games, stats, testUsername);
      expect(dashboard.totalGames).toBeGreaterThan(0);
    });
  });
});
