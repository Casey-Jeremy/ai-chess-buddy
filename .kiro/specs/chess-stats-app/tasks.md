# Implementation Plan

- [x] 1. Set up project structure and core interfaces






  - Create new Expo project with TypeScript
  - Install and configure NativeWind v5 for Tailwind CSS
  - Set up Expo Router for file-based navigation
  - Install React Query (TanStack Query) for data fetching
  - Install and configure Supabase client
  - Create base directory structure (services, components, types, utils)
  - _Requirements: 1.1, 7.1, 8.1_

- [x] 2. Implement data models and TypeScript interfaces





  - Create TypeScript interfaces for all data models (User, PlayerProfile, PlayerStats, Game, etc.)
  - Create analytics-specific interfaces (OpeningAnalysis, PhaseAnalysis, PerformanceDashboard, Pattern, ImprovementSuggestion)
  - Create API response type definitions
  - _Requirements: 2.1, 3.1, 9.1, 10.1, 11.1_

- [x] 2.1 Write property test for data model completeness


  - **Property 5: Profile display completeness**
  - **Validates: Requirements 2.2**

- [x] 2.2 Write property test for statistics organization


  - **Property 6: Statistics organization by game type**
  - **Validates: Requirements 2.4**

- [x] 3. Set up Supabase authentication with Google Sign-In




  - Configure Supabase project with Google OAuth provider
  - Create SupabaseService with signInWithGoogle(), signOut(), getCurrentUser()
  - Implement authentication state management with Context API
  - Create database schema for user accounts and Chess.com username linking
  - Implement linkChessComAccount() and getLinkedChessComUsername() methods
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3.1 Write property test for Google authentication flow


  - **Property 1: Google authentication initiates OAuth flow**
  - **Validates: Requirements 1.2**


- [x] 3.2 Write property test for username storage round trip

  - **Property 3: Valid username storage round trip**
  - **Validates: Requirements 1.5**
-

- [x] 4. Build Chess.com API service layer




  - Create ChessComApiService with centralized error handling
  - Implement getPlayerProfile() method
  - Implement getPlayerStats() method
  - Implement getGameArchives() method
  - Implement getMonthlyArchive() method
  - Add rate limiting and retry logic for API calls
  - _Requirements: 1.4, 2.1, 2.3, 3.1, 3.2_

- [x] 4.1 Write property test for username validation


  - **Property 2: Username validation triggers API verification**
  - **Validates: Requirements 1.4**

- [x] 4.2 Write property test for invalid username error handling


  - **Property 4: Invalid username error handling**
  - **Validates: Requirements 1.6**


- [x] 4.3 Write property test for API error handling


  - **Property 7: API error handling with retry**
  - **Validates: Requirements 2.5**

- [x] 5. Implement cache service for offline support





  - Create CacheService using AsyncStorage
  - Implement set(), get(), remove(), clear() methods
  - Implement isStale() method for cache expiration checking
  - Add cache key generation utilities
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 5.1 Write property test for cache storage


  - **Property 10: Successful fetch triggers cache storage**
  - **Validates: Requirements 6.1**

- [x] 5.2 Write property test for offline mode


  - **Property 11: Offline mode displays cached data with indicator**
  - **Validates: Requirements 6.2**

- [x] 5.3 Write property test for stale cache refresh


  - **Property 12: Stale cache triggers fresh fetch**
  - **Validates: Requirements 6.4**


- [x] 6. Create authentication screens




  - Build GoogleSignInScreen with Google Sign-In button
  - Build LinkAccountScreen with Chess.com username input and validation
  - Implement form validation and error display
  - Add loading states during authentication
  - Wire up navigation flow from sign-in to account linking
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 7. Build analytics engine core





  - Create AnalyticsService class
  - Implement analyzeOpenings() to extract and aggregate opening statistics
  - Implement calculatePerformanceMetrics() for dashboard data
  - Implement analyzeGamePhases() to categorize games by phase
  - Implement identifyPatterns() to detect common issues
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 11.1, 11.2_

- [x] 7.1 Write property test for opening analysis completeness


  - **Property 15: Opening analysis completeness**
  - **Validates: Requirements 9.2**

- [x] 7.2 Write property test for opening success rate calculation


  - **Property 16: Opening success rate calculation**
  - **Validates: Requirements 9.3**

- [x] 7.3 Write property test for dashboard metrics completeness


  - **Property 17: Dashboard metrics completeness**
  - **Validates: Requirements 10.1, 10.2**

- [x] 7.4 Write property test for phase analysis categorization


  - **Property 18: Phase analysis categorization**
  - **Validates: Requirements 11.1**

- [x] 8. Integrate AI-powered improvement suggestions

  - Set up OpenRouter SDK with free models router (openrouter/free)
  - Create AI service wrapper for OpenRouter API calls
  - Implement generateImprovementSuggestions() in AnalyticsService
  - Design prompts for analyzing opening weaknesses, middlegame patterns, and endgame issues
  - Parse AI responses into ImprovementSuggestion objects
  - Add error handling and fallbacks for AI service failures
  - _Requirements: 11.3, 11.4_

- [x] 9. Build dashboard screen with performance metrics
















  - Create DashboardScreen component
  - Implement React Query hooks for fetching player stats and games
  - Create MetricCard components for displaying key statistics
  - Build PerformanceChart component for rating trends
  - Display total games, win/loss/draw breakdown by time control
  - Show strongest and weakest time controls
  - Display AI-generated improvement suggestions
  - Add pull-to-refresh functionality
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9.1 Write unit tests for dashboard data transformations



- [x] 10. Create openings analysis screen





  - Build OpeningsScreen component
  - Fetch and analyze games for opening statistics
  - Create OpeningCard components to display each opening
  - Show opening name, frequency, win/loss/draw record, and success rate
  - Implement navigation to OpeningDetailScreen
  - Add loading and error states
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 11. Build opening detail screen





  - Create OpeningDetailScreen component
  - Display detailed statistics for selected opening
  - Show list of games where opening was played
  - Implement GameListItem component
  - Add navigation to individual game details
  - _Requirements: 9.4, 3.3_

- [x] 11.1 Write property test for game display completeness


  - **Property 8: Game display field completeness**
  - **Validates: Requirements 3.3**

- [x] 12. Create games archive screen





  - Build GamesScreen component
  - Fetch and display game archives organized by year and month
  - Implement month/year selection UI
  - Add navigation to MonthlyArchiveScreen
  - Handle empty states when no games exist
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 13. Build monthly archive screen




  - Create MonthlyArchiveScreen component
  - Fetch games for selected month using getMonthlyArchive()
  - Display games in a FlatList with GameListItem components
  - Implement navigation to GameDetailScreen
  - Add loading states and error handling
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 14. Create game detail screen




  - Build GameDetailScreen component
  - Display player names, ratings, result, time control, and opening
  - Parse and display PGN move list
  - Render final board position using ChessBoard component
  - Add error handling for failed game fetches
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 14.1 Write property test for game detail completeness

  - **Property 9: Game detail field completeness**
  - **Validates: Requirements 4.2**

- [x] 15. Build phase analysis screen




  - Create PhaseAnalysisScreen component
  - Display opening, middlegame, and endgame statistics
  - Show win rates for each phase
  - Display common patterns and example games
  - Show AI-generated insights for each phase
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 16. Create profile screen





  - Build ProfileScreen component
  - Display player profile information (avatar, username, join date, status)
  - Show linked Chess.com account
  - Add sign-out button
  - Implement settings and preferences UI
  - _Requirements: 2.1, 2.2_

- [x] 17. Build player search screen





  - Create PlayerSearchScreen component
  - Implement search input with validation
  - Fetch and display searched player profile
  - Show ratings across different time controls
  - Handle player not found errors
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17.1 Write property test for search profile display


  - **Property 19: Search profile basic stats display**
  - **Validates: Requirements 12.4**

- [x] 18. Create shared UI components





  - Build PlayerCard component
  - Build StatCard component
  - Build MetricCard component
  - Build OpeningCard component
  - Build GameListItem component
  - Build LoadingSpinner component
  - Build ErrorMessage component with retry button
  - Build OfflineIndicator banner component
  - Build ChessBoard component (or integrate react-native-chess-board)
  - Style all components with NativeWind/Tailwind CSS
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 18.1 Write property test for loading indicators


  - **Property 14: Loading states display indicators**
  - **Validates: Requirements 8.3**

- [x] 19. Implement tab navigation





  - Configure Expo Router tab layout
  - Create tab bar with Dashboard, Openings, Games, and Profile tabs
  - Add tab icons and labels
  - Implement state preservation across tab switches
  - Hide tabs when user is not authenticated
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 19.1 Write property test for tab state preservation


  - **Property 13: Tab navigation preserves state**
  - **Validates: Requirements 7.2, 7.3**

- [x] 20. Integrate React Query for data fetching












  - Set up QueryClient with appropriate cache configuration
  - Create custom hooks for all API calls (usePlayerProfile, usePlayerStats, useGames, etc.)
  - Implement stale-while-revalidate strategy
  - Add optimistic updates where appropriate
  - Configure retry logic and error handling
  - _Requirements: 2.5, 6.3_



- [x] 21. Add offline support and caching



  - Integrate CacheService with React Query
  - Implement cache-first data fetching strategy
  - Add OfflineIndicator to show when using cached data
  - Implement background refresh when coming online
  - Handle no-cache-offline scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 22. Implement error handling and loading states



  - Add consistent error boundaries
  - Implement skeleton screens for loading states
  - Add retry mechanisms for failed requests
  - Create user-friendly error messages
  - Handle rate limiting from Chess.com API
  - _Requirements: 2.5, 4.5, 8.3_

- [x] 23. Polish UI and styling





  - Apply consistent Tailwind CSS styling across all screens
  - Implement smooth animations and transitions
  - Add haptic feedback for interactions
  - Ensure proper spacing and alignment
  - Test on different iOS screen sizes
  - Optimize FlatList performance with getItemLayout
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 24. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Write integration tests




  - Test complete authentication and account linking flow
  - Test navigation between all screens
  - Test data fetching and caching behavior
  - Test offline mode functionality
  - Test analytics calculations end-to-end

- [x] 26. Set up E2E testing with Detox




  - Configure Detox for iOS
  - Write E2E test for Google Sign-In flow
  - Write E2E test for viewing dashboard
  - Write E2E test for browsing games and openings
  - Write E2E test for player search

- [x] 27. Final testing and bug fixes





  - Test app on physical iOS device
  - Verify all features work as expected
  - Fix any remaining bugs or issues
  - Optimize performance where needed
  - _Requirements: All_
