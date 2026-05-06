# Offline Support Implementation

This document describes the offline support and caching implementation for the Chess Stats App.

## Overview

The app now supports full offline functionality with intelligent caching and background refresh capabilities. Users can view their chess statistics, games, and analytics even when offline.

## Key Features

### 1. Network Status Monitoring
- Real-time network connectivity detection using `@react-native-community/netinfo`
- `useNetworkStatus` hook provides `isOnline`, `isOffline`, and `isConnected` states
- Automatic detection of network state changes

### 2. Cache-First Data Fetching Strategy
All data hooks implement a cache-first strategy:
- **When Online**: Check cache first, return fresh data if available, fetch from API if stale
- **When Offline**: Return cached data if available, show error if no cache exists
- **Cache TTL**: 24 hours for all data types

### 3. Background Refresh
- `NetworkProvider` monitors network status changes
- When coming back online, automatically refetches all active queries
- React Query's `refetchOnReconnect` ensures data freshness

### 4. Offline Indicator
- Visual banner displayed at the top of screens when offline
- Shows "Using cached data - You are offline" message
- Implemented in Dashboard, Games, Openings, and Profile screens

### 5. Intelligent Caching
- All API responses are cached using `CacheService` (AsyncStorage)
- Analytics data (openings, phases, dashboard) can be computed offline from cached games
- AI suggestions require network (gracefully degrade to empty array when offline)

## Implementation Details

### Network Status Hook
```typescript
// hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  // Monitors NetInfo and updates state
  return { isOnline, isConnected, isOffline: !isOnline };
}
```

### Network Context Provider
```typescript
// contexts/NetworkContext.tsx
export function NetworkProvider({ children }: NetworkProviderProps) {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Refetch stale queries when coming back online
    if (isOnline) {
      queryClient.refetchQueries({ type: 'active', stale: true });
    }
  }, [isOnline, queryClient]);
  
  return <NetworkContext.Provider value={{ isOnline, isOffline }}>
    {children}
  </NetworkContext.Provider>;
}
```

### Data Fetching Pattern
```typescript
export function usePlayerProfile(username: string | null | undefined) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: chessQueryKeys.playerProfile(username || ''),
    queryFn: async () => {
      const cacheKey = `profile_${username}`;
      const cached = await cacheService.get<PlayerProfile>(cacheKey);
      
      // If offline, return cached data or throw error
      if (!isOnline) {
        if (cached) return cached.data;
        throw new Error('No cached data available and you are offline');
      }

      // If online and cache is fresh, return cached data
      if (cached && !cached.isStale) {
        return cached.data;
      }

      // Fetch fresh data when online
      const data = await chessComApiService.getPlayerProfile(username);
      await cacheService.set(cacheKey, data, 24 * 60 * 60 * 1000);
      return data;
    },
    retry: (failureCount, error: any) => {
      if (!isOnline) return false; // Don't retry when offline
      return failureCount < 2;
    },
  });
}
```

## Requirements Validation

### Requirement 6.1: Cache Storage
✅ All successful API fetches store data in local cache via `CacheService`

### Requirement 6.2: Offline Display with Indicator
✅ Cached data is displayed when offline with visual indicator banner

### Requirement 6.3: Background Refresh
✅ `NetworkProvider` automatically refetches stale queries when coming online
✅ React Query's `refetchOnReconnect: true` ensures background refresh

### Requirement 6.4: Stale Cache Refresh
✅ Cache has 24-hour TTL, fresh data is fetched when cache is stale and online

### Requirement 6.5: No Cache Offline Error
✅ Clear error messages displayed when no cached data exists and user is offline

## Testing

### Unit Tests
- `useNetworkStatus.test.ts`: Tests network status monitoring
- Existing cache tests validate storage and retrieval

### Manual Testing
1. Load app while online - data should fetch and cache
2. Turn off network - cached data should display with offline indicator
3. Turn network back on - data should refresh in background
4. Clear cache and go offline - appropriate error messages should display

## Future Enhancements

1. **Selective Sync**: Allow users to choose which data to cache
2. **Cache Size Management**: Implement cache size limits and cleanup
3. **Offline Queue**: Queue mutations for execution when back online
4. **Partial Offline**: Support some features offline while others require network
5. **Cache Invalidation**: Smart cache invalidation based on data freshness
