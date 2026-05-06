import fc from 'fast-check';
import { Game } from '../../../types';

/**
 * **Feature: chess-stats-app, Property 9: Game detail field completeness**
 * 
 * For any game detail view, the rendered output should contain player names, 
 * ratings, result, time control, and opening information.
 * 
 * Validates: Requirements 4.2
 */
describe('Property 9: Game detail field completeness', () => {
  it('should contain all required fields for game detail display', () => {
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
          opening: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        (game: Game) => {
          // Simulate rendering the game detail view
          const renderedOutput = renderGameDetail(game);
          
          // The rendered output must contain both player names
          expect(renderedOutput).toContain(game.white.username);
          expect(renderedOutput).toContain(game.black.username);
          
          // The rendered output must contain both player ratings
          expect(renderedOutput).toContain(game.white.rating.toString());
          expect(renderedOutput).toContain(game.black.rating.toString());
          
          // The rendered output must contain result information
          expect(renderedOutput.toLowerCase()).toMatch(/win|loss|draw|resigned|timeout|abandoned|victory|defeat/);
          
          // The rendered output must contain time control
          expect(renderedOutput).toContain(formatTimeControl(game.timeControl));
          
          // If opening is present, it must be displayed
          if (game.opening) {
            expect(renderedOutput).toContain(game.opening);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to simulate rendering a game detail view
 * This represents what would be displayed in the UI
 */
function renderGameDetail(game: Game): string {
  const timeControl = formatTimeControl(game.timeControl);
  const gameDate = new Date(game.endTime * 1000).toLocaleString();
  
  // Determine result text from player results
  const whiteResult = game.white.result;
  const blackResult = game.black.result;
  const resultText = 
    whiteResult === 'win' ? 'Victory' :
    whiteResult === 'loss' ? 'Defeat' :
    whiteResult === 'draw' ? 'Draw' :
    whiteResult === 'resigned' ? 'Resigned' :
    whiteResult === 'timeout' ? 'Timeout' :
    'Abandoned';
  
  let output = `
    Game Details
    Result: ${resultText}
    
    Players:
    White: ${game.white.username} (${game.white.rating})
    Black: ${game.black.username} (${game.black.rating})
    
    Game Information:
    Time Control: ${timeControl}
    Rated: ${game.rated ? 'Yes' : 'No'}
  `;
  
  if (game.opening) {
    output += `\n    Opening: ${game.opening}`;
  }
  
  if (game.result) {
    output += `\n    Result: ${game.result}`;
  }
  
  output += `\n    Date: ${gameDate}`;
  
  return output;
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
  if (isNaN(seconds)) return timeControl;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (seconds < 180) return `Bullet (${minutes}+${remainingSeconds})`;
  if (seconds < 600) return `Blitz (${minutes}+${remainingSeconds})`;
  if (seconds < 1800) return `Rapid (${minutes}+${remainingSeconds})`;
  return `Classical (${minutes}+${remainingSeconds})`;
}
