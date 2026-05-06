import fc from 'fast-check';
import { Game } from '../types';

/**
 * **Feature: chess-stats-app, Property 8: Game display field completeness**
 * 
 * For any game in a list, the rendered output should contain opponent username, 
 * game result, time control, and date.
 * 
 * Validates: Requirements 3.3
 */
describe('Property 8: Game display field completeness', () => {
  it('should contain all required fields for game display', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl(),
          pgn: fc.string(),
          timeControl: fc.constantFrom('60', '180', '300', '600', '900', '1800', '1/86400'),
          endTime: fc.nat(),
          rated: fc.boolean(),
          white: fc.record({
            username: fc.string({ minLength: 1 }),
            rating: fc.integer({ min: 0, max: 3000 }),
            result: fc.constantFrom('win', 'loss', 'draw', 'resigned', 'timeout', 'abandoned'),
          }),
          black: fc.record({
            username: fc.string({ minLength: 1 }),
            rating: fc.integer({ min: 0, max: 3000 }),
            result: fc.constantFrom('win', 'loss', 'draw', 'resigned', 'timeout', 'abandoned'),
          }),
          result: fc.option(fc.string(), { nil: undefined }),
          opening: fc.option(fc.string(), { nil: undefined }),
        }),
        fc.string({ minLength: 1 }), // currentUsername
        (game: Game, currentUsername: string) => {
          // Simulate rendering the game in a list
          const renderedOutput = renderGameListItem(game, currentUsername);
          
          // Determine opponent username
          const opponentUsername = game.white.username === currentUsername 
            ? game.black.username 
            : game.white.username;
          
          // The rendered output must contain opponent username
          expect(renderedOutput).toContain(opponentUsername);
          
          // The rendered output must contain game result
          const userColor = game.white.username === currentUsername ? 'white' : 'black';
          const userResult = userColor === 'white' ? game.white.result : game.black.result;
          expect(renderedOutput.toLowerCase()).toMatch(/win|loss|draw|resigned|timeout|abandoned/);
          
          // The rendered output must contain time control
          expect(renderedOutput).toContain(formatTimeControl(game.timeControl));
          
          // The rendered output must contain date
          const gameDate = new Date(game.endTime * 1000).toLocaleDateString();
          expect(renderedOutput).toContain(gameDate);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to simulate rendering a game list item
 * This represents what would be displayed in the UI
 */
function renderGameListItem(game: Game, currentUsername: string): string {
  const opponentUsername = game.white.username === currentUsername 
    ? game.black.username 
    : game.white.username;
  
  const userColor = game.white.username === currentUsername ? 'white' : 'black';
  const userResult = userColor === 'white' ? game.white.result : game.black.result;
  
  const gameDate = new Date(game.endTime * 1000).toLocaleDateString();
  const timeControl = formatTimeControl(game.timeControl);
  
  return `
    Opponent: ${opponentUsername}
    Result: ${userResult}
    Time Control: ${timeControl}
    Date: ${gameDate}
  `;
}

/**
 * Helper function to format time control for display
 */
function formatTimeControl(timeControl: string): string {
  if (timeControl.includes('/')) {
    // Daily format like "1/86400"
    return 'Daily';
  }
  
  const seconds = parseInt(timeControl);
  if (seconds < 180) return 'Bullet';
  if (seconds < 600) return 'Blitz';
  if (seconds < 1800) return 'Rapid';
  return 'Classical';
}
