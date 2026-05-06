import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedData } from '../types';

const CACHE_PREFIX = 'chess_stats_cache_';

export class CacheService {
  private memoryCache = new Map<string, string>();
  private nativeStorageAvailable: boolean | null = null;
  private hasLoggedFallback = false;

  /**
   * Generate a cache key with prefix
   */
  private generateKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private isNativeStorageUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.name === 'AsyncStorageError' ||
      error.message.includes('Native module is null') ||
      error.message.includes('cannot access legacy storage')
    );
  }

  private useInMemoryFallback(error: unknown, operation: string): void {
    this.nativeStorageAvailable = false;

    if (!this.hasLoggedFallback && __DEV__) {
      console.log(`Cache ${operation}: AsyncStorage unavailable, using in-memory fallback.`);
      this.hasLoggedFallback = true;
    }
  }

  /**
   * Store data in cache with optional TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateKey(key);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    const payload = JSON.stringify(cacheEntry);
    
    try {
      if (this.nativeStorageAvailable === false) {
        this.memoryCache.set(cacheKey, payload);
        return;
      }

      await AsyncStorage.setItem(cacheKey, payload);
      this.nativeStorageAvailable = true;
    } catch (error) {
      if (this.isNativeStorageUnavailableError(error)) {
        this.useInMemoryFallback(error, 'set');
        this.memoryCache.set(cacheKey, payload);
        return;
      }

      console.error('Cache set error:', error);
    }
  }

  /**
   * Retrieve data from cache
   * @param key - Cache key
   * @returns Cached data with metadata or null if not found
   */
  async get<T>(key: string): Promise<CachedData<T> | null> {
    const cacheKey = this.generateKey(key);
    
    try {
      const item =
        this.nativeStorageAvailable === false
          ? this.memoryCache.get(cacheKey) ?? null
          : await AsyncStorage.getItem(cacheKey);

      if (this.nativeStorageAvailable !== false) {
        this.nativeStorageAvailable = true;
      }
      
      if (!item) {
        return null;
      }
      
      const cacheEntry = JSON.parse(item);
      const { data, timestamp, ttl } = cacheEntry;
      
      // Check if data is stale based on TTL
      const isStale = ttl ? Date.now() - timestamp > ttl : false;
      
      return {
        data,
        timestamp,
        isStale,
      };
    } catch (error) {
      if (this.isNativeStorageUnavailableError(error)) {
        this.useInMemoryFallback(error, 'get');
        const memoryItem = this.memoryCache.get(cacheKey);

        if (!memoryItem) {
          return null;
        }

        const cacheEntry = JSON.parse(memoryItem);
        const { data, timestamp, ttl } = cacheEntry;
        const isStale = ttl ? Date.now() - timestamp > ttl : false;

        return {
          data,
          timestamp,
          isStale,
        };
      }

      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove a specific item from cache
   * @param key - Cache key
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    
    try {
      if (this.nativeStorageAvailable === false) {
        this.memoryCache.delete(cacheKey);
        return;
      }

      await AsyncStorage.removeItem(cacheKey);
      this.nativeStorageAvailable = true;
    } catch (error) {
      if (this.isNativeStorageUnavailableError(error)) {
        this.useInMemoryFallback(error, 'remove');
        this.memoryCache.delete(cacheKey);
        return;
      }

      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      if (this.nativeStorageAvailable === false) {
        this.memoryCache.clear();
        return;
      }

      const keys = await AsyncStorage.getAllKeys();
      this.nativeStorageAvailable = true;
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      // Remove each cache key individually
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      if (this.isNativeStorageUnavailableError(error)) {
        this.useInMemoryFallback(error, 'clear');
        this.memoryCache.clear();
        return;
      }

      console.error('Cache clear error:', error);
    }
  }

  /**
   * Check if cached data is stale
   * @param key - Cache key
   * @param maxAge - Maximum age in milliseconds
   * @returns true if data is stale or doesn't exist
   */
  async isStale(key: string, maxAge: number): Promise<boolean> {
    const cachedData = await this.get(key);
    
    if (!cachedData) {
      return true;
    }
    
    const age = Date.now() - cachedData.timestamp;
    return age > maxAge;
  }
}

export default new CacheService();
