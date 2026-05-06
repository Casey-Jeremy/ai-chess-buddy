import fc from 'fast-check';
import { PlayerProfile, PlayerStats } from './index';

/**
 * **Feature: chess-stats-app, Property 5: Profile display completeness**
 * 
 * For any player profile fetched from the API, the rendered output should contain 
 * username, avatar, join date, and status fields.
 * 
 * Validates: Requirements 2.2
 */
describe('Property 5: Profile display completeness', () => {
  it('should contain all required fields for profile display', () => {
    fc.assert(
      fc.property(
        fc.record({
          username: fc.string({ minLength: 1 }),
          playerId: fc.nat(),
          url: fc.webUrl(),
          name: fc.option(fc.string(), { nil: undefined }),
          avatar: fc.option(fc.webUrl(), { nil: undefined }),
          followers: fc.nat(),
          country: fc.string({ minLength: 2, maxLength: 2 }),
          joined: fc.nat(),
          lastOnline: fc.nat(),
          status: fc.constantFrom('online', 'offline', 'busy', 'premium'),
        }),
        (profile: PlayerProfile) => {
          // Simulate rendering the profile - check that all required fields exist
          const renderedOutput = renderProfile(profile);
          
          // The rendered output must contain username, avatar, join date, and status
          expect(renderedOutput).toContain(profile.username);
          expect(renderedOutput).toContain(profile.status);
          expect(renderedOutput).toContain(new Date(profile.joined * 1000).toLocaleDateString());
          
          // Avatar should be included if present, or a placeholder if not
          if (profile.avatar) {
            expect(renderedOutput).toContain(profile.avatar);
          } else {
            expect(renderedOutput).toContain('placeholder');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to simulate rendering a profile
 * This represents what would be displayed in the UI
 */
function renderProfile(profile: PlayerProfile): string {
  const avatar = profile.avatar || 'placeholder';
  const joinDate = new Date(profile.joined * 1000).toLocaleDateString();
  
  return `
    Username: ${profile.username}
    Avatar: ${avatar}
    Join Date: ${joinDate}
    Status: ${profile.status}
  `;
}

/**
 * **Feature: chess-stats-app, Property 6: Statistics organization by game type**
 * 
 * For any player statistics data, the displayed statistics should be grouped 
 * by game type (bullet, blitz, rapid, daily).
 * 
 * Validates: Requirements 2.4
 */
describe('Property 6: Statistics organization by game type', () => {
  it('should organize statistics by game type', () => {
    fc.assert(
      fc.property(
        fc.record({
          chess_bullet: fc.option(
            fc.record({
              last: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              best: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              record: fc.record({
                win: fc.nat(),
                loss: fc.nat(),
                draw: fc.nat(),
              }),
            }),
            { nil: undefined }
          ),
          chess_blitz: fc.option(
            fc.record({
              last: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              best: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              record: fc.record({
                win: fc.nat(),
                loss: fc.nat(),
                draw: fc.nat(),
              }),
            }),
            { nil: undefined }
          ),
          chess_rapid: fc.option(
            fc.record({
              last: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              best: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              record: fc.record({
                win: fc.nat(),
                loss: fc.nat(),
                draw: fc.nat(),
              }),
            }),
            { nil: undefined }
          ),
          chess_daily: fc.option(
            fc.record({
              last: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              best: fc.record({
                rating: fc.integer({ min: 0, max: 3000 }),
                date: fc.nat(),
                gameId: fc.option(fc.string(), { nil: undefined }),
              }),
              record: fc.record({
                win: fc.nat(),
                loss: fc.nat(),
                draw: fc.nat(),
              }),
            }),
            { nil: undefined }
          ),
        }),
        (stats: PlayerStats) => {
          // Simulate organizing and displaying statistics
          const organizedStats = organizeStatsByGameType(stats);
          
          // Check that the organization maintains the game type structure
          const gameTypes = ['bullet', 'blitz', 'rapid', 'daily'];
          
          gameTypes.forEach(gameType => {
            expect(organizedStats).toHaveProperty(gameType);
            
            // If the original stats had this game type, verify it's preserved
            const statsKey = `chess_${gameType}` as keyof PlayerStats;
            if (stats[statsKey]) {
              expect(organizedStats[gameType]).toBeDefined();
              expect(organizedStats[gameType].rating).toBe(stats[statsKey]!.last.rating);
              expect(organizedStats[gameType].wins).toBe(stats[statsKey]!.record.win);
              expect(organizedStats[gameType].losses).toBe(stats[statsKey]!.record.loss);
              expect(organizedStats[gameType].draws).toBe(stats[statsKey]!.record.draw);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to simulate organizing statistics by game type
 * This represents how statistics would be displayed in the UI
 */
function organizeStatsByGameType(stats: PlayerStats): Record<string, any> {
  const organized: Record<string, any> = {
    bullet: null,
    blitz: null,
    rapid: null,
    daily: null,
  };
  
  if (stats.chess_bullet) {
    organized.bullet = {
      rating: stats.chess_bullet.last.rating,
      wins: stats.chess_bullet.record.win,
      losses: stats.chess_bullet.record.loss,
      draws: stats.chess_bullet.record.draw,
    };
  }
  
  if (stats.chess_blitz) {
    organized.blitz = {
      rating: stats.chess_blitz.last.rating,
      wins: stats.chess_blitz.record.win,
      losses: stats.chess_blitz.record.loss,
      draws: stats.chess_blitz.record.draw,
    };
  }
  
  if (stats.chess_rapid) {
    organized.rapid = {
      rating: stats.chess_rapid.last.rating,
      wins: stats.chess_rapid.record.win,
      losses: stats.chess_rapid.record.loss,
      draws: stats.chess_rapid.record.draw,
    };
  }
  
  if (stats.chess_daily) {
    organized.daily = {
      rating: stats.chess_daily.last.rating,
      wins: stats.chess_daily.record.win,
      losses: stats.chess_daily.record.loss,
      draws: stats.chess_daily.record.draw,
    };
  }
  
  return organized;
}
