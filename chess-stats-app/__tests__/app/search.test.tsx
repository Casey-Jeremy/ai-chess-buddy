import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react-native';
import SearchScreen from '../../app/search';
import { PlayerProfile, PlayerStats } from '../../types';

// Ensure SearchScreen is properly imported
if (!SearchScreen) {
  throw new Error('SearchScreen component not properly imported');
}

// Mock dependencies
jest.mock('../../hooks/useChessData', () => ({
  usePlayerProfile: jest.fn(),
  usePlayerStats: jest.fn(),
}));

describe('SearchScreen Property-Based Tests', () => {
  const { usePlayerProfile, usePlayerStats } = require('../../hooks/useChessData');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 19: Search profile basic stats display', () => {
    /**
     * **Feature: chess-stats-app, Property 19: Search profile basic stats display**
     * **Validates: Requirements 12.4**
     * 
     * For any searched player profile, the rendered output should contain ratings across different time controls.
     */
    it('should display ratings across different time controls for any player profile', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary player profile
          fc.record({
            username: fc.string({ minLength: 3, maxLength: 20 }),
            playerId: fc.nat(),
            url: fc.webUrl(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            avatar: fc.option(fc.webUrl(), { nil: undefined }),
            followers: fc.nat(10000),
            country: fc.string({ minLength: 2, maxLength: 2 }),
            joined: fc.nat(),
            lastOnline: fc.nat(),
            status: fc.constantFrom('premium', 'basic', 'staff', 'mod'),
          }),
          // Generate arbitrary player stats with at least one time control
          fc.record({
            chess_bullet: fc.option(
              fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                record: fc.record({
                  win: fc.nat(1000),
                  loss: fc.nat(1000),
                  draw: fc.nat(1000),
                }),
              }),
              { nil: undefined }
            ),
            chess_blitz: fc.option(
              fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                record: fc.record({
                  win: fc.nat(1000),
                  loss: fc.nat(1000),
                  draw: fc.nat(1000),
                }),
              }),
              { nil: undefined }
            ),
            chess_rapid: fc.option(
              fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                record: fc.record({
                  win: fc.nat(1000),
                  loss: fc.nat(1000),
                  draw: fc.nat(1000),
                }),
              }),
              { nil: undefined }
            ),
            chess_daily: fc.option(
              fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 400, max: 3000 }),
                  date: fc.nat(),
                }),
                record: fc.record({
                  win: fc.nat(1000),
                  loss: fc.nat(1000),
                  draw: fc.nat(1000),
                }),
              }),
              { nil: undefined }
            ),
          }).filter(
            // Ensure at least one time control has data
            (stats) =>
              stats.chess_bullet !== undefined ||
              stats.chess_blitz !== undefined ||
              stats.chess_rapid !== undefined ||
              stats.chess_daily !== undefined
          ),
          async (profile: PlayerProfile, stats: PlayerStats) => {
            // Mock the hooks to return the generated profile and stats
            usePlayerProfile.mockReturnValue({
              data: profile,
              isLoading: false,
              error: null,
              refetch: jest.fn(),
            });

            usePlayerStats.mockReturnValue({
              data: stats,
              isLoading: false,
              error: null,
            });

            // Render the search screen
            const { getByText, queryByText } = render(<SearchScreen />);

            // Verify profile information is displayed
            expect(getByText(`@${profile.username}`)).toBeTruthy();

            // Verify that ratings section exists when stats are available
            if (stats.chess_bullet || stats.chess_blitz || stats.chess_rapid || stats.chess_daily) {
              expect(getByText('Ratings')).toBeTruthy();
            }

            // Verify that each time control label is displayed when that time control has data
            if (stats.chess_bullet) {
              expect(getByText('Bullet')).toBeTruthy();
            }

            if (stats.chess_blitz) {
              expect(getByText('Blitz')).toBeTruthy();
            }

            if (stats.chess_rapid) {
              expect(getByText('Rapid')).toBeTruthy();
            }

            if (stats.chess_daily) {
              expect(getByText('Daily')).toBeTruthy();
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increased timeout for property-based test with rendering
  });
});
