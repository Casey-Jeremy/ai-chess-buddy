# Design Document

## Overview

The ChessApp is a React Native iOS application built with Expo that provides analytics-based chess improvement insights. The app integrates with the Chess.com public REST API to fetch and analyze player game history, identifying patterns, strengths, and weaknesses in openings, middlegame, and endgame play. User authentication is handled through Google Sign-In via Supabase Auth, and data persistence is managed through Supabase. The UI is styled using Tailwind CSS via NativeWind v5.

The app functions as a personal chess performance dashboard, helping users understand what they're doing well and where they're making mistakes. The architecture follows a layered approach with clear separation between API integration, analytics processing, state management, data persistence, and UI components. The app uses Expo Router for file-based navigation and React Query for efficient data fetching and caching.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  (Expo Router Screens + React Native Components)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   State Management Layer                 │
│        (React Query + Context API + Local State)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  (API Services + Analytics Engine + Cache + Auth)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────┬──────────────────────────────────┐
│   Chess.com API      │      Supabase Backend            │
│   (External)         │   (Google Auth + Database)       │
└──────────────────────┴──────────────────────────────────┘
```

### Technology Stack

- **Framework**: Expo SDK (latest version)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: Tailwind CSS v4 via NativeWind v5
- **Data Fetching**: React Query (TanStack Query)
- **Backend**: Supabase (Authentication + PostgreSQL)
- **Local Storage**: AsyncStorage for caching
- **HTTP Client**: Fetch API with error handling wrapper

## Components and Interfaces

### API Service Layer

#### ChessComApiService

Handles all interactions with the Chess.com public API.

```typescript
interface ChessComApiService {
  getPlayerProfile(username: string): Promise<PlayerProfile>
  getPlayerStats(username: string): Promise<PlayerStats>
  getGameArchives(username: string): Promise<string[]>
  getMonthlyArchive(username: string, year: number, month: number): Promise<Game[]>
}
```

#### SupabaseService

Manages Google authentication and user data persistence.

```typescript
interface SupabaseService {
  signInWithGoogle(): Promise<User>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  linkChessComAccount(userId: string, chessComUsername: string): Promise<void>
  getLinkedChessComUsername(userId: string): Promise<string | null>
}
```

#### AnalyticsService

Processes game data to generate insights and statistics, including AI-powered improvement recommendations.

```typescript
interface AnalyticsService {
  analyzeOpenings(games: Game[]): Promise<OpeningAnalysis[]>
  analyzeGamePhases(games: Game[]): Promise<PhaseAnalysis>
  calculatePerformanceMetrics(games: Game[], stats: PlayerStats): Promise<PerformanceDashboard>
  identifyPatterns(games: Game[]): Promise<Pattern[]>
  generateImprovementSuggestions(games: Game[], analysis: PhaseAnalysis, openings: OpeningAnalysis[]): Promise<ImprovementSuggestion[]>
}

interface ImprovementSuggestion {
  category: 'opening' | 'middlegame' | 'endgame' | 'time-management'
  priority: 'high' | 'medium' | 'low'
  insight: string
  recommendation: string
  supportingData: {
    gamesAffected: number
    impactOnWinRate: number
  }
}
```

#### CacheService

Manages local data caching for offline support.

```typescript
interface CacheService {
  set<T>(key: string, data: T, ttl?: number): Promise<void>
  get<T>(key: string): Promise<CachedData<T> | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  isStale(key: string, maxAge: number): Promise<boolean>
}

interface CachedData<T> {
  data: T
  timestamp: number
  isStale: boolean
}
```

### Screen Components

#### Authentication Screens

- **GoogleSignInScreen** (`app/(auth)/google-sign-in.tsx`): Google OAuth sign-in
- **LinkAccountScreen** (`app/(auth)/link-account.tsx`): Chess.com username linking

#### Main App Screens (Tab Navigation)

- **DashboardScreen** (`app/(tabs)/index.tsx`): Performance dashboard with key metrics
- **OpeningsScreen** (`app/(tabs)/openings.tsx`): Opening analysis and statistics
- **GamesScreen** (`app/(tabs)/games.tsx`): Lists game archives by month/year
- **ProfileScreen** (`app/(tabs)/profile.tsx`): Displays player profile and settings

#### Detail Screens

- **GameDetailScreen** (`app/game/[id].tsx`): Shows detailed game information and moves
- **OpeningDetailScreen** (`app/opening/[name].tsx`): Games and stats for specific opening
- **PhaseAnalysisScreen** (`app/analysis/phases.tsx`): Middlegame and endgame analysis
- **PlayerSearchScreen** (`app/search.tsx`): Search and view other players
- **MonthlyArchiveScreen** (`app/archive/[year]/[month].tsx`): Games for specific month

### Shared Components

- **PlayerCard**: Displays player avatar, username, and basic info
- **GameListItem**: Shows game summary in a list
- **StatCard**: Displays a statistic with label and value
- **MetricCard**: Dashboard card showing key performance metric
- **OpeningCard**: Displays opening name, frequency, and success rate
- **PerformanceChart**: Line/bar chart for visualizing trends
- **LoadingSpinner**: Animated loading indicator
- **ErrorMessage**: Formatted error display with retry option
- **ChessBoard**: Renders chess board position (using react-native-chess-board or similar)
- **OfflineIndicator**: Banner showing offline status

## Data Models

### User

```typescript
interface User {
  id: string
  email: string
  chessComUsername: string | null
  createdAt: Date
  updatedAt: Date
}
```

### PlayerProfile

```typescript
interface PlayerProfile {
  username: string
  playerId: number
  url: string
  name?: string
  avatar?: string
  followers: number
  country: string
  joined: number
  lastOnline: number
  status: string
}
```

### PlayerStats

```typescript
interface PlayerStats {
  chess_bullet?: GameTypeStats
  chess_blitz?: GameTypeStats
  chess_rapid?: GameTypeStats
  chess_daily?: GameTypeStats
}

interface GameTypeStats {
  last: GameRecord
  best: GameRecord
  record: WinLossRecord
}

interface GameRecord {
  rating: number
  date: number
  gameId?: string
}

interface WinLossRecord {
  win: number
  loss: number
  draw: number
}
```

### Game

```typescript
interface Game {
  url: string
  pgn: string
  timeControl: string
  endTime: number
  rated: boolean
  white: PlayerGameInfo
  black: PlayerGameInfo
  result?: string
  opening?: string
}

interface PlayerGameInfo {
  username: string
  rating: number
  result: 'win' | 'loss' | 'draw' | 'resigned' | 'timeout' | 'abandoned'
}
```

### OpeningAnalysis

```typescript
interface OpeningAnalysis {
  openingName: string
  eco: string
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  successRate: number
  averageRating: number
  games: Game[]
}
```

### PhaseAnalysis

```typescript
interface PhaseAnalysis {
  openingPhase: PhaseStats
  middlegamePhase: PhaseStats
  endgamePhase: PhaseStats
}

interface PhaseStats {
  gamesDecided: number
  winRate: number
  commonPatterns: string[]
  exampleGames: Game[]
}
```

### PerformanceDashboard

```typescript
interface PerformanceDashboard {
  totalGames: number
  overallWinRate: number
  byTimeControl: {
    bullet: TimeControlMetrics
    blitz: TimeControlMetrics
    rapid: TimeControlMetrics
    daily: TimeControlMetrics
  }
  strongestTimeControl: string
  weakestTimeControl: string
  ratingTrend: RatingDataPoint[]
}

interface TimeControlMetrics {
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
  currentRating: number
}

interface RatingDataPoint {
  date: number
  rating: number
  timeControl: string
}
```

### Pattern

```typescript
interface Pattern {
  type: 'time-pressure' | 'conversion-rate' | 'opening-weakness' | 'endgame-issue'
  description: string
  frequency: number
  severity: 'low' | 'medium' | 'high'
  exampleGames: Game[]
  recommendation: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Google authentication initiates OAuth flow

*For any* Google Sign-In button tap, the app should initiate the Google OAuth flow through Supabase Auth.
**Validates: Requirements 1.2**

### Property 2: Username validation triggers API verification

*For any* Chess.com username submission, the validation process should make an API call to verify the username exists.
**Validates: Requirements 1.4**

### Property 3: Valid username storage round trip

*For any* valid Chess.com username, after linking it to a user account, querying Supabase should return the same username.
**Validates: Requirements 1.5**

### Property 4: Invalid username error handling

*For any* invalid Chess.com username, the submission should result in an error message being displayed.
**Validates: Requirements 1.6**

### Property 5: Profile display completeness

*For any* player profile fetched from the API, the rendered output should contain username, avatar, join date, and status fields.
**Validates: Requirements 2.2**

### Property 6: Statistics organization by game type

*For any* player statistics data, the displayed statistics should be grouped by game type (bullet, blitz, rapid, daily).
**Validates: Requirements 2.4**

### Property 7: API error handling with retry

*For any* failed API request, the UI should display an error message and provide a retry mechanism.
**Validates: Requirements 2.5**

### Property 8: Game display field completeness

*For any* game in a list, the rendered output should contain opponent username, game result, time control, and date.
**Validates: Requirements 3.3**

### Property 9: Game detail field completeness

*For any* game detail view, the rendered output should contain player names, ratings, result, time control, and opening information.
**Validates: Requirements 4.2**

### Property 10: Successful fetch triggers cache storage

*For any* successful API response, the cache should contain that data after the fetch completes.
**Validates: Requirements 6.1**

### Property 11: Offline mode displays cached data with indicator

*For any* cached data, when the app is offline, the data should be displayed along with a visual indicator showing it's not current.
**Validates: Requirements 6.2**

### Property 12: Stale cache triggers fresh fetch

*For any* cached data older than 24 hours, when the app is online, a fresh fetch should be initiated.
**Validates: Requirements 6.4**

### Property 13: Tab navigation preserves state

*For any* tab navigation action, the previous tab's state (scroll position, loaded data) should be preserved when returning to it.
**Validates: Requirements 7.2, 7.3**

### Property 14: Loading states display indicators

*For any* data loading operation, a loading indicator (spinner or skeleton screen) should be visible during the loading period.
**Validates: Requirements 8.3**

### Property 15: Opening analysis completeness

*For any* opening in the analysis results, the rendered output should contain opening name, frequency played, and win/loss/draw record.
**Validates: Requirements 9.2**

### Property 16: Opening success rate calculation

*For any* opening with games played, the success rate should equal (wins + 0.5 * draws) / total games.
**Validates: Requirements 9.3**

### Property 17: Dashboard metrics completeness

*For any* performance dashboard, the displayed metrics should include total games, win/loss/draw counts for each time control, and rating trends.
**Validates: Requirements 10.1, 10.2**

### Property 18: Phase analysis categorization

*For any* set of games, the phase analysis should categorize games into opening, middlegame, and endgame based on when critical moments occurred.
**Validates: Requirements 11.1**

### Property 19: Search profile basic stats display

*For any* searched player profile, the rendered output should contain ratings across different time controls.
**Validates: Requirements 12.4**

## Error Handling

### API Error Handling

All API calls will be wrapped in a centralized error handler that:

1. Catches network errors and displays user-friendly messages
2. Handles HTTP error codes (404, 429, 500, etc.) with specific messages
3. Implements exponential backoff for rate limiting (429 errors)
4. Provides retry mechanisms for transient failures
5. Logs errors for debugging purposes

```typescript
interface ApiError {
  code: string
  message: string
  retryable: boolean
  statusCode?: number
}

async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options?: { retries?: number; fallback?: T }
): Promise<T> {
  // Implementation with retry logic and error transformation
}
```

### Authentication Error Handling

Authentication errors will be handled by:

1. Detecting expired Google OAuth sessions and prompting re-authentication
2. Handling Google Sign-In cancellations gracefully
3. Managing network failures during auth operations
4. Providing clear error messages for authentication failures

### Cache Error Handling

Cache operations will handle:

1. Storage quota exceeded errors by clearing old data
2. Corrupted cache data by invalidating and refetching
3. Read/write failures with graceful degradation

### UI Error States

Each screen will implement consistent error states:

1. Full-screen error for critical failures (no auth, no network on first load)
2. Inline errors for form validation
3. Toast/snackbar notifications for transient errors
4. Empty states with helpful messages and actions

## Testing Strategy

### Unit Testing

Unit tests will be written using Jest and React Native Testing Library to cover:

- **API Service Functions**: Test each API service method with mocked fetch responses
- **Data Transformation**: Test parsing and transformation of API responses to app models
- **Analytics Functions**: Test opening analysis, phase analysis, and performance metric calculations
- **Cache Operations**: Test cache set, get, and invalidation logic
- **Authentication Flow**: Test Google Sign-In and account linking logic
- **Utility Functions**: Test date formatting, game result parsing, success rate calculations, and other helpers

Example unit test structure:

```typescript
describe('ChessComApiService', () => {
  it('should fetch player profile successfully', async () => {
    // Mock fetch response
    // Call getPlayerProfile
    // Assert correct data transformation
  })

  it('should handle 404 errors for non-existent players', async () => {
    // Mock 404 response
    // Call getPlayerProfile
    // Assert error is thrown with correct message
  })
})
```

### Property-Based Testing

Property-based tests will be written using **fast-check** (a property-based testing library for TypeScript/JavaScript) to verify universal properties across many inputs. Each property-based test will run a minimum of 100 iterations.

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: chess-stats-app, Property {number}: {property_text}**`

Property-based tests will cover:

- **Username Validation**: Generate random valid and invalid usernames to test validation logic
- **Data Display Completeness**: Generate random player profiles, games, and stats to verify all required fields are rendered
- **Analytics Calculations**: Generate random game sets to verify opening analysis, success rate calculations, and phase categorization
- **Cache Behavior**: Generate random data and timestamps to verify cache storage and retrieval
- **Error Handling**: Generate various error conditions to verify consistent error display

Example property-based test structure:

```typescript
import fc from 'fast-check'

describe('Opening Success Rate Calculation', () => {
  it('should calculate success rate as (wins + 0.5 * draws) / total', () => {
    // **Feature: chess-stats-app, Property 16: Opening success rate calculation**
    fc.assert(
      fc.property(
        fc.record({
          wins: fc.nat(100),
          losses: fc.nat(100),
          draws: fc.nat(100)
        }),
        (record) => {
          const total = record.wins + record.losses + record.draws
          if (total === 0) return true // Skip empty case
          
          const successRate = calculateSuccessRate(record)
          const expected = (record.wins + 0.5 * record.draws) / total
          
          expect(successRate).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Testing

Integration tests will verify:

- **Navigation Flow**: Test complete user journeys through the app
- **API Integration**: Test actual API calls to Chess.com (with rate limiting)
- **Supabase Integration**: Test Google authentication and data persistence
- **Analytics Pipeline**: Test end-to-end analytics generation from raw game data
- **Offline Behavior**: Test app functionality with network disabled

### End-to-End Testing

E2E tests using Detox will cover:

- Complete user Google Sign-In and account linking flow
- Viewing dashboard with performance metrics
- Browsing opening analysis and game archives
- Viewing detailed game information
- Search functionality for other players

## Performance Considerations

### Data Fetching Optimization

1. **React Query Configuration**: Use stale-while-revalidate strategy with appropriate cache times
2. **Pagination**: Implement pagination for game archives to avoid loading large datasets
3. **Lazy Loading**: Load game details only when user navigates to detail screen
4. **Request Deduplication**: React Query automatically deduplicates simultaneous requests

### Rendering Optimization

1. **FlatList Optimization**: Use `getItemLayout` and `removeClippedSubviews` for long lists
2. **Memoization**: Use `React.memo` for expensive components
3. **Image Optimization**: Use Expo Image with caching and placeholder support
4. **Avoid Unnecessary Re-renders**: Use `useCallback` and `useMemo` appropriately

### Bundle Size Optimization

1. **Code Splitting**: Use dynamic imports for less frequently used screens
2. **Tree Shaking**: Ensure proper ES module imports to enable tree shaking
3. **Asset Optimization**: Compress images and use appropriate formats

## Security Considerations

1. **API Key Management**: Store any API keys in environment variables, not in code
2. **Supabase Security**: Use Row Level Security (RLS) policies to protect user data
3. **Input Validation**: Validate and sanitize all user inputs before API calls
4. **HTTPS Only**: Ensure all API calls use HTTPS
5. **Token Storage**: Store authentication tokens securely using Expo SecureStore

## Deployment Strategy

1. **Development**: Use Expo Go for rapid development and testing
2. **Preview**: Create development builds for internal testing
3. **Production**: Build standalone iOS app for App Store submission
4. **Updates**: Use EAS Update for over-the-air updates for non-native changes

## Future Enhancements

Potential features for future iterations:

1. **AI-Powered Insights**: Use machine learning to generate personalized improvement recommendations
2. **Game Analysis Engine**: Integrate Stockfish or similar engine for move-by-move analysis
3. **Social Features**: Follow other players, compare statistics with friends
4. **Offline Game Viewing**: Download games for offline analysis
5. **Custom Themes**: Allow users to customize app appearance
6. **Widget Support**: iOS home screen widget showing key performance metrics
7. **Push Notifications**: Notify users of significant rating changes or milestones
8. **Export Reports**: Generate PDF reports of performance analytics
