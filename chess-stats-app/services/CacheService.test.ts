import fc from 'fast-check';
import { CacheService } from './CacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

describe('CacheService Property Tests', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.clearAllMocks();
  });

  describe('Property 10: Successful fetch triggers cache storage', () => {
    /**
     * **Feature: chess-stats-app, Property 10: Successful fetch triggers cache storage**
     * **Validates: Requirements 6.1**
     * 
     * For any successful API response, the cache should contain that data after the fetch completes.
     */
    it('should store data in cache after successful set operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.jsonValue(), // Use jsonValue to generate JSON-serializable data
          async (key, data) => {
            // Mock AsyncStorage.setItem to succeed
            (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (storageKey: string) => {
              if (storageKey === `chess_stats_cache_${key}`) {
                return JSON.stringify({
                  data,
                  timestamp: Date.now(),
                  ttl: undefined,
                });
              }
              return null;
            });

            // Store data in cache
            await cacheService.set(key, data);

            // Verify setItem was called
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
              `chess_stats_cache_${key}`,
              expect.any(String)
            );

            // Retrieve data from cache
            const cachedData = await cacheService.get(key);

            // Verify data was stored and can be retrieved
            expect(cachedData).not.toBeNull();
            
            // Use JSON round-trip comparison since that's what the cache does
            expect(JSON.parse(JSON.stringify(cachedData?.data))).toEqual(JSON.parse(JSON.stringify(data)));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Offline mode displays cached data with indicator', () => {
    /**
     * **Feature: chess-stats-app, Property 11: Offline mode displays cached data with indicator**
     * **Validates: Requirements 6.2**
     * 
     * For any cached data, when the app is offline, the data should be displayed 
     * along with a visual indicator showing it's not current.
     */
    it('should return cached data with isStale indicator when data exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 0, max: 86400000 }), // TTL up to 24 hours
          async (key, data, ttl) => {
            const timestamp = Date.now();
            
            // Mock AsyncStorage to return cached data
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
              JSON.stringify({
                data,
                timestamp,
                ttl,
              })
            );

            // Retrieve data from cache (simulating offline mode)
            const cachedData = await cacheService.get(key);

            // Verify data is returned
            expect(cachedData).not.toBeNull();
            // Use JSON round-trip comparison to handle edge cases like -0 vs 0
            expect(JSON.parse(JSON.stringify(cachedData?.data))).toEqual(JSON.parse(JSON.stringify(data)));
            expect(cachedData?.timestamp).toBe(timestamp);
            
            // Verify isStale indicator is present (boolean value)
            expect(typeof cachedData?.isStale).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate isStale based on TTL', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 1000, max: 10000 }), // TTL between 1-10 seconds
          async (key, data, ttl) => {
            const oldTimestamp = Date.now() - ttl - 1000; // Data older than TTL
            
            // Mock AsyncStorage to return stale cached data
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
              JSON.stringify({
                data,
                timestamp: oldTimestamp,
                ttl,
              })
            );

            // Retrieve data from cache
            const cachedData = await cacheService.get(key);

            // Verify data is marked as stale
            expect(cachedData).not.toBeNull();
            expect(cachedData?.isStale).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Stale cache triggers fresh fetch', () => {
    /**
     * **Feature: chess-stats-app, Property 12: Stale cache triggers fresh fetch**
     * **Validates: Requirements 6.4**
     * 
     * For any cached data older than 24 hours, when the app is online, 
     * a fresh fetch should be initiated.
     */
    it('should identify cache as stale when older than maxAge', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 1000, max: 86400000 }), // maxAge between 1 second and 24 hours
          async (key, data, maxAge) => {
            const oldTimestamp = Date.now() - maxAge - 1000; // Data older than maxAge
            
            // Mock AsyncStorage to return old cached data
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
              JSON.stringify({
                data,
                timestamp: oldTimestamp,
                ttl: undefined,
              })
            );

            // Check if cache is stale
            const isStale = await cacheService.isStale(key, maxAge);

            // Verify cache is identified as stale
            expect(isStale).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify cache as fresh when younger than maxAge', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 5000, max: 86400000 }), // maxAge between 5 seconds and 24 hours
          async (key, data, maxAge) => {
            const recentTimestamp = Date.now() - Math.floor(maxAge / 2); // Data is half the maxAge
            
            // Mock AsyncStorage to return recent cached data
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
              JSON.stringify({
                data,
                timestamp: recentTimestamp,
                ttl: undefined,
              })
            );

            // Check if cache is stale
            const isStale = await cacheService.isStale(key, maxAge);

            // Verify cache is identified as fresh
            expect(isStale).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify non-existent cache as stale', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 1000, max: 86400000 }),
          async (key, maxAge) => {
            // Mock AsyncStorage to return null (no cached data)
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            // Check if cache is stale
            const isStale = await cacheService.isStale(key, maxAge);

            // Verify non-existent cache is identified as stale
            expect(isStale).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});