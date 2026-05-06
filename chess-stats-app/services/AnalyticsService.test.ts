import fc from 'fast-check';
import { AnalyticsService } from './AnalyticsService';
import { Game, PlayerStats } from '../types';

// Mock expo-constants to avoid import issues in tests
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        openRouterApiKey: 'test-api-key',
      },
    },
  },
}));

// Mock OpenRouterService
jest.mock('./OpenRouterService', () => {
  const mockService = {
    generateCompletion: jest.fn().mockResolvedValue('AI generated response'),
    isConfigured: jest.fn().mockReturnValue(false), // Return false to use fallback suggestions
  };
  return {
    __esModule: true,
    default: mockService,
    OpenRouterService: jest.fn(() => mockService),
  };
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('Property 15: Opening analysis completeness', () => {
    /**
     * **Feature: chess-stats-app, Property 15: Opening analysis completeness**
     * **Validates: Requirements 9.2**
     * 
     * For any opening in the analysis results, the rendered output should contain 
     * opening name, frequency played, and win/loss/draw record.
     */
    it('should include opening name, frequency, and win/loss/draw record for all openings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              url: fc.string(),
              pgn: fc.string(),
              timeControl: fc.oneof(fc.constant('60'), fc.constant('180'), fc.constant('600')),
              endTime: fc.integer({ min: 1000000000, max: 2000000000 }),
              rated: fc.boolean(),
              white: fc.record({
                username: fc.string(),
                rating: fc.integer({ min: 800, max: 3000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              black: fc.record({
                username: fc.string(),
                rating: fc.integer({ min: 800, max: 3000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              opening: fc.oneof(
                fc.constant('Sicilian Defense'),
                fc.constant('French Defense'),
                fc.constant('Italian Game'),
                fc.constant('Ruy Lopez'),
                fc.constant(undefined)
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (games: Game[]) => {
            const analysis = await service.analyzeOpenings(games);

            // Every opening analysis should have all required fields
            for (const opening of analysis) {
              expect(opening.openingName).toBeDefined();
              expect(typeof opening.openingName).toBe('string');
              expect(opening.openingName.length).toBeGreaterThan(0);

              expect(opening.gamesPlayed).toBeDefined();
              expect(typeof opening.gamesPlayed).toBe('number');
              expect(opening.gamesPlayed).toBeGreaterThan(0);

              expect(opening.wins).toBeDefined();
              expect(typeof opening.wins).toBe('number');
              expect(opening.wins).toBeGreaterThanOrEqual(0);

              expect(opening.losses).toBeDefined();
              expect(typeof opening.losses).toBe('number');
              expect(opening.losses).toBeGreaterThanOrEqual(0);

              expect(opening.draws).toBeDefined();
              expect(typeof opening.draws).toBe('number');
              expect(opening.draws).toBeGreaterThanOrEqual(0);

              // Verify the record adds up to games played
              expect(opening.wins + opening.losses + opening.draws).toBe(opening.gamesPlayed);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Opening success rate calculation', () => {
    /**
     * **Feature: chess-stats-app, Property 16: Opening success rate calculation**
     * **Validates: Requirements 9.3**
     * 
     * For any opening with games played, the success rate should equal 
     * (wins + 0.5 * draws) / total games.
     */
    it('should calculate success rate as (wins + 0.5 * draws) / total games', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              url: fc.string(),
              pgn: fc.string(),
              timeControl: fc.constant('600'),
              endTime: fc.integer({ min: 1000000000, max: 2000000000 }),
              rated: fc.boolean(),
              white: fc.record({
                username: fc.constant('testuser'),
                rating: fc.integer({ min: 1000, max: 2000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              black: fc.record({
                username: fc.string(),
                rating: fc.integer({ min: 1000, max: 2000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              opening: fc.constant('Test Opening'),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (games: Game[]) => {
            const analysis = await service.analyzeOpenings(games);

            for (const opening of analysis) {
              const expectedSuccessRate = 
                ((opening.wins + 0.5 * opening.draws) / opening.gamesPlayed) * 100;
              
              expect(opening.successRate).toBeCloseTo(expectedSuccessRate, 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 17: Dashboard metrics completeness', () => {
    /**
     * **Feature: chess-stats-app, Property 17: Dashboard metrics completeness**
     * **Validates: Requirements 10.1, 10.2**
     * 
     * For any performance dashboard, the displayed metrics should include total games, 
     * win/loss/draw counts for each time control, and rating trends.
     */
    it('should include all required dashboard metrics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            games: fc.array(
              fc.record({
                url: fc.string(),
                pgn: fc.string(),
                timeControl: fc.oneof(
                  fc.constant('60'),    // bullet
                  fc.constant('180'),   // blitz
                  fc.constant('600'),   // rapid
                  fc.constant('1/86400') // daily
                ),
                endTime: fc.integer({ min: 1000000000, max: 2000000000 }),
                rated: fc.boolean(),
                white: fc.record({
                  username: fc.string(),
                  rating: fc.integer({ min: 800, max: 3000 }),
                  result: fc.constantFrom('win', 'loss', 'draw'),
                }),
                black: fc.record({
                  username: fc.string(),
                  rating: fc.integer({ min: 800, max: 3000 }),
                  result: fc.constantFrom('win', 'loss', 'draw'),
                }),
                opening: fc.string(),
              }),
              { minLength: 1, maxLength: 30 }
            ),
            stats: fc.record({
              chess_bullet: fc.option(fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                record: fc.record({
                  win: fc.nat(100),
                  loss: fc.nat(100),
                  draw: fc.nat(100),
                }),
              }), { nil: undefined }),
              chess_blitz: fc.option(fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                record: fc.record({
                  win: fc.nat(100),
                  loss: fc.nat(100),
                  draw: fc.nat(100),
                }),
              }), { nil: undefined }),
              chess_rapid: fc.option(fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                record: fc.record({
                  win: fc.nat(100),
                  loss: fc.nat(100),
                  draw: fc.nat(100),
                }),
              }), { nil: undefined }),
              chess_daily: fc.option(fc.record({
                last: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                best: fc.record({
                  rating: fc.integer({ min: 800, max: 3000 }),
                  date: fc.integer({ min: 1000000000, max: 2000000000 }),
                }),
                record: fc.record({
                  win: fc.nat(100),
                  loss: fc.nat(100),
                  draw: fc.nat(100),
                }),
              }), { nil: undefined }),
            }),
          }),
          async ({ games, stats }: { games: Game[]; stats: PlayerStats }) => {
            const username = games[0]?.white.username || 'testuser';
            const expectedGames = games.filter(
              game =>
                game.white.username.toLowerCase() === username.toLowerCase() ||
                game.black.username.toLowerCase() === username.toLowerCase()
            ).length;
            const dashboard = await service.calculatePerformanceMetrics(games, stats, username);

            // Check total games
            expect(dashboard.totalGames).toBeDefined();
            expect(typeof dashboard.totalGames).toBe('number');
            expect(dashboard.totalGames).toBe(expectedGames);

            // Check overall win rate
            expect(dashboard.overallWinRate).toBeDefined();
            expect(typeof dashboard.overallWinRate).toBe('number');
            expect(dashboard.overallWinRate).toBeGreaterThanOrEqual(0);
            expect(dashboard.overallWinRate).toBeLessThanOrEqual(100);

            // Check time control metrics
            expect(dashboard.byTimeControl).toBeDefined();
            expect(dashboard.byTimeControl.bullet).toBeDefined();
            expect(dashboard.byTimeControl.blitz).toBeDefined();
            expect(dashboard.byTimeControl.rapid).toBeDefined();
            expect(dashboard.byTimeControl.daily).toBeDefined();

            // Each time control should have complete metrics
            for (const tc of ['bullet', 'blitz', 'rapid', 'daily'] as const) {
              const metrics = dashboard.byTimeControl[tc];
              expect(metrics.games).toBeDefined();
              expect(typeof metrics.games).toBe('number');
              expect(metrics.wins).toBeDefined();
              expect(typeof metrics.wins).toBe('number');
              expect(metrics.losses).toBeDefined();
              expect(typeof metrics.losses).toBe('number');
              expect(metrics.draws).toBeDefined();
              expect(typeof metrics.draws).toBe('number');
              expect(metrics.winRate).toBeDefined();
              expect(typeof metrics.winRate).toBe('number');
              expect(metrics.currentRating).toBeDefined();
              expect(typeof metrics.currentRating).toBe('number');
            }

            // Check rating trend
            expect(dashboard.ratingTrend).toBeDefined();
            expect(Array.isArray(dashboard.ratingTrend)).toBe(true);
            
            for (const point of dashboard.ratingTrend) {
              expect(point.date).toBeDefined();
              expect(typeof point.date).toBe('number');
              expect(point.rating).toBeDefined();
              expect(typeof point.rating).toBe('number');
              expect(point.timeControl).toBeDefined();
              expect(typeof point.timeControl).toBe('string');
            }

            // Check strongest and weakest time controls
            expect(dashboard.strongestTimeControl).toBeDefined();
            expect(typeof dashboard.strongestTimeControl).toBe('string');
            expect(dashboard.weakestTimeControl).toBeDefined();
            expect(typeof dashboard.weakestTimeControl).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Phase analysis categorization', () => {
    /**
     * **Feature: chess-stats-app, Property 18: Phase analysis categorization**
     * **Validates: Requirements 11.1**
     * 
     * For any set of games, the phase analysis should categorize games into 
     * opening, middlegame, and endgame based on when critical moments occurred.
     */
    it('should categorize all games into opening, middlegame, or endgame phases', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              url: fc.string(),
              pgn: fc.string().map(s => {
                // Generate PGN with varying number of moves
                const moveCount = Math.floor(Math.random() * 80) + 5;
                let pgn = '';
                for (let i = 1; i <= moveCount; i++) {
                  pgn += `${i}. e4 e5 `;
                }
                return pgn;
              }),
              timeControl: fc.constant('600'),
              endTime: fc.integer({ min: 1000000000, max: 2000000000 }),
              rated: fc.boolean(),
              white: fc.record({
                username: fc.string(),
                rating: fc.integer({ min: 1000, max: 2000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              black: fc.record({
                username: fc.string(),
                rating: fc.integer({ min: 1000, max: 2000 }),
                result: fc.constantFrom('win', 'loss', 'draw'),
              }),
              opening: fc.string(),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          async (games: Game[]) => {
            const phaseAnalysis = await service.analyzeGamePhases(games);

            // All three phases should be present
            expect(phaseAnalysis.openingPhase).toBeDefined();
            expect(phaseAnalysis.middlegamePhase).toBeDefined();
            expect(phaseAnalysis.endgamePhase).toBeDefined();

            // Each phase should have required fields
            for (const phase of [
              phaseAnalysis.openingPhase,
              phaseAnalysis.middlegamePhase,
              phaseAnalysis.endgamePhase,
            ]) {
              expect(phase.gamesDecided).toBeDefined();
              expect(typeof phase.gamesDecided).toBe('number');
              expect(phase.gamesDecided).toBeGreaterThanOrEqual(0);

              expect(phase.winRate).toBeDefined();
              expect(typeof phase.winRate).toBe('number');
              expect(phase.winRate).toBeGreaterThanOrEqual(0);
              expect(phase.winRate).toBeLessThanOrEqual(100);

              expect(phase.commonPatterns).toBeDefined();
              expect(Array.isArray(phase.commonPatterns)).toBe(true);

              expect(phase.exampleGames).toBeDefined();
              expect(Array.isArray(phase.exampleGames)).toBe(true);
            }

            // Total games decided should equal total games
            const totalDecided =
              phaseAnalysis.openingPhase.gamesDecided +
              phaseAnalysis.middlegamePhase.gamesDecided +
              phaseAnalysis.endgamePhase.gamesDecided;
            
            expect(totalDecided).toBe(games.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AI-powered improvement suggestions', () => {
    it('should generate improvement suggestions with fallback when AI is not configured', async () => {
      // Create test data
      const games: Game[] = [
        {
          url: 'https://chess.com/game/1',
          pgn: '1. e4 e5 2. Nf3 Nc6',
          timeControl: '600',
          endTime: 1600000000,
          rated: true,
          white: {
            username: 'testuser',
            rating: 1500,
            result: 'loss',
          },
          black: {
            username: 'opponent',
            rating: 1550,
            result: 'win',
          },
          opening: 'Italian Game',
        },
        {
          url: 'https://chess.com/game/2',
          pgn: '1. e4 e5 2. Nf3 Nc6',
          timeControl: '600',
          endTime: 1600000100,
          rated: true,
          white: {
            username: 'testuser',
            rating: 1500,
            result: 'loss',
          },
          black: {
            username: 'opponent2',
            rating: 1550,
            result: 'win',
          },
          opening: 'Italian Game',
        },
        {
          url: 'https://chess.com/game/3',
          pgn: '1. e4 e5 2. Nf3 Nc6',
          timeControl: '600',
          endTime: 1600000200,
          rated: true,
          white: {
            username: 'testuser',
            rating: 1500,
            result: 'loss',
          },
          black: {
            username: 'opponent3',
            rating: 1550,
            result: 'win',
          },
          opening: 'Italian Game',
        },
      ];

      const phaseAnalysis = await service.analyzeGamePhases(games);
      const openingAnalysis = await service.analyzeOpenings(games);

      const suggestions = await service.generateImprovementSuggestions(
        games,
        phaseAnalysis,
        openingAnalysis
      );

      // Should return suggestions (fallback since AI is mocked as not configured)
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Each suggestion should have required fields
      for (const suggestion of suggestions) {
        expect(suggestion.category).toBeDefined();
        expect(['opening', 'middlegame', 'endgame', 'time-management']).toContain(suggestion.category);
        
        expect(suggestion.priority).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
        
        expect(suggestion.insight).toBeDefined();
        expect(typeof suggestion.insight).toBe('string');
        expect(suggestion.insight.length).toBeGreaterThan(0);
        
        expect(suggestion.recommendation).toBeDefined();
        expect(typeof suggestion.recommendation).toBe('string');
        expect(suggestion.recommendation.length).toBeGreaterThan(0);
        
        expect(suggestion.supportingData).toBeDefined();
        expect(suggestion.supportingData.gamesAffected).toBeDefined();
        expect(typeof suggestion.supportingData.gamesAffected).toBe('number');
        expect(suggestion.supportingData.impactOnWinRate).toBeDefined();
        expect(typeof suggestion.supportingData.impactOnWinRate).toBe('number');
      }
    });

    it('should handle empty games array gracefully', async () => {
      const games: Game[] = [];
      const phaseAnalysis = await service.analyzeGamePhases(games);
      const openingAnalysis = await service.analyzeOpenings(games);

      const suggestions = await service.generateImprovementSuggestions(
        games,
        phaseAnalysis,
        openingAnalysis
      );

      // Should return empty array or handle gracefully
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
