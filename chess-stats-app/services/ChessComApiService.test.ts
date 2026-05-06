import fc from 'fast-check';
import { ChessComApiService } from './ChessComApiService';

describe('ChessComApiService Property-Based Tests', () => {
  let service: ChessComApiService;

  beforeEach(() => {
    service = new ChessComApiService();
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Property 2: Username validation triggers API verification', () => {
    /**
     * **Feature: chess-stats-app, Property 2: Username validation triggers API verification**
     * **Validates: Requirements 1.4**
     * 
     * For any Chess.com username submission, the validation process should make an API call to verify the username exists.
     */
    it('should make API call to verify username exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 25 }).filter(s => s.trim().length > 0),
          async (username) => {
            // Reset mock for each property test iteration
            jest.clearAllMocks();
            
            // Mock successful response
            const mockProfile = {
              username,
              player_id: 12345,
              url: `https://www.chess.com/member/${username}`,
              followers: 0,
              country: 'US',
              joined: Date.now(),
              last_online: Date.now(),
              status: 'premium',
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => mockProfile,
            });

            // Call getPlayerProfile which should trigger API verification
            await service.getPlayerProfile(username);

            // Verify that fetch was called with the correct URL
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining(`/player/${username}`)
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // Increase timeout for property-based test
  });

  describe('Property 4: Invalid username error handling', () => {
    /**
     * **Feature: chess-stats-app, Property 4: Invalid username error handling**
     * **Validates: Requirements 1.6**
     * 
     * For any invalid Chess.com username, the submission should result in an error message being displayed.
     */
    it('should throw ApiError with NOT_FOUND code for invalid usernames', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 25 }).filter(s => s.trim().length > 0),
          async (username) => {
            // Reset mock for each property test iteration
            jest.clearAllMocks();
            
            // Mock 404 response for invalid username
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: false,
              status: 404,
              json: async () => ({}),
            });

            // Attempt to get profile for invalid username
            try {
              await service.getPlayerProfile(username);
              // If we reach here, the test should fail
              return false;
            } catch (error: any) {
              // Verify error has correct structure
              expect(error).toHaveProperty('code', 'NOT_FOUND');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('retryable', false);
              expect(error).toHaveProperty('statusCode', 404);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // Increase timeout for property-based test
  });

  describe('Property 7: API error handling with retry', () => {
    /**
     * **Feature: chess-stats-app, Property 7: API error handling with retry**
     * **Validates: Requirements 2.5**
     * 
     * For any failed API request, the UI should display an error message and provide a retry mechanism.
     */
    it('should retry on retryable errors and eventually throw ApiError', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 25 }).filter(s => s.trim().length > 0),
          fc.constantFrom(429, 500, 502, 503),
          async (username, errorCode) => {
            // Reset mock for each property test iteration
            jest.clearAllMocks();
            
            // Mock retryable error responses
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({ ok: false, status: errorCode })
              .mockResolvedValueOnce({ ok: false, status: errorCode })
              .mockResolvedValueOnce({ ok: false, status: errorCode })
              .mockResolvedValueOnce({ ok: false, status: errorCode });

            try {
              await service.getPlayerProfile(username);
              return false; // Should not reach here
            } catch (error: any) {
              // Verify error has correct structure
              expect(error).toHaveProperty('code');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('retryable', true);
              expect(error).toHaveProperty('statusCode', errorCode);

              // Verify that fetch was called multiple times (retry logic)
              expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
              return true;
            }
          }
        ),
        { numRuns: 10 } // Reduced runs due to retry delays (each run takes ~7 seconds)
      );
    }, 120000); // Longer timeout due to retry delays (10 runs * ~7s each = ~70s)
  });
});
