import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NetworkProvider } from '../contexts/NetworkContext';
import ErrorBoundary from '../components/ErrorBoundary';
import '../global.css';

// Create a client with optimized configuration
// Requirements: 2.5, 6.3
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests with smart rate-limit handling
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or other non-retryable errors
        if (error?.retryable === false) return false;
        // Don't retry on explicit non-retryable codes
        if (error?.code === 'NOT_FOUND') return false;
        // Allow more retries for rate-limited requests (429)
        if (error?.code === 'RATE_LIMITED' || error?.statusCode === 429) {
          return failureCount < 4; // Allow up to 4 retries for rate limiting
        }
        // Retry up to 2 times for other retryable errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: any) => {
        // Longer delay for rate-limited requests
        if ((error as any)?.code === 'RATE_LIMITED' || (error as any)?.statusCode === 429) {
          return Math.min(2000 * 2 ** attemptIndex, 30000); // 2s, 4s, 8s, 16s
        }
        return Math.min(1000 * 2 ** attemptIndex, 10000);
      },
      
      // Stale-while-revalidate strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (formerly cacheTime)
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true, // Background refresh when coming online
      
      // Network mode for offline support - Requirements: 6.2, 6.3
      networkMode: 'offlineFirst', // Try cache first when offline
    },
    mutations: {
      retry: 1,
      networkMode: 'online', // Mutations require network
    },
  },
});

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace('/(auth)/google-sign-in');
    } else if (user && !user.chessComUsername && !inAuthGroup) {
      // Redirect to link account if authenticated but no Chess.com username
      router.replace('/(auth)/link-account');
    } else if (user && user.chessComUsername && inAuthGroup) {
      // If fully set up and still on auth flow, move to app tabs.
      // Keep deep routes (archive/game/opening/etc.) accessible.
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#ffffff" />
          <NetworkProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </NetworkProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
