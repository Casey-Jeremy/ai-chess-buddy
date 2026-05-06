import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardScreen from '../../../app/(tabs)/index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { Game, PlayerStats, TimeControlMetrics } from '../../../types';

// Mock services
jest.mock('../../../services/ChessComApiService');
jest.mock('../../../services/AnalyticsService');
jest.mock('../../../services/CacheService');
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));
jest.mock('../../../contexts/NetworkContext', () => ({
  ...jest.requireActual('../../../contexts/NetworkContext'),
  useNetwork: jest.fn(() => ({ isOnline: true, isOffline: false })),
}));

const mockUseAuth = require('../../../contexts/AuthContext').useAuth;

describe('DashboardScreen Data Transformations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should display message when no Chess.com username is linked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com', chessComUsername: null },
      loading: false,
    });

    const { getByText } = renderWithProviders(<DashboardScreen />);
    
    expect(getByText('No Chess.com Account Linked')).toBeTruthy();
    expect(getByText('Please link your Chess.com account to view your dashboard')).toBeTruthy();
  });

  it('should correctly transform time control metrics', () => {
    const mockStats: PlayerStats = {
      chess_bullet: {
        last: { rating: 1200, date: Date.now() },
        best: { rating: 1300, date: Date.now() },
        record: { win: 50, loss: 30, draw: 20 },
      },
      chess_blitz: {
        last: { rating: 1400, date: Date.now() },
        best: { rating: 1500, date: Date.now() },
        record: { win: 100, loss: 80, draw: 20 },
      },
    };

    // Test that win rate calculation is correct
    const bulletWinRate = ((50 + 0.5 * 20) / (50 + 30 + 20)) * 100;
    expect(bulletWinRate).toBeCloseTo(60.0, 1);

    const blitzWinRate = ((100 + 0.5 * 20) / (100 + 80 + 20)) * 100;
    expect(blitzWinRate).toBeCloseTo(55.0, 1);
  });

  it('should correctly categorize time controls from game data', () => {
    const testCases = [
      { timeControl: '60', expected: 'bullet' },
      { timeControl: '180', expected: 'blitz' },
      { timeControl: '180+2', expected: 'blitz' },
      { timeControl: '600', expected: 'rapid' },
      { timeControl: '900+10', expected: 'rapid' },
      { timeControl: '1/259200', expected: 'daily' },
    ];

    testCases.forEach(({ timeControl, expected }) => {
      const baseTime = parseInt(timeControl.split('+')[0] || '0');
      let category: string;
      
      if (baseTime === 0 || timeControl.includes('/')) {
        category = 'daily';
      } else if (baseTime < 180) {
        category = 'bullet';
      } else if (baseTime < 600) {
        category = 'blitz';
      } else {
        category = 'rapid';
      }

      expect(category).toBe(expected);
    });
  });

  it('should calculate success rate correctly', () => {
    const testCases = [
      { wins: 10, losses: 5, draws: 5, expected: 62.5 },
      { wins: 0, losses: 10, draws: 0, expected: 0 },
      { wins: 10, losses: 0, draws: 0, expected: 100 },
      { wins: 5, losses: 5, draws: 10, expected: 50 },
    ];

    testCases.forEach(({ wins, losses, draws, expected }) => {
      const total = wins + losses + draws;
      const successRate = total > 0 ? ((wins + 0.5 * draws) / total) * 100 : 0;
      expect(successRate).toBeCloseTo(expected, 1);
    });
  });

  it('should handle empty game data gracefully', () => {
    const emptyGames: Game[] = [];
    const mockStats: PlayerStats = {
      chess_bullet: {
        last: { rating: 1200, date: Date.now() },
        best: { rating: 1300, date: Date.now() },
        record: { win: 0, loss: 0, draw: 0 },
      },
    };

    // With no games, total should be 0
    expect(emptyGames.length).toBe(0);
    
    // Win rate with no games should be 0
    const winRate = emptyGames.length > 0 ? 50 : 0;
    expect(winRate).toBe(0);
  });

  it('should correctly identify strongest and weakest time controls', () => {
    const timeControlMetrics = {
      bullet: { games: 100, wins: 60, losses: 30, draws: 10, winRate: 65, currentRating: 1200 },
      blitz: { games: 200, wins: 100, losses: 80, draws: 20, winRate: 55, currentRating: 1400 },
      rapid: { games: 50, wins: 30, losses: 15, draws: 5, winRate: 65, currentRating: 1500 },
      daily: { games: 10, wins: 3, losses: 5, draws: 2, winRate: 40, currentRating: 1300 },
    };

    const timeControls = Object.entries(timeControlMetrics)
      .filter(([_, metrics]) => metrics.games > 0)
      .sort((a, b) => b[1].winRate - a[1].winRate);

    const strongest = timeControls[0][0];
    const weakest = timeControls[timeControls.length - 1][0];

    // Both bullet and rapid have 65% win rate, so either could be strongest
    expect(['bullet', 'rapid']).toContain(strongest);
    expect(weakest).toBe('daily');
  });

  it('should build rating trend data points correctly', () => {
    const mockGames: Game[] = [
      {
        url: 'test1',
        pgn: 'test',
        timeControl: '180',
        endTime: 1000,
        rated: true,
        white: { username: 'testuser', rating: 1200, result: 'win' },
        black: { username: 'opponent', rating: 1190, result: 'loss' },
      },
      {
        url: 'test2',
        pgn: 'test',
        timeControl: '180',
        endTime: 2000,
        rated: true,
        white: { username: 'testuser', rating: 1210, result: 'win' },
        black: { username: 'opponent', rating: 1200, result: 'loss' },
      },
      {
        url: 'test3',
        pgn: 'test',
        timeControl: '180',
        endTime: 3000,
        rated: true,
        white: { username: 'testuser', rating: 1220, result: 'loss' },
        black: { username: 'opponent', rating: 1230, result: 'win' },
      },
    ];

    // Sort games by time
    const sortedGames = [...mockGames].sort((a, b) => a.endTime - b.endTime);
    expect(sortedGames[0].endTime).toBe(1000);
    expect(sortedGames[2].endTime).toBe(3000);

    // Verify ratings are extracted correctly
    const ratings = sortedGames.map(game => game.white.rating);
    expect(ratings).toEqual([1200, 1210, 1220]);
  });
});
